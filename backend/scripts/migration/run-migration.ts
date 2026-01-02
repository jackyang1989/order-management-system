/**
 * 数据迁移脚本 - 根据实际表结构优化
 *
 * 使用方法:
 * cd backend
 * npx ts-node scripts/migration/run-migration.ts
 */

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';

// ========== 配置 ==========
const SQL_FILE = '/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com/db_tfkz_com_20221006_210534.sql';

const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'jianouyang',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
};

// ID 映射
const idMap = {
  users: new Map<number, string>(),
  merchants: new Map<number, string>(),
  shops: new Map<number, string>(),
  goods: new Map<number, string>(),
  tasks: new Map<number, string>(),
  buyerAccounts: new Map<number, string>(),
  banks: new Map<number, string>(),
  adminUsers: new Map<number, string>(),
};

// 工具函数
function unixToIso(ts: number | string | null): string | null {
  if (!ts) return null;
  const num = typeof ts === 'string' ? parseInt(ts) : ts;
  if (isNaN(num) || num <= 0) return null;
  return new Date(num * 1000).toISOString();
}

function parseInsertValues(sql: string, tableName: string): any[][] {
  const regex = new RegExp(`INSERT INTO \`${tableName}\` VALUES\\s*(.+?);`, 's');
  const match = sql.match(regex);
  if (!match) return [];
  return parseValues(match[1]);
}

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
    if (escaped) { buffer += c; escaped = false; continue; }
    if (c === '\\') { escaped = true; buffer += c; continue; }
    if (inString) { buffer += c; if (c === stringChar) inString = false; continue; }
    if (c === "'" || c === '"') { inString = true; stringChar = c; buffer += c; continue; }
    if (c === '(') { if (depth === 0) { current = []; buffer = ''; } else { buffer += c; } depth++; continue; }
    if (c === ')') { depth--; if (depth === 0) { if (buffer.trim()) current.push(parseValue(buffer.trim())); results.push(current); buffer = ''; } else { buffer += c; } continue; }
    if (c === ',' && depth === 1) { if (buffer.trim()) current.push(parseValue(buffer.trim())); buffer = ''; continue; }
    if (depth > 0) buffer += c;
  }
  return results;
}

function parseValue(s: string): any {
  if (s === 'NULL' || s === 'null') return null;
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  }
  const n = parseFloat(s);
  return isNaN(n) ? s : n;
}

function safeStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ========== 迁移函数 ==========

async function migrateUsers(client: Client, sql: string) {
  console.log('\n[1/10] 迁移买手用户 (tfkz_users -> users)...');
  const rows = parseInsertValues(sql, 'tfkz_users');
  let count = 0;

  for (const row of rows) {
    const [id, username, password, mobile, qq, vip, vipTime, deposit, reward,
           frozenDeposit, frozenReward, inviteCode, tjuser, note, state, createTime] = row;

    const newId = uuidv4();
    idMap.users.set(id, newId);

    try {
      await client.query(`
        INSERT INTO users (
          id, username, password, phone, qq, vip, "vipExpireAt",
          balance, silver, "frozenBalance", "frozenSilver", "invitationCode", "referrerId",
          "isActive", "isBanned", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, username, password, safeStr(mobile), safeStr(qq),
        vip === 1, unixToIso(vipTime),
        deposit || 0, reward || 0, frozenDeposit || 0, frozenReward || 0,
        inviteCode || generateInviteCode(), safeStr(tjuser),
        state !== 2, state === 2,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      if (!e.message.includes('duplicate')) console.error(`  用户错误: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMerchants(client: Client, sql: string) {
  console.log('\n[2/10] 迁移商家 (tfkz_seller -> merchants)...');
  const rows = parseInsertValues(sql, 'tfkz_seller');
  let count = 0;

  for (const row of rows) {
    const [id, sellerName, loginPwd, mobile, qq, vip, vipTime, balance, reward,
           frozenBalance, frozenReward, inviteCode, tjuser, note, state, createTime] = row;

    const newId = uuidv4();
    idMap.merchants.set(id, newId);

    try {
      await client.query(`
        INSERT INTO merchants (
          id, username, password, phone, qq, vip, vip_expire_at,
          balance, silver, frozen_balance, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, sellerName, loginPwd, safeStr(mobile), safeStr(qq),
        vip === 1, unixToIso(vipTime),
        balance || 0, reward || 0, frozenBalance || 0, state,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      if (!e.message.includes('duplicate')) console.error(`  商家错误: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateShops(client: Client, sql: string) {
  console.log('\n[3/10] 迁移店铺 (tfkz_shop -> shops)...');
  const rows = parseInsertValues(sql, 'tfkz_shop');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, shopName, shopType, shopLogo, shopWw, shopLink,
           sellerName, sellerPhone, sellerAddress, expressName, expressCode,
           logistics, code, state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.shops.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);
    if (!merchantId) continue;

    try {
      await client.query(`
        INSERT INTO shops (
          id, "sellerId", name, type, "logoUrl", "wangwangId", "shopUrl",
          "contactName", "contactPhone", address, "expressName", "expressCode",
          "needLogistics", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, merchantId, shopName, shopType || 1, shopLogo, shopWw, shopLink,
        sellerName, safeStr(sellerPhone), sellerAddress, expressName, expressCode,
        logistics === 1, state,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      if (!e.message.includes('duplicate')) console.error(`  店铺错误: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBuyerAccounts(client: Client, sql: string) {
  console.log('\n[4/10] 迁移买号 (tfkz_user_buyno -> buyer_accounts)...');
  const rows = parseInsertValues(sql, 'tfkz_user_buyno');
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
        INSERT INTO buyer_accounts (
          id, "userId", "accountName", "wangwangProvince", "wangwangCity",
          "archiveImage", "ipImage", "receiverName", province, city, district,
          "addressRemark", "receiverPhone", "alipayName", "idCardImage", "alipayImage",
          status, "frozenTime", star, "fullAddress", "rejectReason", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, userId || safeStr(uid), wwid, wwpro, wwcity,
        wwdaimg, ipimg, addressname, addresspro, addresscity, addressarea,
        addresstext, safeStr(addressphone), alipayname, idcardimg, alipayimg,
        state, unixToIso(frozenTime), star || 1, detailAddress, note,
        unixToIso(parseInt(creatTime)) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      if (!e.message.includes('duplicate')) console.error(`  买号错误: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateGoods(client: Client, sql: string) {
  console.log('\n[5/10] 迁移商品 (tfkz_goods -> goods)...');
  const rows = parseInsertValues(sql, 'tfkz_goods');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, shopId, goodsName, goodsLink, goodsImg, goodsPrice,
           goodsNum, goodsSku, state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.goods.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);
    const shopUuid = idMap.shops.get(shopId);
    if (!merchantId) continue;

    try {
      await client.query(`
        INSERT INTO goods (
          id, "sellerId", "shopId", name, "goodsUrl", "imageUrl",
          price, stock, "skuInfo", status, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, merchantId, shopUuid, goodsName, goodsLink, goodsImg,
        goodsPrice || 0, goodsNum || 0, goodsSku, state,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      if (!e.message.includes('duplicate')) console.error(`  商品错误: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBanks(client: Client, sql: string) {
  console.log('\n[6/10] 迁移银行 (tfkz_bank -> banks)...');
  const rows = parseInsertValues(sql, 'tfkz_bank');
  let count = 0;

  for (const row of rows) {
    const [id, bankName, bankLogo, state, createTime] = row;
    const newId = uuidv4();
    idMap.banks.set(id, newId);

    try {
      await client.query(`
        INSERT INTO banks (id, name, "logoUrl", "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [newId, bankName, bankLogo, state === 1,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateDeliveries(client: Client, sql: string) {
  console.log('\n[7/10] 迁移快递公司 (tfkz_delivery -> deliveries)...');
  const rows = parseInsertValues(sql, 'tfkz_delivery');
  let count = 0;

  for (const row of rows) {
    const [id, deliveryName, deliveryCode, state, createTime] = row;
    try {
      await client.query(`
        INSERT INTO deliveries (id, name, code, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [uuidv4(), deliveryName, deliveryCode, state === 1,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateNotices(client: Client, sql: string) {
  console.log('\n[8/10] 迁移公告 (tfkz_notice -> notices)...');
  const rows = parseInsertValues(sql, 'tfkz_notice');
  let count = 0;

  for (const row of rows) {
    const [id, title, content, state, adminId, type, createTime, updateTime] = row;
    try {
      await client.query(`
        INSERT INTO notices (id, title, content, status, "targetType", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [uuidv4(), title, content, state === 1 ? 1 : 0, type === 1 ? 'buyer' : 'merchant',
          unixToIso(createTime) || new Date().toISOString(),
          unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBlacklist(client: Client, sql: string) {
  console.log('\n[9/10] 迁移黑名单 (tfkz_seller_limit -> merchant_blacklist)...');
  const rows = parseInsertValues(sql, 'tfkz_seller_limit');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, wangwang, state, status, endTime, createTime, updateTime, remarks] = row;
    const merchantId = idMap.merchants.get(sellerId);
    if (!merchantId) continue;

    try {
      await client.query(`
        INSERT INTO merchant_blacklist (
          id, "sellerId", "accountName", type, status, "endTime", reason, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [uuidv4(), merchantId, wangwang, state, status, unixToIso(endTime), remarks,
          unixToIso(createTime) || new Date().toISOString(),
          unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateCommissionRates(client: Client, sql: string) {
  console.log('\n[10/10] 迁移佣金比例 (tfkz_commission -> commission_rates)...');
  const rows = parseInsertValues(sql, 'tfkz_commission');
  let count = 0;

  for (const row of rows) {
    const [id, maxGoodsPrice, userReward, sellerReward, createTime, updateTime] = row;
    try {
      await client.query(`
        INSERT INTO commission_rates (
          id, "minAmount", "maxAmount", "buyerCommission", "merchantFee", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [uuidv4(), 0, maxGoodsPrice, userReward, sellerReward,
          unixToIso(createTime) || new Date().toISOString(),
          unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

// ========== 主函数 ==========

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       数据迁移: tfkz.com MySQL -> NestJS PostgreSQL        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n读取源 SQL 文件...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n连接 PostgreSQL...');
  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log('连接成功!');

    // 按依赖顺序迁移
    await migrateBanks(client, sql);
    await migrateDeliveries(client, sql);
    await migrateCommissionRates(client, sql);
    await migrateUsers(client, sql);
    await migrateMerchants(client, sql);
    await migrateShops(client, sql);
    await migrateBuyerAccounts(client, sql);
    await migrateGoods(client, sql);
    await migrateBlacklist(client, sql);
    await migrateNotices(client, sql);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('迁移完成!');
    console.log('════════════════════════════════════════════════════════════');

    console.log('\nID 映射统计:');
    console.log(`  ├─ 买手用户: ${idMap.users.size}`);
    console.log(`  ├─ 商家:     ${idMap.merchants.size}`);
    console.log(`  ├─ 店铺:     ${idMap.shops.size}`);
    console.log(`  ├─ 商品:     ${idMap.goods.size}`);
    console.log(`  ├─ 买号:     ${idMap.buyerAccounts.size}`);
    console.log(`  └─ 银行:     ${idMap.banks.size}`);

    // 保存映射
    const mappingFile = '/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/backend/scripts/migration/id-mapping.json';
    const mappingData: Record<string, Record<string, string>> = {};
    for (const [key, map] of Object.entries(idMap)) {
      mappingData[key] = Object.fromEntries(map);
    }
    fs.writeFileSync(mappingFile, JSON.stringify(mappingData, null, 2));
    console.log(`\nID 映射已保存: ${mappingFile}`);

  } catch (error) {
    console.error('\n迁移失败:', error);
  } finally {
    await client.end();
  }
}

main();
