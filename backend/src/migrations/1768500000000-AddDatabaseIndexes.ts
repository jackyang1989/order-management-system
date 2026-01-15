import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * P1-1: 数据库索引优化迁移（优化版）
 *
 * 索引优化策略：
 * 1. 利用复合索引的最左前缀原则，避免冗余单字段索引
 * 2. 只为高频查询场景添加索引
 * 3. 平衡查询性能和写入性能
 *
 * 索引设计原则：
 * - 复合索引 (A, B) 可以覆盖 A 的单字段查询
 * - 优先为外键、状态字段、时间排序字段建索引
 * - 避免为低频查询或选择性差的字段建索引
 */
export class AddDatabaseIndexes1768500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============ Tasks 表索引 ============
    // 复合索引：商家+状态+创建时间（覆盖商家查询任务的所有场景）
    // 可覆盖：merchantId 单独查询、merchantId+status 查询、merchantId+status+时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_merchantId_status_createdAt"
       ON "tasks" ("merchantId", "status", "createdAt" DESC)`,
    );

    // 复合索引：状态+创建时间（管理员按状态筛选任务列表）
    // 可覆盖：status 单独查询、status+时间排序
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_status_createdAt"
       ON "tasks" ("status", "createdAt" DESC)`,
    );

    // 单字段索引：店铺ID（关联店铺查询，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_shopId" ON "tasks" ("shopId")`,
    );

    // 单字段索引：任务类型（平台筛选，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tasks_taskType" ON "tasks" ("taskType")`,
    );

    // ============ Orders 表索引 ============
    // 注意：taskId 和 userId 已有索引（@Index() 装饰器）

    // 复合索引：任务+状态+创建时间（查询特定任务的订单列表）
    // 可覆盖：taskId+status 查询（taskId 已有单独索引）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_taskId_status_createdAt"
       ON "orders" ("taskId", "status", "createdAt" DESC)`,
    );

    // 复合索引：用户+状态+创建时间（用户查看自己的订单）
    // 可覆盖：userId+status 查询（userId 已有单独索引）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_userId_status_createdAt"
       ON "orders" ("userId", "status", "createdAt" DESC)`,
    );

    // 复合索引：状态+创建时间（管理员按状态筛选订单）
    // 可覆盖：status 单独查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_status_createdAt"
       ON "orders" ("status", "createdAt" DESC)`,
    );

    // 单字段索引：买号ID（买手查看订单，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_buynoId" ON "orders" ("buynoId")`,
    );

    // 单字段索引：发货状态（物流管理，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_orders_deliveryState" ON "orders" ("deliveryState")`,
    );

    // ============ Withdrawals 表索引 ============
    // 复合索引：用户+状态+创建时间（用户查看提现记录）
    // 可覆盖：userId 单独查询、userId+status 查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_userId_status_createdAt"
       ON "withdrawals" ("userId", "status", "createdAt" DESC)`,
    );

    // 复合索引：状态+创建时间（管理员审核列表，按时间正序）
    // 可覆盖：status 单独查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_status_createdAt"
       ON "withdrawals" ("status", "createdAt" ASC)`,
    );

    // 单字段索引：提现类型（按类型筛选，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_withdrawals_type" ON "withdrawals" ("type")`,
    );

    // ============ MerchantWithdrawals 表索引 ============
    // 复合索引：商家+状态+创建时间
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_merchantId_status_createdAt"
       ON "merchant_withdrawals" ("merchantId", "status", "createdAt" DESC)`,
    );

    // 复合索引：状态+创建时间（管理员审核列表）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_status_createdAt"
       ON "merchant_withdrawals" ("status", "createdAt" ASC)`,
    );

    // 单字段索引：提现类型
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_withdrawals_type"
       ON "merchant_withdrawals" ("type")`,
    );

    // ============ FinanceRecords 表索引 ============
    // 复合索引：用户+类型+创建时间（用户查看特定类型流水）
    // 可覆盖：userId 单独查询、userId+type 查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_userId_type_createdAt"
       ON "finance_records" ("userId", "type", "createdAt" DESC)`,
    );

    // 复合索引：商家+类型+创建时间
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_records_merchantId_type_createdAt"
       ON "finance_records" ("merchantId", "type", "createdAt" DESC)`,
    );

    // ============ Messages 表索引 ============
    // 复合索引：接收者+已读状态+创建时间（查询未读消息）
    // 可覆盖：receiverId 单独查询、receiverId+isRead 查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_receiverId_isRead_createdAt"
       ON "messages" ("receiverId", "isRead", "createdAt" DESC)`,
    );

    // 单字段索引：发送者ID（查询发送记录，独立场景）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_senderId" ON "messages" ("senderId")`,
    );

    // ============ UserAddresses 表索引 ============
    // 复合索引：用户+默认地址（查询用户的默认地址）
    // 可覆盖：userId 单独查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_addresses_userId_isDefault"
       ON "user_addresses" ("userId", "isDefault")`,
    );

    // ============ MerchantBankCards 表索引 ============
    // 复合索引：商家+状态（查询商家的已审核银行卡）
    // 可覆盖：merchantId 单独查询
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_bank_cards_merchantId_status"
       ON "merchant_bank_cards" ("merchantId", "status")`,
    );

    // 单字段索引：状态（管理员审核列表）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_merchant_bank_cards_status"
       ON "merchant_bank_cards" ("status")`,
    );

    // ============ BankCards 表索引 ============
    // 复合索引：用户+状态
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bank_cards_userId_status"
       ON "bank_cards" ("userId", "status")`,
    );

    // 单字段索引：状态（管理员审核列表）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bank_cards_status" ON "bank_cards" ("status")`,
    );

    // ============ Payments 表索引 ============
    // 复合索引：用户+状态+创建时间（用户查看充值记录）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_userId_status_createdAt"
       ON "payments" ("userId", "status", "createdAt" DESC)`,
    );

    // 单字段索引：商户订单号（支付回调查询，高频且唯一）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_outTradeNo" ON "payments" ("outTradeNo")`,
    );

    // 单字段索引：第三方交易号（支付回调查询）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_tradeNo" ON "payments" ("tradeNo")`,
    );

    // ============ Shops 表索引 ============
    // 复合索引：商家+状态（商家查看自己的店铺）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shops_merchantId_status"
       ON "shops" ("merchantId", "status")`,
    );

    // 单字段索引：平台类型（按平台筛选）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_shops_platform" ON "shops" ("platform")`,
    );

    // ============ BuyerAccounts 表索引 ============
    // 复合索引：用户+平台+状态（用户查看特定平台的买号）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_buyer_accounts_userId_platform_status"
       ON "buyer_accounts" ("userId", "platform", "status")`,
    );

    // ============ OperationLogs 表索引 ============
    // 复合索引：操作人+操作类型+创建时间（查询特定人的操作日志）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_logs_operatorId_action_createdAt"
       ON "operation_logs" ("operatorId", "action", "createdAt" DESC)`,
    );

    // 复合索引：操作类型+创建时间（按类型筛选日志）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_logs_action_createdAt"
       ON "operation_logs" ("action", "createdAt" DESC)`,
    );

    // ============ ReferralRewards 表索引 ============
    // 复合索引：用户+创建时间（用户查看推荐奖励）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_referral_rewards_userId_createdAt"
       ON "referral_rewards" ("userId", "createdAt" DESC)`,
    );

    // ============ UserInvites 表索引 ============
    // 复合索引：邀请人+绑定状态（查询邀请关系）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_invites_inviterId_bondStatus"
       ON "user_invites" ("inviterId", "bondStatus")`,
    );

    // 单字段索引：被邀请人ID（反向查询）
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_invites_inviteeId"
       ON "user_invites" ("inviteeId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============ 删除所有索引（回滚） ============

    // Tasks
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_merchantId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_shopId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_taskType"`);

    // Orders
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_taskId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_userId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_buynoId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_deliveryState"`);

    // Withdrawals
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_userId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_withdrawals_type"`);

    // MerchantWithdrawals
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_merchantId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_withdrawals_type"`);

    // FinanceRecords
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_userId_type_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_finance_records_merchantId_type_createdAt"`);

    // Messages
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_receiverId_isRead_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_senderId"`);

    // UserAddresses
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_addresses_userId_isDefault"`);

    // MerchantBankCards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_bank_cards_merchantId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_merchant_bank_cards_status"`);

    // BankCards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_cards_userId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bank_cards_status"`);

    // Payments
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_userId_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_outTradeNo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_tradeNo"`);

    // Shops
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_merchantId_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_platform"`);

    // BuyerAccounts
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_buyer_accounts_userId_platform_status"`);

    // OperationLogs
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_logs_operatorId_action_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_logs_action_createdAt"`);

    // ReferralRewards
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referral_rewards_userId_createdAt"`);

    // UserInvites
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_invites_inviterId_bondStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_invites_inviteeId"`);
  }
}
