/**
 * 完整数据迁移脚本 - MySQL dump 到 PostgreSQL
 *
 * 功能:
 * - 解析 MySQL dump SQL 文件
 * - 转换数据格式 (Unix时间戳 -> ISO日期, 整数ID -> UUID)
 * - 按依赖顺序插入数据
 * - 维护 ID 映射关系
 *
 * 使用方法:
 * cd backend
 * npx ts-node scripts/migration/migrate-full.ts
 *
 * 环境变量:
 * DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
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

// ========== ID 映射缓存 ==========
const idMap = {
  users: new Map<number, string>(),
  merchants: new Map<number, string>(),
  shops: new Map<number, string>(),
  goods: new Map<number, string>(),
  tasks: new Map<number, string>(),
  orders: new Map<number, string>(),
  buyerAccounts: new Map<number, string>(),
  bankCards: new Map<number, string>(),
  merchantBankCards: new Map<number, string>(),
  banks: new Map<number, string>(),
  adminUsers: new Map<number, string>(),
  reviewTasks: new Map<number, string>(),
  goodsKeys: new Map<number, string>(),
  deliveries: new Map<number, string>(),
};

// ========== 工具函数 ==========

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
    return s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  }
  const n = parseFloat(s);
  return isNaN(n) ? s : n;
}

function safeStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

// ========== 迁移函数 ==========

async function migrateBanks(client: Client, sql: string) {
  console.log('\n[1/15] 迁移银行列表 (tfkz_bank -> banks)...');
  const rows = parseInsertValues(sql, 'tfkz_bank');
  let count = 0;

  for (const [id, bankName, bankLogo, state, createTime] of rows) {
    const newId = uuidv4();
    idMap.banks.set(id, newId);
    try {
      await client.query(`
        INSERT INTO banks (id, bank_name, logo_url, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
      `, [newId, bankName, bankLogo, state === 1, unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateDeliveries(client: Client, sql: string) {
  console.log('\n[2/15] 迁移快递公司 (tfkz_delivery -> deliveries)...');
  const rows = parseInsertValues(sql, 'tfkz_delivery');
  let count = 0;

  for (const [id, deliveryName, deliveryCode, state, createTime] of rows) {
    const newId = uuidv4();
    idMap.deliveries.set(id, newId);
    try {
      await client.query(`
        INSERT INTO deliveries (id, name, code, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
      `, [newId, deliveryName, deliveryCode, state === 1, unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateSystemConfig(client: Client, sql: string) {
  console.log('\n[3/15] 迁移系统配置 (tfkz_system -> system_global_configs)...');
  const rows = parseInsertValues(sql, 'tfkz_system');
  if (rows.length === 0) { console.log('   无数据'); return; }

  const [id, userVipMoney, sellerVipMoney, userServiceCharge, sellerServiceCharge,
         sellerTaskService, userMinCash, sellerMinCash, payAward, registerGive,
         buyerInvite, sellerInvite, taskPass, passTime] = rows[0];

  try {
    await client.query(`
      INSERT INTO system_global_configs (id, buyer_vip_price, merchant_vip_price,
        buyer_withdraw_fee, merchant_withdraw_fee, merchant_task_fee,
        buyer_min_withdraw, merchant_min_withdraw, recharge_reward, register_gift,
        buyer_invite_reward, merchant_invite_reward, task_auto_pass, task_pass_time,
        created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT DO NOTHING
    `, [uuidv4(), userVipMoney, sellerVipMoney, userServiceCharge, sellerServiceCharge,
        sellerTaskService, userMinCash, sellerMinCash, payAward, registerGive,
        buyerInvite, sellerInvite, taskPass === 1, passTime,
        new Date().toISOString(), new Date().toISOString()]);
    console.log('   完成: 1/1');
  } catch (e: any) { console.log(`   错误: ${e.message}`); }
}

async function migrateCommissionRates(client: Client, sql: string) {
  console.log('\n[4/15] 迁移佣金比例 (tfkz_commission -> commission_rates)...');
  const rows = parseInsertValues(sql, 'tfkz_commission');
  let count = 0;

  for (const [id, maxGoodsPrice, userReward, sellerReward, createTime, updateTime] of rows) {
    try {
      await client.query(`
        INSERT INTO commission_rates (id, max_goods_price, buyer_reward, merchant_fee, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING
      `, [uuidv4(), maxGoodsPrice, userReward, sellerReward,
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateAdminUsers(client: Client, sql: string) {
  console.log('\n[5/15] 迁移管理员 (tfkz_admin_user -> admin_users)...');
  const rows = parseInsertValues(sql, 'tfkz_admin_user');
  let count = 0;

  for (const [id, userName, password, roleId, state, createTime, updateTime, deleteTime] of rows) {
    const newId = uuidv4();
    idMap.adminUsers.set(id, newId);
    try {
      await client.query(`
        INSERT INTO admin_users (id, username, password, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING
      `, [newId, userName, password, 'admin', state === 1 ? 'active' : 'inactive',
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateUsers(client: Client, sql: string) {
  console.log('\n[6/15] 迁移买手用户 (tfkz_users -> users)...');
  const rows = parseInsertValues(sql, 'tfkz_users');
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
        ON CONFLICT DO NOTHING
      `, [newId, username, password, safeStr(mobile), safeStr(qq), vip === 1, unixToIso(vipTime),
          deposit || 0, reward || 0, frozenDeposit || 0, frozenReward || 0,
          inviteCode, safeStr(tjuser), note, state,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMerchants(client: Client, sql: string) {
  console.log('\n[7/15] 迁移商家 (tfkz_seller -> merchants)...');
  const rows = parseInsertValues(sql, 'tfkz_seller');
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
        ON CONFLICT DO NOTHING
      `, [newId, sellerName, loginPwd, safeStr(mobile), safeStr(qq), vip === 1, unixToIso(vipTime),
          balance || 0, reward || 0, frozenBalance || 0, frozenReward || 0,
          inviteCode, safeStr(tjuser), note, state,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateShops(client: Client, sql: string) {
  console.log('\n[8/15] 迁移店铺 (tfkz_shop -> shops)...');
  const rows = parseInsertValues(sql, 'tfkz_shop');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, shopName, shopType, shopLogo, shopWw, shopLink,
           sellerName, sellerPhone, sellerAddress, expressName, expressCode,
           logistics, code, state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.shops.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);

    try {
      await client.query(`
        INSERT INTO shops (id, merchant_id, shop_name, shop_type, logo_url, wangwang_id,
          shop_url, seller_name, seller_phone, seller_address, express_name, express_code,
          need_logistics, warehouse_code, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT DO NOTHING
      `, [newId, merchantId || safeStr(sellerId), shopName, shopType, shopLogo, shopWw, shopLink,
          sellerName, safeStr(sellerPhone), sellerAddress, expressName, expressCode,
          logistics === 1, code, state,
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBuyerAccounts(client: Client, sql: string) {
  console.log('\n[9/15] 迁移买号 (tfkz_user_buyno -> buyer_accounts)...');
  const rows = parseInsertValues(sql, 'tfkz_user_buyno');
  let count = 0;

  for (const row of rows) {
    const [id, wwid, wwpro, wwcity, wwdaimg, ipimg, addressname, addresspro,
           addresscity, addressarea, addresstext, addressphone, alipayname,
           idcardimg, alipayimg, state, creatTime, uid, note, detailAddress,
           frozenTime, star] = row;

    const newId = uuidv4();
    idMap.buyerAccounts.set(id, newId);
    const userId = idMap.users.get(parseInt(uid)) || safeStr(uid);

    try {
      await client.query(`
        INSERT INTO buyer_accounts (id, user_id, account_name, wangwang_province, wangwang_city,
          archive_image, ip_image, receiver_name, province, city, district, address_remark,
          receiver_phone, alipay_name, id_card_image, alipay_image, status, frozen_time, star,
          full_address, reject_reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        ON CONFLICT DO NOTHING
      `, [newId, userId, wwid, wwpro, wwcity, wwdaimg, ipimg, addressname, addresspro, addresscity, addressarea, addresstext,
          safeStr(addressphone), alipayname, idcardimg, alipayimg, state, unixToIso(frozenTime), star || 1,
          detailAddress, note,
          unixToIso(parseInt(creatTime)) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateGoods(client: Client, sql: string) {
  console.log('\n[10/15] 迁移商品 (tfkz_goods -> goods)...');
  const rows = parseInsertValues(sql, 'tfkz_goods');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, shopId, goodsName, goodsLink, goodsImg, goodsPrice,
           goodsNum, goodsSku, state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.goods.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);
    const shopUuid = idMap.shops.get(shopId);

    try {
      await client.query(`
        INSERT INTO goods (id, merchant_id, shop_id, goods_name, goods_url, goods_image,
          price, stock, sku_info, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
      `, [newId, merchantId || safeStr(sellerId), shopUuid || safeStr(shopId),
          goodsName, goodsLink, goodsImg, goodsPrice, goodsNum, goodsSku, state,
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMerchantBlacklist(client: Client, sql: string) {
  console.log('\n[11/15] 迁移商家黑名单 (tfkz_seller_limit -> merchant_blacklist)...');
  const rows = parseInsertValues(sql, 'tfkz_seller_limit');
  let count = 0;

  for (const row of rows) {
    const [id, sellerId, wangwang, state, status, endTime, createTime, updateTime, remarks] = row;

    const merchantId = idMap.merchants.get(sellerId);

    try {
      await client.query(`
        INSERT INTO merchant_blacklist (id, seller_id, account_name, type, status, end_time, reason, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [uuidv4(), merchantId || safeStr(sellerId), wangwang, state, status,
          unixToIso(endTime), remarks,
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateNotices(client: Client, sql: string) {
  console.log('\n[12/15] 迁移公告 (tfkz_notice -> notices)...');
  const rows = parseInsertValues(sql, 'tfkz_notice');
  let count = 0;

  for (const row of rows) {
    const [id, title, content, state, adminId, type, createTime, updateTime] = row;

    try {
      await client.query(`
        INSERT INTO notices (id, title, content, status, admin_id, target_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
      `, [uuidv4(), title, content, state === 1 ? 'published' : 'draft',
          safeStr(adminId), type === 1 ? 'buyer' : 'merchant',
          unixToIso(createTime) || new Date().toISOString(), unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMessages(client: Client, sql: string) {
  console.log('\n[13/15] 迁移消息 (tfkz_message -> messages)...');
  const rows = parseInsertValues(sql, 'tfkz_message');
  let count = 0;

  for (const row of rows) {
    const [id, type, title, content, createTime, look, userId, state, author, adminId] = row;

    const receiverId = type === 1 ? idMap.users.get(userId) : idMap.merchants.get(userId);

    try {
      await client.query(`
        INSERT INTO messages (id, receiver_id, receiver_type, type, title, content, status, sender_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [uuidv4(), receiverId || safeStr(userId), type, 1, title, content,
          look === 1 ? 1 : 0, safeStr(adminId),
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateVipRecords(client: Client, sql: string) {
  console.log('\n[14/15] 迁移VIP记录 (tfkz_vip_record -> vip_records)...');
  const rows = parseInsertValues(sql, 'tfkz_vip_record');
  let count = 0;

  for (const row of rows) {
    const [id, uid, type, vipTime, vipMoney, payMoney, fromType, createTime] = row;

    const userId = type === 1 ? idMap.users.get(uid) : idMap.merchants.get(uid);

    try {
      await client.query(`
        INSERT INTO vip_records (id, user_id, user_type, duration, price, paid_amount, payment_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [uuidv4(), userId || safeStr(uid), type, vipTime, vipMoney, payMoney, fromType,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateRecharges(client: Client, sql: string) {
  console.log('\n[15/15] 迁移充值记录 (tfkz_recharge -> recharges)...');
  const rows = parseInsertValues(sql, 'tfkz_recharge');
  let count = 0;

  for (const row of rows) {
    const [id, uid, type, payType, payMoney, outTradeNo, tradeNo, payState, fromType, createTime] = row;

    const userId = type === 1 ? idMap.users.get(uid) : idMap.merchants.get(uid);

    try {
      await client.query(`
        INSERT INTO recharges (id, user_id, user_type, payment_method, amount, out_trade_no, trade_no, status, recharge_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [uuidv4(), userId || safeStr(uid), type, payType, payMoney, outTradeNo, tradeNo, payState, fromType,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { /* ignore */ }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

// ========== 主函数 ==========

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       数据迁移工具: MySQL dump -> PostgreSQL              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n读取源 SQL 文件...');
  if (!fs.existsSync(SQL_FILE)) {
    console.error(`错误: SQL 文件不存在: ${SQL_FILE}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n连接 PostgreSQL...');
  console.log(`  主机: ${PG_CONFIG.host}:${PG_CONFIG.port}`);
  console.log(`  数据库: ${PG_CONFIG.database}`);

  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log('连接成功!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('开始迁移数据...');
    console.log('═══════════════════════════════════════════════════════════════');

    // 按依赖顺序迁移
    await migrateBanks(client, sql);
    await migrateDeliveries(client, sql);
    await migrateSystemConfig(client, sql);
    await migrateCommissionRates(client, sql);
    await migrateAdminUsers(client, sql);
    await migrateUsers(client, sql);
    await migrateMerchants(client, sql);
    await migrateShops(client, sql);
    await migrateBuyerAccounts(client, sql);
    await migrateGoods(client, sql);
    await migrateMerchantBlacklist(client, sql);
    await migrateNotices(client, sql);
    await migrateMessages(client, sql);
    await migrateVipRecords(client, sql);
    await migrateRecharges(client, sql);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('迁移完成!');
    console.log('═══════════════════════════════════════════════════════════════');

    console.log('\nID 映射统计:');
    console.log(`  ├─ 买手用户: ${idMap.users.size}`);
    console.log(`  ├─ 商家:     ${idMap.merchants.size}`);
    console.log(`  ├─ 店铺:     ${idMap.shops.size}`);
    console.log(`  ├─ 商品:     ${idMap.goods.size}`);
    console.log(`  ├─ 买号:     ${idMap.buyerAccounts.size}`);
    console.log(`  ├─ 银行:     ${idMap.banks.size}`);
    console.log(`  └─ 管理员:   ${idMap.adminUsers.size}`);

    // 保存 ID 映射到文件
    const mappingFile = '/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/backend/scripts/migration/id-mapping.json';
    const mappingData: Record<string, Record<string, string>> = {};
    for (const [key, map] of Object.entries(idMap)) {
      mappingData[key] = Object.fromEntries(map);
    }
    fs.writeFileSync(mappingFile, JSON.stringify(mappingData, null, 2));
    console.log(`\nID 映射已保存到: ${mappingFile}`);

  } catch (error) {
    console.error('\n迁移失败:', error);
  } finally {
    await client.end();
  }
}

main();
