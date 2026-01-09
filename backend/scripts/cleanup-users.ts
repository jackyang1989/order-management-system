/**
 * 清理脚本：删除除 ouyang 外的所有买手账号及其关联数据
 *
 * 使用方法：
 * 1. cd backend
 * 2. npx ts-node scripts/cleanup-users.ts
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function safeDelete(queryRunner: any, sql: string, name: string): Promise<number> {
  try {
    const result = await queryRunner.query(sql);
    console.log(`删除 ${name}: ${result.length} 条`);
    return result.length;
  } catch (error: any) {
    if (error.code === '42P01') {
      // 表不存在
      console.log(`跳过 ${name}: 表不存在`);
    } else if (error.code === '42703') {
      // 列不存在
      console.log(`跳过 ${name}: 列不存在`);
    } else {
      console.log(`跳过 ${name}: ${error.message}`);
    }
    return 0;
  }
}

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'order_management',
    logging: true,
  });

  await dataSource.initialize();
  console.log('数据库连接成功');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. 获取要保留的用户 (ouyang)
    const keepUser = await queryRunner.query(
      `SELECT id FROM users WHERE username = 'ouyang'`
    );

    if (keepUser.length === 0) {
      console.log('警告：未找到 ouyang 用户');
    } else {
      console.log('保留用户 ouyang:', keepUser[0].id);
    }

    // 2. 获取要删除的用户ID列表
    const usersToDelete = await queryRunner.query(
      `SELECT id, username FROM users WHERE username != 'ouyang'`
    );
    console.log(`\n将删除 ${usersToDelete.length} 个用户:`);
    usersToDelete.forEach((u: any) => console.log(`  - ${u.username}`));

    if (usersToDelete.length === 0) {
      console.log('没有需要删除的用户');
      await queryRunner.rollbackTransaction();
      await dataSource.destroy();
      return;
    }

    const userIds = usersToDelete.map((u: any) => `'${u.id}'`).join(',');
    console.log('\n开始删除关联数据...\n');

    // 3. 删除关联数据（按照外键依赖顺序）

    // 资金记录
    await safeDelete(queryRunner,
      `DELETE FROM fund_records WHERE "userId" IN (${userIds}) RETURNING id`,
      'fund_records');

    // 财务流水
    await safeDelete(queryRunner,
      `DELETE FROM finance_records WHERE "userId" IN (${userIds}) RETURNING id`,
      'finance_records');

    // 订单相关 - 先获取订单ID
    const orders = await queryRunner.query(
      `SELECT id FROM orders WHERE "userId" IN (${userIds})`
    );
    if (orders.length > 0) {
      const orderIds = orders.map((o: any) => `'${o.id}'`).join(',');
      await safeDelete(queryRunner,
        `DELETE FROM order_logs WHERE "orderId" IN (${orderIds}) RETURNING id`,
        'order_logs');
    }

    // 删除订单
    await safeDelete(queryRunner,
      `DELETE FROM orders WHERE "userId" IN (${userIds}) RETURNING id`,
      'orders');

    // 买号
    await safeDelete(queryRunner,
      `DELETE FROM buyer_accounts WHERE "userId" IN (${userIds}) RETURNING id`,
      'buyer_accounts');

    // 银行卡
    await safeDelete(queryRunner,
      `DELETE FROM bank_cards WHERE "userId" IN (${userIds}) RETURNING id`,
      'bank_cards');

    // 提现记录
    await safeDelete(queryRunner,
      `DELETE FROM withdrawals WHERE "userId" IN (${userIds}) RETURNING id`,
      'withdrawals');

    // 充值记录
    await safeDelete(queryRunner,
      `DELETE FROM recharges WHERE "userId" IN (${userIds}) RETURNING id`,
      'recharges');

    // 收货地址
    await safeDelete(queryRunner,
      `DELETE FROM user_addresses WHERE "userId" IN (${userIds}) RETURNING id`,
      'user_addresses');

    // 用户积分
    await safeDelete(queryRunner,
      `DELETE FROM user_credits WHERE "userId" IN (${userIds}) RETURNING id`,
      'user_credits');

    // 用户邀请记录
    await safeDelete(queryRunner,
      `DELETE FROM user_invites WHERE "inviterId" IN (${userIds}) OR "inviteeId" IN (${userIds}) RETURNING id`,
      'user_invites');

    // 消息 (使用 senderId 和 receiverId)
    await safeDelete(queryRunner,
      `DELETE FROM messages WHERE "senderId" IN (${userIds}) OR "receiverId" IN (${userIds}) RETURNING id`,
      'messages');

    // 操作日志 (使用 operatorId)
    await safeDelete(queryRunner,
      `DELETE FROM operation_logs WHERE "operatorId" IN (${userIds}) RETURNING id`,
      'operation_logs');

    // 每日统计
    await safeDelete(queryRunner,
      `DELETE FROM user_day_counts WHERE "userId" IN (${userIds}) RETURNING id`,
      'user_day_counts');

    // VIP购买记录
    await safeDelete(queryRunner,
      `DELETE FROM vip_purchases WHERE "userId" IN (${userIds}) RETURNING id`,
      'vip_purchases');

    // 充值订单
    await safeDelete(queryRunner,
      `DELETE FROM recharge_orders WHERE "userId" IN (${userIds}) RETURNING id`,
      'recharge_orders');

    // 银锭充值 (使用 uid，并且 utype=2 表示买手)
    await safeDelete(queryRunner,
      `DELETE FROM reward_recharges WHERE "uid" IN (${userIds}) AND "utype" = 2 RETURNING id`,
      'reward_recharges');

    // 4. 最后删除用户
    console.log('\n删除用户...');
    const deletedUsers = await queryRunner.query(
      `DELETE FROM users WHERE username != 'ouyang' RETURNING id, username`
    );
    console.log(`删除 users: ${deletedUsers.length} 个`);
    deletedUsers.forEach((u: any) => console.log(`  - ${u.username} (${u.id})`));

    // 提交事务
    await queryRunner.commitTransaction();
    console.log('\n✅ 清理完成！');

    // 验证结果
    const remainingUsers = await queryRunner.query(`SELECT id, username FROM users`);
    console.log(`\n剩余用户: ${remainingUsers.length} 个`);
    remainingUsers.forEach((u: any) => console.log(`  - ${u.username}`));

  } catch (error) {
    console.error('\n清理失败:', error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

main().catch(console.error);
