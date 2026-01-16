import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

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
    console.log('✓ 数据库连接成功\n');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('开始清理数据...\n');

    // 获取保留的用户和商家ID
    const users = await queryRunner.query("SELECT id FROM users WHERE username = 'ouyang'");
    const merchants = await queryRunner.query("SELECT id FROM merchants WHERE username = 'infu'");

    const keepUserId = users[0]?.id;
    const keepMerchantId = merchants[0]?.id;

    console.log(`保留用户ID: ${keepUserId}`);
    console.log(`保留商家ID: ${keepMerchantId}\n`);

    // 1. 清空订单相关
    console.log('1. 清空订单数据...');
    await queryRunner.query('TRUNCATE TABLE order_logs CASCADE');
    await queryRunner.query('TRUNCATE TABLE orders CASCADE');
    console.log('   ✓ 完成');

    // 2. 清空任务相关
    console.log('2. 清空任务数据...');
    await queryRunner.query('TRUNCATE TABLE task_keywords CASCADE');
    await queryRunner.query('TRUNCATE TABLE task_goods CASCADE');
    await queryRunner.query('TRUNCATE TABLE tasks CASCADE');
    console.log('   ✓ 完成');

    // 3. 清空商品
    console.log('3. 清空商品数据...');
    await queryRunner.query('TRUNCATE TABLE goods_keys CASCADE');
    await queryRunner.query('TRUNCATE TABLE goods CASCADE');
    console.log('   ✓ 完成');

    // 4. 清空店铺
    console.log('4. 清空店铺数据...');
    await queryRunner.query('TRUNCATE TABLE shops CASCADE');
    console.log('   ✓ 完成');

    // 5. 清空买号
    console.log('5. 清空买号数据...');
    await queryRunner.query('TRUNCATE TABLE buyer_accounts CASCADE');
    console.log('   ✓ 完成');

    // 6. 清空评价任务
    console.log('6. 清空评价任务...');
    await queryRunner.query('TRUNCATE TABLE review_tasks CASCADE');
    console.log('   ✓ 完成');

    // 7. 清空财务记录
    console.log('7. 清空财务记录...');
    await queryRunner.query('TRUNCATE TABLE finance_records CASCADE');
    await queryRunner.query('TRUNCATE TABLE fund_records CASCADE');
    console.log('   ✓ 完成');

    // 8. 清空充值支付
    console.log('8. 清空充值支付记录...');
    await queryRunner.query('TRUNCATE TABLE payment_callbacks CASCADE');
    await queryRunner.query('TRUNCATE TABLE payment_orders CASCADE');
    await queryRunner.query('TRUNCATE TABLE recharge_orders CASCADE');
    await queryRunner.query('TRUNCATE TABLE recharges CASCADE');
    await queryRunner.query('TRUNCATE TABLE reward_recharges CASCADE');
    console.log('   ✓ 完成');

    // 9. 清空VIP购买
    console.log('9. 清空VIP购买记录...');
    await queryRunner.query('TRUNCATE TABLE vip_purchases CASCADE');
    console.log('   ✓ 完成');

    // 10. 清空消息
    console.log('10. 清空消息记录...');
    await queryRunner.query('TRUNCATE TABLE messages CASCADE');
    console.log('   ✓ 完成');

    // 11. 清空日志
    console.log('11. 清空操作日志...');
    await queryRunner.query('TRUNCATE TABLE operation_logs CASCADE');
    await queryRunner.query('TRUNCATE TABLE sms_logs CASCADE');
    console.log('   ✓ 完成');

    // 12. 清空统计
    console.log('12. 清空统计数据...');
    await queryRunner.query('TRUNCATE TABLE platform_day_stats CASCADE');
    console.log('   ✓ 完成');

    // 13. 清空用户相关（保留ouyang）
    console.log('13. 清空用户数据（保留 ouyang）...');
    if (keepUserId) {
      await queryRunner.query(`DELETE FROM user_addresses WHERE "userId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM user_credits WHERE "userId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM user_day_counts WHERE "userId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM user_invites WHERE "inviterId" != '${keepUserId}' OR "inviteeId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM bank_cards WHERE "userId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM withdrawals WHERE "userId" != '${keepUserId}'`);
      await queryRunner.query(`DELETE FROM users WHERE id != '${keepUserId}'`);
    } else {
      await queryRunner.query('TRUNCATE TABLE user_addresses CASCADE');
      await queryRunner.query('TRUNCATE TABLE user_credits CASCADE');
      await queryRunner.query('TRUNCATE TABLE user_day_counts CASCADE');
      await queryRunner.query('TRUNCATE TABLE user_invites CASCADE');
      await queryRunner.query('TRUNCATE TABLE bank_cards CASCADE');
      await queryRunner.query('TRUNCATE TABLE withdrawals CASCADE');
      await queryRunner.query('TRUNCATE TABLE users CASCADE');
    }
    console.log('   ✓ 完成');

    // 14. 清空商家相关（保留infu）
    console.log('14. 清空商家数据（保留 infu）...');
    if (keepMerchantId) {
      await queryRunner.query(`DELETE FROM merchant_bank_cards WHERE "merchantId" != '${keepMerchantId}'`);
      await queryRunner.query(`DELETE FROM merchant_withdrawals WHERE "merchantId" != '${keepMerchantId}'`);
      await queryRunner.query(`DELETE FROM merchant_blacklist WHERE "sellerId" != '${keepMerchantId}'`);
      await queryRunner.query(`DELETE FROM merchants WHERE id != '${keepMerchantId}'`);
    } else {
      await queryRunner.query('TRUNCATE TABLE merchant_bank_cards CASCADE');
      await queryRunner.query('TRUNCATE TABLE merchant_withdrawals CASCADE');
      await queryRunner.query('TRUNCATE TABLE merchant_blacklist CASCADE');
      await queryRunner.query('TRUNCATE TABLE merchants CASCADE');
    }
    console.log('   ✓ 完成');

    await queryRunner.release();

    console.log('\n✓ 所有数据清理完成！');
    console.log('\n保留的数据：');
    console.log('  - 管理员账号');
    console.log('  - 用户: ouyang');
    console.log('  - 商家: infu');
    console.log('  - 系统配置');
    console.log('  - 帮助文章');
    console.log('  - 银行列表');
    console.log('  - 平台列表');
    console.log('  - 分类数据');

  } catch (error) {
    console.error('✗ 清理失败:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

clearData()
  .then(() => {
    console.log('\n数据清理完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n数据清理失败:', error);
    process.exit(1);
  });
