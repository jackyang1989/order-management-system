/**
 * 数据迁移脚本 v3 - 完全匹配实际 TypeORM 表结构
 */

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';

const SQL_FILE = '/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com/db_tfkz_com_20221006_210534.sql';

const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'jianouyang',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
};

const idMap = {
  users: new Map<number, string>(),
  merchants: new Map<number, string>(),
  shops: new Map<number, string>(),
  goods: new Map<number, string>(),
  buyerAccounts: new Map<number, string>(),
  banks: new Map<number, string>(),
};

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

function genCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ========== 清空表 ==========

async function truncateTables(client: Client) {
  console.log('\n清空现有数据...');
  const tables = ['buyer_accounts', 'goods', 'shops', 'merchants', 'users', 'banks', 'deliveries', 'notices'];
  for (const table of tables) {
    try {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`  已清空: ${table}`);
    } catch (e: any) {
      console.log(`  跳过: ${table} (${e.message})`);
    }
  }
}

// ========== 迁移函数 ==========

async function migrateBanks(client: Client, sql: string) {
  console.log('\n[1/8] 迁移银行 (tfkz_bank -> banks)...');
  const rows = parseInsertValues(sql, 'tfkz_bank');
  let count = 0;

  for (const row of rows) {
    const [id, bankName, bankLogo, state, createTime] = row;
    const newId = uuidv4();
    idMap.banks.set(id, newId);

    try {
      // banks: id, name, icon, code, sort, isActive, createdAt
      await client.query(`
        INSERT INTO banks (id, name, icon, code, sort, "isActive", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [newId, bankName, bankLogo, null, 0, state === 1,
          unixToIso(createTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { console.error(`银行错误: ${e.message}`); }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateDeliveries(client: Client, sql: string) {
  console.log('\n[2/8] 迁移快递公司 (tfkz_delivery -> deliveries)...');
  const rows = parseInsertValues(sql, 'tfkz_delivery');
  let count = 0;

  for (const row of rows) {
    const [id, deliveryName, deliveryCode, state, createTime] = row;
    try {
      // deliveries: id, name, code, isActive, createdAt, updatedAt
      await client.query(`
        INSERT INTO deliveries (id, name, code, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [uuidv4(), deliveryName, deliveryCode, state === 1,
          unixToIso(createTime) || new Date().toISOString(), new Date().toISOString()]);
      count++;
    } catch (e: any) { console.error(`快递错误: ${e.message}`); }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateUsers(client: Client, sql: string) {
  console.log('\n[3/8] 迁移买手用户 (tfkz_users -> users)...');
  const rows = parseInsertValues(sql, 'tfkz_users');
  let count = 0;
  let phoneIndex = 1;

  for (const row of rows) {
    const [id, username, password, mobile, qq, vip, vipTime, deposit, reward,
           frozenDeposit, frozenReward, inviteCode, tjuser, note, state, createTime] = row;

    const newId = uuidv4();
    idMap.users.set(id, newId);

    // 为没有手机号的用户生成唯一的占位手机号
    let phone = safeStr(mobile);
    if (!phone || phone === '0' || phone === 'null') {
      phone = `TEMP${String(phoneIndex++).padStart(8, '0')}`;
    }

    try {
      // users 表实际结构: id, username, password, phone, qq, vip, vipExpireAt,
      // balance, silver, frozenBalance, frozenSilver, invitationCode, referrerId,
      // isActive, isBanned, createdAt, updatedAt
      await client.query(`
        INSERT INTO users (
          id, username, password, phone, qq, vip, "vipExpireAt",
          balance, silver, "frozenBalance", "frozenSilver", "invitationCode", "referrerId",
          "isActive", "isBanned", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        newId, username, password, phone, safeStr(qq),
        vip === 1, unixToIso(vipTime),
        deposit || 0, reward || 0, frozenDeposit || 0, frozenReward || 0,
        inviteCode || genCode(), safeStr(tjuser),
        state !== 2, state === 2,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`用户错误 [${username}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMerchants(client: Client, sql: string) {
  console.log('\n[4/8] 迁移商家 (tfkz_seller -> merchants)...');
  const rows = parseInsertValues(sql, 'tfkz_seller');
  let count = 0;

  // tfkz_seller 字段顺序:
  // id, seller_name, invite_code, login_pwd, pay_pwd, mobile, tjuser, tjuser_state, qq,
  // vip, vip_time, last_time, balance, reward, arrears, tj_award, tj_award_day,
  // head_img, logins_ip, state, create_time, update_time, delete_time, note, msg_type, look_time
  for (const row of rows) {
    const [id, sellerName, inviteCode, loginPwd, payPwd, mobile, tjuser, tjuserState, qq,
           vip, vipTime, lastTime, balance, reward, arrears, tjAward, tjAwardDay,
           headImg, loginsIp, state, createTime, updateTime, deleteTime, note, msgType, lookTime] = row;

    const newId = uuidv4();
    idMap.merchants.set(id, newId);

    try {
      // merchants: id, username, password, phone, qq, balance, frozen_balance, silver,
      // vip, vip_expire_at, status, created_at, updated_at
      await client.query(`
        INSERT INTO merchants (
          id, username, password, phone, qq, balance, frozen_balance, silver,
          vip, vip_expire_at, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        newId, sellerName, loginPwd, safeStr(mobile) || '00000000000', safeStr(qq),
        Math.min(balance || 0, 99999999), 0, Math.min(reward || 0, 99999999),
        vip === 1, unixToIso(vipTime), state,
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`商家错误 [${sellerName}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateShops(client: Client, sql: string) {
  console.log('\n[5/8] 迁移店铺 (tfkz_shop -> shops)...');
  const rows = parseInsertValues(sql, 'tfkz_shop');
  let count = 0;

  // tfkz_shop 字段顺序:
  // id, seller_id, link, type, shop_name, wangwang, name, mobile, province, city, area, address,
  // state, cause, create_time, update_time, delete_time, logistics, sheng, shi, qu, code
  for (const row of rows) {
    const [id, sellerId, shopLink, shopType, shopName, wangwang, senderName, mobile,
           province, city, area, address, state, cause, createTime, updateTime,
           deleteTime, logistics, sheng, shi, qu, code] = row;

    const newId = uuidv4();
    idMap.shops.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);
    if (!merchantId) { console.log(`  跳过店铺 [${shopName}]: 商家 ${sellerId} 未找到`); continue; }

    try {
      // shops: id, sellerId, platform, shopName, accountName, contactName, mobile,
      // province, city, detailAddress, url, status, needLogistics, expressCode,
      // createdAt, updatedAt
      await client.query(`
        INSERT INTO shops (
          id, "sellerId", platform, "shopName", "accountName", "contactName", mobile,
          province, city, "detailAddress", url, status, "needLogistics", "expressCode",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        newId, merchantId,
        shopType === 1 ? 'TAOBAO' : (shopType === 2 ? 'TMALL' : 'OTHER'),
        shopName, wangwang || shopName, senderName || 'N/A',
        safeStr(mobile) || 'N/A', province, city, address, shopLink,
        state === 1 ? '1' : '0', logistics === '1' || logistics === 1, code,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`店铺错误 [${shopName}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBuyerAccounts(client: Client, sql: string) {
  console.log('\n[6/8] 迁移买号 (tfkz_user_buyno -> buyer_accounts)...');
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
      console.error(`买号错误 [${wwid}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateGoods(client: Client, sql: string) {
  console.log('\n[7/8] 迁移商品 (tfkz_goods -> goods)...');
  const rows = parseInsertValues(sql, 'tfkz_goods');
  let count = 0;

  // tfkz_goods 字段顺序:
  // id, seller_id, name, shop_id, goods_key_id, link, taobao_id, number, pc_img,
  // mobile_img_a, mobile_img_b, spec_name, spec_value, price, num, show_price,
  // state, create_time, update_time
  for (const row of rows) {
    const [id, sellerId, goodsName, shopId, goodsKeyId, goodsLink, taobaoId, number, pcImg,
           mobileImgA, mobileImgB, specName, specValue, goodsPrice, goodsNum, showPrice,
           state, createTime, updateTime] = row;

    const newId = uuidv4();
    idMap.goods.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);
    const shopUuid = idMap.shops.get(shopId);
    if (!merchantId || !shopUuid) {
      console.log(`  跳过商品 [${goodsName}]: 商家 ${sellerId}(${merchantId ? '有' : '无'}) 或 店铺 ${shopId}(${shopUuid ? '有' : '无'}) 未找到`);
      continue;
    }

    try {
      // goods: id, sellerId, shopId, name, link, pcImg, price, num, showPrice, state, createdAt, updatedAt
      await client.query(`
        INSERT INTO goods (
          id, "sellerId", "shopId", name, link, "pcImg",
          price, num, "showPrice", state, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        newId, merchantId, shopUuid, goodsName, goodsLink, pcImg,
        goodsPrice || 0, goodsNum || 1, showPrice || goodsPrice || 0, state === 1 ? 1 : 0,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`商品错误 [${goodsName}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateNotices(client: Client, sql: string) {
  console.log('\n[8/8] 迁移公告 (tfkz_notice -> notices)...');
  const rows = parseInsertValues(sql, 'tfkz_notice');
  let count = 0;

  for (const row of rows) {
    const [id, title, content, state, adminId, type, createTime, updateTime] = row;
    try {
      // notices: id, title, content, type, target, status, sort, isTop, isPopup, createdAt, updatedAt
      await client.query(`
        INSERT INTO notices (id, title, content, type, target, status, sort, "isTop", "isPopup", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [uuidv4(), title, content, 1, type === 1 ? 1 : 2, state === 1 ? 1 : 0, 0, false, false,
          unixToIso(createTime) || new Date().toISOString(),
          unixToIso(updateTime) || new Date().toISOString()]);
      count++;
    } catch (e: any) { console.error(`公告错误: ${e.message}`); }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

// ========== 主函数 ==========

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     数据迁移 v3: tfkz.com MySQL -> NestJS PostgreSQL       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n读取 SQL 文件...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n连接 PostgreSQL...');
  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log('连接成功!');

    // 清空现有数据
    await truncateTables(client);

    await migrateBanks(client, sql);
    await migrateDeliveries(client, sql);
    await migrateUsers(client, sql);
    await migrateMerchants(client, sql);
    await migrateShops(client, sql);
    await migrateBuyerAccounts(client, sql);
    await migrateGoods(client, sql);
    await migrateNotices(client, sql);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('迁移完成!');
    console.log('════════════════════════════════════════════════════════════');

    console.log('\nID 映射:');
    console.log(`  买手: ${idMap.users.size} | 商家: ${idMap.merchants.size} | 店铺: ${idMap.shops.size}`);
    console.log(`  商品: ${idMap.goods.size} | 买号: ${idMap.buyerAccounts.size} | 银行: ${idMap.banks.size}`);

    // 保存映射
    const mappingData: Record<string, Record<string, string>> = {};
    for (const [key, map] of Object.entries(idMap)) {
      mappingData[key] = Object.fromEntries(map);
    }
    fs.writeFileSync('/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/backend/scripts/migration/id-mapping.json', JSON.stringify(mappingData, null, 2));
    console.log('\nID 映射已保存到 id-mapping.json');

  } catch (error) {
    console.error('\n迁移失败:', error);
  } finally {
    await client.end();
  }
}

main();
