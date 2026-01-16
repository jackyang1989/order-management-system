import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'jianouyang',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'order_management',
});

async function clearData() {
  try {
    await dataSource.initialize();
    console.log('✓ 数据库连接成功');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('\n开始清理数据...\n');

    // 1. 清空订单相关数据
    console.log('1. 清空订单数据...');
    await queryRunner.query('DELETE FROM order_logs');
    await queryRunner.query('DELETE FROM orders');
    console.log('   ✓ 订单数据已清空');

    // 2. 清空任务相关数据
    console.log('2. 清空任务数据...');
    await queryRunner.query('DELETE FROM task_keywords');
    await queryRunner.query('DELETE FROM task_goods');
    await queryRunner.query('DELETE FROM tasks');
    console.log('   ✓ 任务数据已清空');

    // 3. 清空商品数据
    console.log('3. 清空商品数据...');
    await queryRunner.query('DELETE FROM goods_keys');
    await queryRunner.query('DELETE FROM goods');
    console.log('   ✓ 商品数据已清空');

    // 4. 清空店铺数据
    console.log('4. 清空店铺数据...');
    await queryRunner.query('DELETE FROM shops');
    console.log('   ✓ 店铺数据已清空');

    // 5. 清空买号数据
    console.log('5. 清空买号数据...');
    await queryRunner.query('DELETE FROM buyer_accounts');
    console.log('   ✓ 买号数据已清空');

    // 6. 清空用户相关数据（保留特定用户）
    console.log('6. 清空用户数据（保留 ouyang）...');
    await queryRunner.query("DELETE FROM user_addresses WHERE \"userId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM user_credits WHERE \"userId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM user_day_counts WHERE \"userId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM user_invites WHERE \"inviterId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang') AND \"inviteeId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM bank_cards WHERE \"userId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM withdrawals WHERE \"userId\"::text NOT IN (SELECT id::text FROM users WHERE username = 'ouyang')");
    await queryRunner.query("DELETE FROM users WHERE username != 'ouyang'");
    console.log('   ✓ 用户数据已清空（保留 ouyang）');

    // 7. 清空商家相关数据（保留特定商家）
    console.log('7. 清空商家数据（保留 infu）...');
    await queryRunner.query("DELETE FROM merchant_bank_cards WHERE \"merchantId\"::text NOT IN (SELECT id::text FROM merchants WHERE username = 'infu')");
    await queryRunner.query("DELETE FROM merchant_withdrawals WHERE \"merchantId\"::text NOT IN (SELECT id::text FROM merchants WHERE username = 'infu')");
    await queryRunner.query("DELETE FROM merchant_blacklist WHERE \"merchantId\"::text NOT IN (SELECT id::text FROM merchants WHERE username = 'infu')");
    await queryRunner.query("DELETE FROM merchants WHERE username != 'infu'");
    console.log('   ✓ 商家数据已清空（保留 infu）');

    // 8. 清空财务记录
    console.log('8. 清空财务记录...');
    await queryRunner.query('DELETE FROM finance_records');
    await queryRunner.query('DELETE FROM fund_records');
    console.log('   ✓ 财务记录已清空');

    // 9. 清空充值和支付记录
    console.log('9. 清空充值和支付记录...');
    await queryRunner.query('DELETE FROM payment_callbacks');
    await queryRunner.query('DELETE FROM payment_orders');
    await queryRunner.query('DELETE FROM recharge_orders');
    await queryRunner.query('DELETE FROM recharges');
    await queryRunner.query('DELETE FROM reward_recharges');
    console.log('   ✓ 充值和支付记录已清空');

    // 10. 清空评价任务
    console.log('10. 清空评价任务...');
    await queryRunner.query('DELETE FROM review_tasks');
    console.log('   ✓ 评价任务已清空');

    // 11. 清空消息记录
    console.log('11. 清空消息记录...');
    await queryRunner.query('DELETE FROM messages');
    console.log('   ✓ 消息记录已清空');

    // 12. 清空操作日志
    console.log('12. 清空操作日志...');
    await queryRunner.query('DELETE FROM operation_logs');
    console.log('   ✓ 操作日志已清空');

    // 13. 清空VIP购买记录
    console.log('13. 清空VIP购买记录...');
    await queryRunner.query('DELETE FROM vip_purchases');
    console.log('   ✓ VIP购买记录已清空');

    // 14. 清空平台统计数据
    console.log('14. 清空平台统计数据...');
    await queryRunner.query('DELETE FROM platform_day_stats');
    console.log('   ✓ 平台统计数据已清空');

    // 15. 清空短信日志
    console.log('15. 清空短信日志...');
    await queryRunner.query('DELETE FROM sms_logs');
    console.log('   ✓ 短信日志已清空');

    await queryRunner.release();

    console.log('\n✓ 所有数据清理完成！');
    console.log('\n保留的数据：');
    console.log('  - 管理员账号（admin_users 表）');
    console.log('  - 用户: ouyang');
    console.log('  - 商家: infu');
    console.log('  - 系统配置（system_configs 表）');
    console.log('  - 帮助文章（help_articles 表）');
    console.log('  - 银行列表（banks 表）');
    console.log('  - 平台列表（platforms 表）');
    console.log('  - 分类数据（categories 表）');

  } catch (error) {
    console.error('✗ 清理数据失败:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// 执行清理
clearData()
  .then(() => {
    console.log('\n数据清理脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n数据清理脚本执行失败:', error);
    process.exit(1);
  });
