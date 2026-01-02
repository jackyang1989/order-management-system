/**
 * 简化版数据迁移脚本 - 使用 NestJS TypeORM
 *
 * 此脚本直接解析 MySQL dump 文件并插入到 PostgreSQL
 *
 * 使用方法:
 * 1. cd backend
 * 2. npm run build
 * 3. npx ts-node scripts/migration/migrate-simple.ts
 */

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';

// ========== 配置 ==========
const SQL_FILE = '/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com/db_tfkz_com_20221006_210534.sql';

const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
};

// ID 映射缓存
const idMap = {
  users: new Map<number, string>(),
  merchants: new Map<number, string>(),
  shops: new Map<number, string>(),
  goods: new Map<number, string>(),
  tasks: new Map<number, string>(),
  orders: new Map<number, string>(),
  buyerAccounts: new Map<number, string>(),
  banks: new Map<number, string>(),
  adminUsers: new Map<number, string>(),
};

// Unix 时间戳转 ISO 字符串
function unixToIso(ts: number | null): string | null {
  if (!ts || ts <= 0) return null;
  return new Date(ts * 1000).toISOString();
}

// 解析 INSERT 语句中的值
function parseValues(valuesStr: string): any[][] {
  const results: any[][] = [];
  let current: any[] = [];
  let buffer = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  let depth = 0;

  for (let i = 0; i < valuesStr.length; i++) {
    const c = valuesStr[i];

    if (escaped) {
      buffer += c;
      escaped = false;
      continue;
    }

    if (c === '\\') {
      escaped = true;
      buffer += c;
      continue;
    }

    if (inString) {
      buffer += c;
      if (c === stringChar) inString = false;
      continue;
    }

    if (c === "'" || c === '"') {
      inString = true;
      stringChar = c;
      buffer += c;
      continue;
    }

    if (c === '(') {
      if (depth === 0) {
        current = [];
        buffer = '';
      } else {
        buffer += c;
      }
      depth++;
      continue;
    }

    if (c === ')') {
      depth--;
      if (depth === 0) {
        if (buffer.trim()) current.push(parseValue(buffer.trim()));
        results.push(current);
        buffer = '';
      } else {
        buffer += c;
      }
      continue;
    }

    if (c === ',' && depth === 1) {
      if (buffer.trim()) current.push(parseValue(buffer.trim()));
      buffer = '';
      continue;
    }

    if (depth > 0) buffer += c;
  }

  return results;
}

function parseValue(s: string): any {
  if (s === 'NULL' || s === 'null') return null;
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  const n = parseFloat(s);
  return isNaN(n) ? s : n;
}

// ========== 迁移函数 ==========

async function migrateUsers(client: Client, sql: string) {
  console.log('\n迁移买手用户 (tfkz_users -> users)...');

  const match = sql.match(/INSERT INTO `tfkz_users` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_users 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, username, password, mobile, qq, vip, vipTime, deposit, reward,
           frozenDeposit, frozenReward, inviteCode, tjuser, note, state, createTime] = row;

    const newId = uuidv4();
    idMap.users.set(id, newId);

    try {
      await client.query(`
        INSERT INTO users (id, username, password, phone, qq, is_vip, vip_expire_time,
          balance, silver, frozen_balance, frozen_silver, invite_code, referrer_id,
          remark, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, username, password, mobile?.toString(), qq?.toString(),
        vip === 1, unixToIso(vipTime),
        deposit || 0, reward || 0, frozenDeposit || 0, frozenReward || 0,
        inviteCode, tjuser?.toString(), note, state,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateMerchants(client: Client, sql: string) {
  console.log('\n迁移商家 (tfkz_seller -> merchants)...');

  const match = sql.match(/INSERT INTO `tfkz_seller` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_seller 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, sellerName, loginPwd, mobile, qq, vip, vipTime, balance, reward,
           frozenBalance, frozenReward, inviteCode, tjuser, note, state, createTime] = row;

    const newId = uuidv4();
    idMap.merchants.set(id, newId);

    try {
      await client.query(`
        INSERT INTO merchants (id, merchant_name, password, phone, qq, is_vip, vip_expire_time,
          balance, silver, frozen_balance, frozen_silver, invite_code, referrer_id,
          remark, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, sellerName, loginPwd, mobile?.toString(), qq?.toString(),
        vip === 1, unixToIso(vipTime),
        balance || 0, reward || 0, frozenBalance || 0, frozenReward || 0,
        inviteCode, tjuser?.toString(), note, state,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateShops(client: Client, sql: string) {
  console.log('\n迁移店铺 (tfkz_shop -> shops)...');

  const match = sql.match(/INSERT INTO `tfkz_shop` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_shop 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, shopName, shopType, shopLogo, shopWw, shopLink,
           sellerName, sellerPhone, sellerAddress, expressName, expressCode,
           logistics, code, state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.shops.set(id, newId);

    const merchantId = idMap.merchants.get(sellerId);
    if (!merchantId) {
      console.log(`  跳过店铺 ${id}: 商家 ${sellerId} 未找到`);
      continue;
    }

    try {
      await client.query(`
        INSERT INTO shops (id, merchant_id, shop_name, shop_type, logo_url, wangwang_id,
          shop_url, seller_name, seller_phone, seller_address, express_name, express_code,
          need_logistics, warehouse_code, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, merchantId, shopName, shopType, shopLogo, shopWw, shopLink,
        sellerName, sellerPhone?.toString(), sellerAddress, expressName, expressCode,
        logistics === 1, code, state,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateBuyerAccounts(client: Client, sql: string) {
  console.log('\n迁移买号 (tfkz_user_buyno -> buyer_accounts)...');

  const match = sql.match(/INSERT INTO `tfkz_user_buyno` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_user_buyno 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, wwid, wwpro, wwcity, wwdaimg, ipimg, addressname, addresspro,
           addresscity, addressarea, addresstext, addressphone, alipayname,
           idcardimg, alipayimg, state, creatTime, uid, note, detailAddress,
           frozenTime, star] = row;

    const newId = uuidv4();
    idMap.buyerAccounts.set(id, newId);

    const userId = idMap.users.get(parseInt(uid));

    try {
      await client.query(`
        INSERT INTO buyer_accounts (id, user_id, account_name, wangwang_province, wangwang_city,
          archive_image, ip_image, receiver_name, province, city, district, address_remark,
          receiver_phone, alipay_name, id_card_image, alipay_image, status, frozen_time, star,
          full_address, reject_reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, userId || uid?.toString(), wwid, wwpro, wwcity,
        wwdaimg, ipimg, addressname, addresspro, addresscity, addressarea, addresstext,
        addressphone?.toString(), alipayname, idcardimg, alipayimg,
        state, unixToIso(frozenTime), star || 1,
        detailAddress, note,
        unixToIso(parseInt(creatTime)) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateBanks(client: Client, sql: string) {
  console.log('\n迁移银行列表 (tfkz_bank -> banks)...');

  const match = sql.match(/INSERT INTO `tfkz_bank` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_bank 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, bankName, bankLogo, state, createTime] = row;

    const newId = uuidv4();
    idMap.banks.set(id, newId);

    try {
      await client.query(`
        INSERT INTO banks (id, bank_name, logo_url, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, bankName, bankLogo, state === 1,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateNotices(client: Client, sql: string) {
  console.log('\n迁移公告 (tfkz_notice -> notices)...');

  const match = sql.match(/INSERT INTO `tfkz_notice` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_notice 数据');
    return;
  }

  const rows = parseValues(match[1]);
  let count = 0;

  for (const row of rows) {
    const [id, title, content, state, adminId, type, createTime, updateTime] = row;

    const newId = uuidv4();

    try {
      await client.query(`
        INSERT INTO notices (id, title, content, status, admin_id, target_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, title, content, state === 1 ? 'published' : 'draft',
        adminId?.toString(), type === 1 ? 'buyer' : 'merchant',
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`  错误: ${e.message}`);
    }
  }

  console.log(`  完成: ${count}/${rows.length} 行`);
}

async function migrateSystemConfig(client: Client, sql: string) {
  console.log('\n迁移系统配置 (tfkz_system -> system_global_configs)...');

  const match = sql.match(/INSERT INTO `tfkz_system` VALUES\s*(.+?);/s);
  if (!match) {
    console.log('  未找到 tfkz_system 数据');
    return;
  }

  const rows = parseValues(match[1]);
  if (rows.length === 0) return;

  const row = rows[0];
  const [id, userVipMoney, sellerVipMoney, userServiceCharge, sellerServiceCharge,
         sellerTaskService, userMinCash, sellerMinCash, payAward, registerGive,
         buyerInvite, sellerInvite, taskPass, passTime] = row;

  const newId = uuidv4();

  try {
    await client.query(`
      INSERT INTO system_global_configs (id, buyer_vip_price, merchant_vip_price,
        buyer_withdraw_fee, merchant_withdraw_fee, merchant_task_fee,
        buyer_min_withdraw, merchant_min_withdraw, recharge_reward, register_gift,
        buyer_invite_reward, merchant_invite_reward, task_auto_pass, task_pass_time,
        created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO NOTHING
    `, [
      newId, userVipMoney, sellerVipMoney, userServiceCharge, sellerServiceCharge,
      sellerTaskService, userMinCash, sellerMinCash, payAward, registerGive,
      buyerInvite, sellerInvite, taskPass === 1, passTime,
      new Date().toISOString(), new Date().toISOString()
    ]);
    console.log('  完成: 1 行');
  } catch (e: any) {
    console.error(`  错误: ${e.message}`);
  }
}

// ========== 主函数 ==========

async function main() {
  console.log('========================================');
  console.log('数据迁移: MySQL -> PostgreSQL');
  console.log('========================================');

  // 读取 SQL 文件
  console.log('\n读取源 SQL 文件...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  // 连接 PostgreSQL
  console.log('\n连接 PostgreSQL...');
  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log('连接成功!');

    // 按依赖顺序迁移
    await migrateBanks(client, sql);
    await migrateSystemConfig(client, sql);
    await migrateUsers(client, sql);
    await migrateMerchants(client, sql);
    await migrateShops(client, sql);
    await migrateBuyerAccounts(client, sql);
    await migrateNotices(client, sql);

    // 更多表可以继续添加...

    console.log('\n========================================');
    console.log('迁移完成!');
    console.log('========================================');

    // 输出 ID 映射统计
    console.log('\nID 映射统计:');
    console.log(`  用户: ${idMap.users.size}`);
    console.log(`  商家: ${idMap.merchants.size}`);
    console.log(`  店铺: ${idMap.shops.size}`);
    console.log(`  买号: ${idMap.buyerAccounts.size}`);
    console.log(`  银行: ${idMap.banks.size}`);

  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    await client.end();
  }
}

main();
