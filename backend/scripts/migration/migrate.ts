/**
 * 数据迁移脚本：从原版 MySQL 迁移到新版 PostgreSQL
 *
 * 使用方法:
 * 1. 确保 PostgreSQL 数据库已创建并运行
 * 2. 设置环境变量或修改下方配置
 * 3. 运行: npx ts-node scripts/migration/migrate.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import {
  TABLE_MAPPING,
  TABLE_FIELD_MAPPING,
  COMMON_FIELD_MAPPING,
  SKIP_TABLES,
  MIGRATION_ORDER,
  createIdMappingCache,
  IdMappingCache,
} from './table-mapping';

// ========== 配置 ==========
const CONFIG = {
  // 源 SQL 文件路径
  sqlFilePath: '/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com/db_tfkz_com_20221006_210534.sql',

  // PostgreSQL 连接配置
  pg: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'order_management',
  },

  // 是否清空目标表后再导入
  truncateBeforeImport: true,

  // 批量插入大小
  batchSize: 100,

  // 是否输出详细日志
  verbose: true,
};

// ========== 工具函数 ==========

/**
 * 将 Unix 时间戳转换为 PostgreSQL timestamp
 */
function unixToTimestamp(unixTime: number | string | null): string | null {
  if (!unixTime || unixTime === 0 || unixTime === '0') {
    return null;
  }
  const timestamp = typeof unixTime === 'string' ? parseInt(unixTime) : unixTime;
  if (isNaN(timestamp) || timestamp <= 0) {
    return null;
  }
  return new Date(timestamp * 1000).toISOString();
}

/**
 * 转换字段名
 */
function mapFieldName(tableName: string, fieldName: string): string {
  // 先检查表特定映射
  const tableMapping = TABLE_FIELD_MAPPING[tableName];
  if (tableMapping && tableMapping[fieldName]) {
    return tableMapping[fieldName];
  }
  // 再检查通用映射
  if (COMMON_FIELD_MAPPING[fieldName]) {
    return COMMON_FIELD_MAPPING[fieldName];
  }
  // 转换下划线命名为驼峰命名
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 解析 MySQL INSERT 语句
 */
function parseInsertStatement(sql: string): { tableName: string; values: any[][] } | null {
  // 匹配 INSERT INTO `table_name` VALUES (...), (...);
  const match = sql.match(/INSERT INTO `([^`]+)` VALUES\s*(.+);?$/s);
  if (!match) {
    return null;
  }

  const tableName = match[1];
  const valuesStr = match[2];

  // 解析所有值组
  const values: any[][] = [];
  let currentGroup: any[] = [];
  let inString = false;
  let stringChar = '';
  let escaped = false;
  let currentValue = '';
  let depth = 0;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escaped) {
      currentValue += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      currentValue += char;
      continue;
    }

    if (inString) {
      currentValue += char;
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      currentValue += char;
      continue;
    }

    if (char === '(') {
      if (depth === 0) {
        currentGroup = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
      depth++;
      continue;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        // 结束一个值组
        if (currentValue.trim()) {
          currentGroup.push(parseValue(currentValue.trim()));
        }
        values.push(currentGroup);
        currentValue = '';
      } else {
        currentValue += char;
      }
      continue;
    }

    if (char === ',' && depth === 1) {
      // 值分隔符
      if (currentValue.trim()) {
        currentGroup.push(parseValue(currentValue.trim()));
      }
      currentValue = '';
      continue;
    }

    if (depth > 0) {
      currentValue += char;
    }
  }

  return { tableName, values };
}

/**
 * 解析单个值
 */
function parseValue(str: string): any {
  if (str === 'NULL' || str === 'null') {
    return null;
  }
  if (str.startsWith("'") && str.endsWith("'")) {
    // 字符串值，处理转义
    return str.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  // 数值
  const num = parseFloat(str);
  if (!isNaN(num)) {
    return num;
  }
  return str;
}

/**
 * 获取表的列名（从 CREATE TABLE 语句）
 */
function getTableColumns(sql: string, tableName: string): string[] {
  const regex = new RegExp(`CREATE TABLE \`${tableName}\` \\(([^;]+)\\)`, 's');
  const match = sql.match(regex);
  if (!match) {
    return [];
  }

  const columns: string[] = [];
  const lines = match[1].split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('`')) {
      const colMatch = trimmed.match(/^`([^`]+)`/);
      if (colMatch) {
        columns.push(colMatch[1]);
      }
    }
  }

  return columns;
}

// ========== 迁移类 ==========

class DataMigrator {
  private pool: Pool;
  private sqlContent: string = '';
  private idCache: IdMappingCache;
  private tableColumns: Map<string, string[]> = new Map();

  constructor() {
    this.pool = new Pool(CONFIG.pg);
    this.idCache = createIdMappingCache();
  }

  async run(): Promise<void> {
    console.log('========================================');
    console.log('开始数据迁移: MySQL -> PostgreSQL');
    console.log('========================================\n');

    try {
      // 读取 SQL 文件
      console.log('1. 读取源 SQL 文件...');
      this.sqlContent = fs.readFileSync(CONFIG.sqlFilePath, 'utf-8');
      console.log(`   文件大小: ${(this.sqlContent.length / 1024 / 1024).toFixed(2)} MB`);

      // 解析所有表的列
      console.log('\n2. 解析表结构...');
      for (const oldTable of Object.keys(TABLE_MAPPING)) {
        const columns = getTableColumns(this.sqlContent, oldTable);
        if (columns.length > 0) {
          this.tableColumns.set(oldTable, columns);
          if (CONFIG.verbose) {
            console.log(`   ${oldTable}: ${columns.length} 列`);
          }
        }
      }

      // 连接数据库
      console.log('\n3. 连接 PostgreSQL 数据库...');
      await this.pool.query('SELECT 1');
      console.log('   连接成功!');

      // 按顺序迁移表
      console.log('\n4. 开始迁移数据...\n');

      for (const oldTable of MIGRATION_ORDER) {
        if (SKIP_TABLES.includes(oldTable)) {
          console.log(`   跳过: ${oldTable} (在跳过列表中)`);
          continue;
        }

        const newTable = TABLE_MAPPING[oldTable];
        if (!newTable) {
          console.log(`   跳过: ${oldTable} (无映射)`);
          continue;
        }

        await this.migrateTable(oldTable, newTable);
      }

      console.log('\n========================================');
      console.log('数据迁移完成!');
      console.log('========================================');

    } catch (error) {
      console.error('迁移失败:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async migrateTable(oldTable: string, newTable: string): Promise<void> {
    console.log(`\n   迁移: ${oldTable} -> ${newTable}`);

    // 获取原表列
    const columns = this.tableColumns.get(oldTable);
    if (!columns || columns.length === 0) {
      console.log(`   警告: 未找到 ${oldTable} 的列定义`);
      return;
    }

    // 从 SQL 中提取 INSERT 语句
    const insertRegex = new RegExp(`INSERT INTO \`${oldTable}\` VALUES\\s*(.+?);`, 'gs');
    const matches = this.sqlContent.matchAll(insertRegex);

    let totalRows = 0;
    let insertedRows = 0;

    for (const match of matches) {
      const result = parseInsertStatement(match[0]);
      if (!result) continue;

      totalRows += result.values.length;

      // 批量处理
      for (let i = 0; i < result.values.length; i += CONFIG.batchSize) {
        const batch = result.values.slice(i, i + CONFIG.batchSize);

        for (const row of batch) {
          try {
            await this.insertRow(oldTable, newTable, columns, row);
            insertedRows++;
          } catch (err: any) {
            if (CONFIG.verbose) {
              console.error(`   错误 (${oldTable}): ${err.message}`);
            }
          }
        }
      }
    }

    console.log(`   完成: ${insertedRows}/${totalRows} 行`);
  }

  private async insertRow(
    oldTable: string,
    newTable: string,
    columns: string[],
    values: any[]
  ): Promise<void> {
    // 构建数据对象
    const data: Record<string, any> = {};
    const oldId = values[0]; // 假设第一列是 ID

    for (let i = 0; i < columns.length && i < values.length; i++) {
      const oldField = columns[i];
      const newField = mapFieldName(oldTable, oldField);
      let value = values[i];

      // 处理时间戳字段
      if (oldField.includes('time') || oldField.includes('_at')) {
        value = unixToTimestamp(value);
      }

      // 处理 ID 引用
      value = this.resolveIdReference(oldTable, oldField, value);

      data[newField] = value;
    }

    // 生成新 UUID
    const newId = uuidv4();
    data['id'] = newId;

    // 缓存 ID 映射
    this.cacheIdMapping(oldTable, oldId, newId);

    // 移除不需要的字段
    delete data['deletedAt'];

    // 构建 INSERT 语句
    const fields = Object.keys(data).filter(k => data[k] !== undefined);
    const placeholders = fields.map((_, i) => `$${i + 1}`);
    const insertValues = fields.map(f => data[f]);

    // 转换字段名为 PostgreSQL 风格（snake_case）
    const pgFields = fields.map(f => this.camelToSnake(f));

    const sql = `
      INSERT INTO "${newTable}" (${pgFields.map(f => `"${f}"`).join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT DO NOTHING
    `;

    await this.pool.query(sql, insertValues);
  }

  private resolveIdReference(tableName: string, fieldName: string, value: any): any {
    if (value === null || value === undefined) return value;

    // 用户ID引用
    if (fieldName === 'user_id' || fieldName === 'uid') {
      return this.idCache.users.get(value) || value;
    }
    // 商家ID引用
    if (fieldName === 'seller_id') {
      return this.idCache.merchants.get(value) || value;
    }
    // 店铺ID引用
    if (fieldName === 'shop_id') {
      return this.idCache.shops.get(value) || value;
    }
    // 商品ID引用
    if (fieldName === 'goods_id') {
      return this.idCache.goods.get(value) || value;
    }
    // 任务ID引用
    if (fieldName === 'task_id' || fieldName === 'seller_task_id') {
      return this.idCache.tasks.get(value) || value;
    }
    // 买号ID引用
    if (fieldName === 'user_buyno_id') {
      return this.idCache.buyerAccounts.get(value) || value;
    }
    // 银行ID引用
    if (fieldName === 'bank_id') {
      return this.idCache.banks.get(value) || value;
    }
    // 管理员ID引用
    if (fieldName === 'admin_id') {
      return this.idCache.adminUsers.get(value) || value;
    }

    return value;
  }

  private cacheIdMapping(tableName: string, oldId: number, newId: string): void {
    switch (tableName) {
      case 'tfkz_users':
        this.idCache.users.set(oldId, newId);
        break;
      case 'tfkz_seller':
        this.idCache.merchants.set(oldId, newId);
        break;
      case 'tfkz_shop':
        this.idCache.shops.set(oldId, newId);
        break;
      case 'tfkz_goods':
        this.idCache.goods.set(oldId, newId);
        break;
      case 'tfkz_seller_task':
        this.idCache.tasks.set(oldId, newId);
        break;
      case 'tfkz_user_task':
        this.idCache.orders.set(oldId, newId);
        break;
      case 'tfkz_user_buyno':
        this.idCache.buyerAccounts.set(oldId, newId);
        break;
      case 'tfkz_user_bank':
        this.idCache.bankCards.set(oldId, newId);
        break;
      case 'tfkz_seller_bank':
        this.idCache.merchantBankCards.set(oldId, newId);
        break;
      case 'tfkz_bank':
        this.idCache.banks.set(oldId, newId);
        break;
      case 'tfkz_admin_user':
        this.idCache.adminUsers.set(oldId, newId);
        break;
      case 'tfkz_review_task':
        this.idCache.reviewTasks.set(oldId, newId);
        break;
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

// ========== 运行迁移 ==========
const migrator = new DataMigrator();
migrator.run().catch(console.error);
