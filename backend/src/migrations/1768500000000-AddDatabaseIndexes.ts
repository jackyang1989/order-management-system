import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * P1-1: 数据库索引优化迁移
 *
 * 为高频查询字段添加索引以提升查询性能
 *
 * 索引策略：
 * 1. 外键字段（merchantId, userId, taskId 等）
 * 2. 状态字段（status, state）
 * 3. 时间字段（createdAt, updatedAt）用于排序
 * 4. 复合索引用于常见的联合查询条件
 */
export class AddDatabaseIndexes1768500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ Tasks 表索引 ============
    // 商家查询任务列表（高频）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_merchantId" ON "tasks" ("merchantId")`,
    );

    // 任务状态查询（列表筛选）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status")`,
    );

    // 任务类型查询（平台筛选）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_taskType" ON "tasks" ("taskType")`,
    );

    // 创建时间排序（列表默认排序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_createdAt" ON "tasks" ("createdAt" DESC)`,
    );

    // 复合索引：商家+状态（商家查看自己的特定状态任务）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_merchantId_status" ON "tasks" ("merchantId", "status")`,
    );

    // 复合索引：状态+创建时间（按状态筛选并排序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_status_createdAt" ON "tasks" ("status", "createdAt" DESC)`,
    );

    // 店铺ID索引（关联店铺查询）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_shopId" ON "tasks" ("shopId")`,
    );

    // ============ Orders 表索引 ============
    // 注意：taskId 和 userId 已有索引（@Index() 装饰器）

    // 订单状态查询（高频筛选）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")`,
    );

    // 买号ID查询（买手查看自己的订单）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_buynoId" ON "orders" ("buynoId")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_createdAt" ON "orders" ("createdAt" DESC)`,
    );

    // 发货状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_deliveryState" ON "orders" ("deliveryState")`,
    );

    // 复合索引：任务+状态（查询特定任务的特定状态订单）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_taskId_status" ON "orders" ("taskId", "status")`,
    );

    // 复合索引：用户+状态（用户查看自己的特定状态订单）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_userId_status" ON "orders" ("userId", "status")`,
    );

    // 复合索引：状态+创建时间（按状态筛选并排序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_status_createdAt" ON "orders" ("status", "createdAt" DESC)`,
    );

    // ============ Withdrawals 表索引 ============
    // 用户ID查询（用户查看自己的提现记录）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_userId" ON "withdrawals" ("userId")`,
    );

    // 提现状态查询（管理员审核列表）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_status" ON "withdrawals" ("status")`,
    );

    // 提现类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_type" ON "withdrawals" ("type")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_createdAt" ON "withdrawals" ("createdAt" DESC)`,
    );

    // 复合索引：用户+状态
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_userId_status" ON "withdrawals" ("userId", "status")`,
    );

    // 复合索引：状态+创建时间（待审核列表按时间排序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_status_createdAt" ON "withdrawals" ("status", "createdAt" ASC)`,
    );

    // ============ MerchantWithdrawals 表索引 ============
    // 商家ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_merchantId" ON "merchant_withdrawals" ("merchantId")`,
    );

    // 提现状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_status" ON "merchant_withdrawals" ("status")`,
    );

    // 提现类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_type" ON "merchant_withdrawals" ("type")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_createdAt" ON "merchant_withdrawals" ("createdAt" DESC)`,
    );

    // 复合索引：商家+状态
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_merchantId_status" ON "merchant_withdrawals" ("merchantId", "status")`,
    );

    // 复合索引：状态+创建时间
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_status_createdAt" ON "merchant_withdrawals" ("status", "createdAt" ASC)`,
    );

    // ============ FinanceRecords 表索引 ============
    // 用户ID查询（用户查看自己的资金流水）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_userId" ON "finance_records" ("userId")`,
    );

    // 商家ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_merchantId" ON "finance_records" ("merchantId")`,
    );

    // 记录类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_type" ON "finance_records" ("type")`,
    );

    // 创建时间排序（流水记录按时间倒序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_createdAt" ON "finance_records" ("createdAt" DESC)`,
    );

    // 复合索引：用户+类型+时间（用户查看特定类型流水）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_userId_type_createdAt" ON "finance_records" ("userId", "type", "createdAt" DESC)`,
    );

    // 复合索引：商家+类型+时间
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_merchantId_type_createdAt" ON "finance_records" ("merchantId", "type", "createdAt" DESC)`,
    );

    // ============ Messages 表索引 ============
    // 接收者ID查询（用户查看自己的消息）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_receiverId" ON "messages" ("receiverId")`,
    );

    // 发送者ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_senderId" ON "messages" ("senderId")`,
    );

    // 已读状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_isRead" ON "messages" ("isRead")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_createdAt" ON "messages" ("createdAt" DESC)`,
    );

    // 复合索引：接收者+已读状态（查询未读消息）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_receiverId_isRead" ON "messages" ("receiverId", "isRead")`,
    );

    // ============ UserAddresses 表索引 ============
    // 用户ID查询（用户查看自己的地址列表）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_addresses_userId" ON "user_addresses" ("userId")`,
    );

    // 默认地址查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_addresses_userId_isDefault" ON "user_addresses" ("userId", "isDefault")`,
    );

    // ============ MerchantBankCards 表索引 ============
    // 商家ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_bank_cards_merchantId" ON "merchant_bank_cards" ("merchantId")`,
    );

    // 银行卡状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_bank_cards_status" ON "merchant_bank_cards" ("status")`,
    );

    // 复合索引：商家+状态（查询商家的已审核银行卡）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_bank_cards_merchantId_status" ON "merchant_bank_cards" ("merchantId", "status")`,
    );

    // ============ BankCards 表索引 ============
    // 用户ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bank_cards_userId" ON "bank_cards" ("userId")`,
    );

    // 银行卡状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bank_cards_status" ON "bank_cards" ("status")`,
    );

    // 复合索引：用户+状态
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bank_cards_userId_status" ON "bank_cards" ("userId", "status")`,
    );

    // ============ Payments 表索引 ============
    // 用户ID查询（用户查看自己的充值记录）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_userId" ON "payments" ("userId")`,
    );

    // 支付状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status")`,
    );

    // 商户订单号查询（支付回调）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_outTradeNo" ON "payments" ("outTradeNo")`,
    );

    // 第三方交易号查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_tradeNo" ON "payments" ("tradeNo")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_createdAt" ON "payments" ("createdAt" DESC)`,
    );

    // ============ Shops 表索引 ============
    // 商家ID查询（商家查看自己的店铺）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shops_merchantId" ON "shops" ("merchantId")`,
    );

    // 店铺状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shops_status" ON "shops" ("status")`,
    );

    // 平台类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shops_platform" ON "shops" ("platform")`,
    );

    // ============ BuyerAccounts 表索引 ============
    // 用户ID查询（用户查看自己的买号）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyer_accounts_userId" ON "buyer_accounts" ("userId")`,
    );

    // 平台类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyer_accounts_platform" ON "buyer_accounts" ("platform")`,
    );

    // 账号状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyer_accounts_status" ON "buyer_accounts" ("status")`,
    );

    // ============ OperationLogs 表索引 ============
    // 操作人ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_logs_operatorId" ON "operation_logs" ("operatorId")`,
    );

    // 操作类型查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_logs_action" ON "operation_logs" ("action")`,
    );

    // 创建时间排序（日志按时间倒序）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_logs_createdAt" ON "operation_logs" ("createdAt" DESC)`,
    );

    // ============ ReferralRewards 表索引 ============
    // 用户ID查询（用户查看自己的推荐奖励）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_referral_rewards_userId" ON "referral_rewards" ("userId")`,
    );

    // 创建时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_referral_rewards_createdAt" ON "referral_rewards" ("createdAt" DESC)`,
    );

    // ============ UserInvites 表索引 ============
    // 邀请人ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_invites_inviterId" ON "user_invites" ("inviterId")`,
    );

    // 被邀请人ID查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_invites_inviteeId" ON "user_invites" ("inviteeId")`,
    );

    // 绑定状态查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_invites_bondStatus" ON "user_invites" ("bondStatus")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============ 删除所有索引（回滚） ============

    // Tasks
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_merchantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_taskType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_merchantId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_shopId"`);

    // Orders
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_buynoId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_deliveryState"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_taskId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status_createdAt"`);

    // Withdrawals
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_status_createdAt"`);

    // MerchantWithdrawals
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_merchantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_merchantId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_status_createdAt"`);

    // FinanceRecords
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_merchantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_userId_type_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_merchantId_type_createdAt"`);

    // Messages
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_receiverId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_senderId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_isRead"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_receiverId_isRead"`);

    // UserAddresses
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_addresses_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_addresses_userId_isDefault"`);

    // MerchantBankCards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_bank_cards_merchantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_bank_cards_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_bank_cards_merchantId_status"`);

    // BankCards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_cards_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_cards_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_cards_userId_status"`);

    // Payments
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_outTradeNo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tradeNo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_createdAt"`);

    // Shops
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_merchantId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_platform"`);

    // BuyerAccounts
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyer_accounts_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyer_accounts_platform"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyer_accounts_status"`);

    // OperationLogs
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_logs_operatorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_logs_createdAt"`);

    // ReferralRewards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_rewards_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_rewards_createdAt"`);

    // UserInvites
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_invites_inviterId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_invites_inviteeId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_invites_bondStatus"`);
  }
}
