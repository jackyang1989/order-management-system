/**
 * 数据迁移脚本 v4 - 迁移任务、订单、消息、银行卡
 */

import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';

const SQL_FILE = '/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com/db_tfkz_com_20221006_210534.sql';
const ID_MAPPING_FILE = '/Users/jianouyang/.gemini/antigravity/scratch/order-management-system/backend/scripts/migration/id-mapping.json';

const PG_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'jianouyang',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
};

// 从之前的迁移加载ID映射
let idMap: {
  users: Map<number, string>;
  merchants: Map<number, string>;
  shops: Map<number, string>;
  goods: Map<number, string>;
  buyerAccounts: Map<number, string>;
  banks: Map<number, string>;
  tasks: Map<number, string>;
};

function loadIdMapping() {
  const data = JSON.parse(fs.readFileSync(ID_MAPPING_FILE, 'utf-8'));
  idMap = {
    users: new Map(Object.entries(data.users || {}).map(([k, v]) => [parseInt(k), v as string])),
    merchants: new Map(Object.entries(data.merchants || {}).map(([k, v]) => [parseInt(k), v as string])),
    shops: new Map(Object.entries(data.shops || {}).map(([k, v]) => [parseInt(k), v as string])),
    goods: new Map(Object.entries(data.goods || {}).map(([k, v]) => [parseInt(k), v as string])),
    buyerAccounts: new Map(Object.entries(data.buyerAccounts || {}).map(([k, v]) => [parseInt(k), v as string])),
    banks: new Map(Object.entries(data.banks || {}).map(([k, v]) => [parseInt(k), v as string])),
    tasks: new Map<number, string>(),
  };
  console.log(`加载ID映射: users=${idMap.users.size}, merchants=${idMap.merchants.size}, shops=${idMap.shops.size}`);
}

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

// ========== 迁移函数 ==========

async function migrateTasks(client: Client, sql: string) {
  console.log('\n[1/4] 迁移任务 (tfkz_seller_task -> tasks)...');
  const rows = parseInsertValues(sql, 'tfkz_seller_task');
  let count = 0;

  for (const row of rows) {
    // 根据CREATE TABLE定义的字段顺序
    const [id, taskNumber, randNum, sellerId, shopId, taskType, goodsId, terminal,
           goodsUnitPrice, goodsNum, goodsSpec, planName, taoWord, qrCode, channelName,
           channelImg, memo, isFreeShiping, postage, margin, weight, addReward,
           isTimingPay, timingTime, timingPay, isTimingPublish, publishTime, timingPublishPay,
           unionInterval, unionIntervalTime, receiptTime, isCycleTime, cycleTime, cycle,
           isPraise, praiseFee, isImgPraise, imgPraiseFee, isVideoPraise, videoPraiseFee,
           createTime, updateTime, deleteTime, cancelTime, completeTime,
           goodsPrice, goodsMoney, num, incompleteNum, completeNum, postageMoney,
           deposit, silverIngot, status, state, servicePrice, goodsMoreFee,
           refundServicePrice, phoneFee, pcFee, remarks, examineTime,
           nextDay, nextDayFee, userDivided, address, shopName, payState, payTime,
           yajin, yinding, isShengji, step, isRepay, repay, isYs, ysTime, yfPrice, wkPrice] = row;

    const newId = uuidv4();
    idMap.tasks.set(id, newId);
    const merchantId = idMap.merchants.get(sellerId);

    if (!merchantId) {
      console.log(`  跳过任务 [${taskNumber}]: 商家 ${sellerId} 未找到`);
      continue;
    }

    try {
      await client.query(`
        INSERT INTO tasks (
          id, "taskNumber", "merchantId", "taskType", terminal, url, "shopName",
          "taoWord", memo, "isFreeShipping", margin, "addReward",
          "isTimingPublish", "publishTime", "unionInterval", cycle,
          "isPraise", "praiseFee", "isImgPraise", "imgPraiseFee", "isVideoPraise", "videoPraiseFee",
          "goodsPrice", "goodsMoney", count, "incompleteCount", "completedCount",
          "shippingFee", "totalDeposit", "totalCommission", status,
          "baseServiceFee", "goodsMoreFee", "refundServiceFee", "phoneFee",
          remark, "examineTime", "nextDayFee",
          "payTime", "isPresale", "yfPrice", "wkPrice",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, taskNumber, merchantId, taskType || 1, terminal || 1, null, shopName,
        taoWord, memo, isFreeShiping === 1, margin || 0, addReward || 0,
        isTimingPublish === 1, unixToIso(publishTime), unionInterval || 0, cycle || 0,
        isPraise === 1, praiseFee || 0, isImgPraise === 1, imgPraiseFee || 0, isVideoPraise === 1, videoPraiseFee || 0,
        goodsPrice || 0, goodsMoney || 0, num || 1, incompleteNum || 0, completeNum || 0,
        postage || 0, deposit || 0, silverIngot || 0, status || 1,
        servicePrice || 0, goodsMoreFee || 0, refundServicePrice || 0, phoneFee || 0,
        remarks, unixToIso(examineTime), nextDayFee || 0,
        unixToIso(payTime), isYs === 1, yfPrice || 0, wkPrice || 0,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`任务错误 [${taskNumber}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateOrders(client: Client, sql: string) {
  console.log('\n[2/4] 迁移订单 (tfkz_user_task -> orders)...');
  const rows = parseInsertValues(sql, 'tfkz_user_task');
  let count = 0;

  for (const row of rows) {
    // 根据CREATE TABLE实际字段顺序:
    // id, user_id, seller_id, shop_id, seller_task_id, task_number, goods_id, goods_unit_price, goods_num,
    // user_buyno_id, user_buyno_wangwang, principal, commission, user_principal, seller_principal,
    // terminal, delivery, delivery_status, delivery_num, delivery_state, delivery_time, sign_for_time,
    // create_time, update_time, delete_time, cancel_time, state, keywordimg, chatimg, else_link1, else_link2,
    // table_order_id, consignee, order_detail_img, high_praise_img, complete_time, address, shipping_address,
    // shop_name, task_type, deltask_type, ending_time, task_step, user_divided, addressname, addressphone,
    // cancel_reason, upload_order_time, platform_refund_time, step_two_complete, text_praise, img_praise,
    // video_praise, high_praise_time, key_id, key, ids, fahuo_time, cancel_remarks
    const [id, userId, sellerId, shopId, sellerTaskId, taskNumber, goodsId, goodsUnitPrice, goodsNum,
           userBuynoId, userBuynoWangwang, principal, commission, userPrincipal, sellerPrincipal,
           terminal, delivery, deliveryStatus, deliveryNum, deliveryState, deliveryTime, signForTime,
           createTime, updateTime, deleteTime, cancelTime, state, keywordimg, chatimg, elseLink1, elseLink2,
           tableOrderId, consignee, orderDetailImg, highPraiseImg, completeTime, address, shippingAddress,
           shopName, taskType, deltaskType, endingTime, taskStep, userDivided, addressname, addressphone,
           cancelReason, uploadOrderTime, platformRefundTime, stepTwoComplete, textPraise, imgPraise,
           videoPraise, highPraiseTime, ...rest] = row;

    const newId = uuidv4();
    const newUserId = idMap.users.get(userId);
    const newTaskId = idMap.tasks.get(sellerTaskId);
    const newBuynoId = idMap.buyerAccounts.get(userBuynoId);

    // 状态映射: 0进行中, 1已完成, 2取消, 3待发货, 4待收货, 5待返款, 6待确认返款
    let orderStatus = 'PENDING';
    if (state === 1) orderStatus = 'COMPLETED';
    else if (state === 2) orderStatus = 'CANCELLED';
    else if (state === 0) orderStatus = 'IN_PROGRESS';
    else if (state === 3) orderStatus = 'WAITING_DELIVERY';
    else if (state === 4) orderStatus = 'WAITING_RECEIVE';
    else if (state === 5 || state === 6) orderStatus = 'WAITING_REFUND';

    try {
      await client.query(`
        INSERT INTO orders (
          id, "taskId", "userId", "buynoId", "buynoAccount", "taskTitle", platform,
          "productName", "productPrice", commission, status,
          "deliveryState", delivery, "deliveryNum",
          "userPrincipal", "sellerPrincipal", "prepayAmount", "finalAmount", "refundAmount",
          "keywordImg", "chatImg", "orderDetailImg", "highPraiseImg",
          "taobaoOrderNumber", "addressName", "addressPhone", "address",
          "praiseContent", "cancelRemarks", "completedAt", "cancelTime",
          "createdAt", "updatedAt", "totalSteps"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, newTaskId || safeStr(sellerTaskId), newUserId || safeStr(userId),
        newBuynoId || safeStr(userBuynoId), userBuynoWangwang || 'N/A', shopName || '未命名任务', '淘宝',
        shopName || 'N/A', principal || 0, commission || 0, orderStatus,
        deliveryState || 0, safeStr(delivery), safeStr(deliveryNum),
        userPrincipal || 0, sellerPrincipal || 0, 0, principal || 0, 0,
        keywordimg, chatimg, orderDetailImg, highPraiseImg,
        safeStr(tableOrderId), addressname, safeStr(addressphone), address,
        textPraise, cancelReason, unixToIso(completeTime), unixToIso(cancelTime),
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString(),
        5 // 默认总步骤数
      ]);
      count++;
    } catch (e: any) {
      console.error(`订单错误 [${taskNumber}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateMessages(client: Client, sql: string) {
  console.log('\n[3/4] 迁移消息 (tfkz_message -> messages)...');
  const rows = parseInsertValues(sql, 'tfkz_message');
  let count = 0;

  for (const row of rows) {
    // tfkz_message: id, type, title, content, create_time, state, uid, user_type, sender, related_id
    const [id, type, title, content, createTime, state, uid, userType, sender, relatedId] = row;

    const newId = uuidv4();
    // userType: 1买手 2商家
    const receiverId = userType === 1 ? idMap.users.get(uid) : idMap.merchants.get(uid);

    try {
      await client.query(`
        INSERT INTO messages (
          id, "senderId", "senderType", "receiverId", "receiverType",
          type, title, content, status, "relatedId",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, 'system', 0, receiverId || safeStr(uid), userType === 1 ? 1 : 2,
        type || 1, title || '系统消息', content || '',
        state === 1 ? 1 : 0, safeStr(relatedId),
        unixToIso(createTime) || new Date().toISOString(),
        new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`消息错误 [${id}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

async function migrateBankCards(client: Client, sql: string) {
  console.log('\n[4/4] 迁移用户银行卡 (tfkz_user_bank -> bank_cards)...');
  const rows = parseInsertValues(sql, 'tfkz_user_bank');
  let count = 0;

  for (const row of rows) {
    // tfkz_user_bank: id, uid, bank_id, account_name, province, city, branch_name, card_number,
    // phone, id_card, id_card_front_image, id_card_back_image, create_time, update_time, delete_time, status, reject_reason, note
    const [id, uid, bankId, accountName, province, city, branchName, cardNumber,
           phone, idCard, idCardFrontImage, idCardBackImage, createTime, updateTime,
           deleteTime, status, rejectReason, note] = row;

    const newId = uuidv4();
    const userId = idMap.users.get(uid);

    // 获取银行名称
    let bankName = '未知银行';
    const bankUuid = idMap.banks.get(bankId);
    if (bankUuid) {
      const bankResult = await client.query('SELECT name FROM banks WHERE id = $1', [bankUuid]);
      if (bankResult.rows.length > 0) {
        bankName = bankResult.rows[0].name;
      }
    }

    try {
      await client.query(`
        INSERT INTO bank_cards (
          id, "userId", "bankName", "accountName", "cardNumber",
          phone, province, city, "branchName", "idCard",
          "idCardFrontImage", "idCardBackImage", "isDefault", status, "rejectReason",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        newId, userId || safeStr(uid), bankName, accountName, cardNumber,
        safeStr(phone), province, city, branchName, idCard,
        idCardFrontImage, idCardBackImage, false, status || 0, rejectReason,
        unixToIso(createTime) || new Date().toISOString(),
        unixToIso(updateTime) || new Date().toISOString()
      ]);
      count++;
    } catch (e: any) {
      console.error(`银行卡错误 [${cardNumber}]: ${e.message}`);
    }
  }
  console.log(`   完成: ${count}/${rows.length}`);
}

// ========== 主函数 ==========

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     数据迁移 v4: 任务、订单、消息、银行卡                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  console.log('\n加载ID映射...');
  loadIdMapping();

  console.log('\n读取 SQL 文件...');
  const sql = fs.readFileSync(SQL_FILE, 'utf-8');
  console.log(`文件大小: ${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n连接 PostgreSQL...');
  const client = new Client(PG_CONFIG);

  try {
    await client.connect();
    console.log('连接成功!');

    await migrateTasks(client, sql);
    await migrateOrders(client, sql);
    await migrateMessages(client, sql);
    await migrateBankCards(client, sql);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('迁移完成!');
    console.log('════════════════════════════════════════════════════════════');

    // 保存更新的映射
    const mappingData: Record<string, Record<string, string>> = {};
    for (const [key, map] of Object.entries(idMap)) {
      mappingData[key] = Object.fromEntries(map);
    }
    fs.writeFileSync(ID_MAPPING_FILE, JSON.stringify(mappingData, null, 2));
    console.log('\nID 映射已更新');

  } catch (error) {
    console.error('\n迁移失败:', error);
  } finally {
    await client.end();
  }
}

main();
