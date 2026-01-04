import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

// 用户类型
export enum FinanceUserType {
  BUYER = 1, // 买手
  MERCHANT = 2, // 商家
}

// 资金类型
export enum FinanceMoneyType {
  BALANCE = 1, // 余额/押金/本金
  SILVER = 2, // 银锭/礼金
}

// 财务类型分类 (对应原版 type 字段)
export enum FinanceType {
  // 买手相关
  BUYER_RECHARGE = 1, // 充值押金
  BUYER_RECHARGE_SILVER = 2, // 充值银锭
  BUYER_WITHDRAW = 3, // 提现
  BUYER_WITHDRAW_SILVER = 31, // 银锭提现
  BUYER_BALANCE_TO_SILVER = 4, // 本金转银锭
  BUYER_TASK_PREPAY = 5, // 做单垫付
  BUYER_TASK_REFUND = 6, // 任务返款
  BUYER_TASK_COMMISSION = 7, // 任务佣金
  BUYER_INVITE_REWARD = 8, // 邀请奖励
  BUYER_ADMIN_ADD = 9, // 管理员充值
  BUYER_ADMIN_DEDUCT = 10, // 管理员扣除
  BUYER_TASK_SILVER_REFUND = 11, // 返还做任务押的银锭 (原版type=11)
  BUYER_WITHDRAW_REJECT = 12, // 拒绝提现退款 (原版type=12)
  BUYER_TASK_CANCEL_SILVER = 13, // 取消任务扣除冻结银锭 (原版type=13)
  BUYER_REGISTER_GIFT = 14, // 注册赠送

  // 商家相关
  MERCHANT_RECHARGE = 21, // 商家充值押金
  MERCHANT_RECHARGE_SILVER = 22, // 商家充值银锭
  MERCHANT_WITHDRAW = 23, // 商家提现
  MERCHANT_WITHDRAW_SILVER = 32, // 商家银锭提现
  MERCHANT_TASK_FREEZE = 24, // 发布任务冻结
  MERCHANT_TASK_UNFREEZE = 25, // 任务取消解冻
  MERCHANT_TASK_SETTLE = 26, // 任务结算（返款给买手）
  MERCHANT_TASK_FEE = 27, // 任务服务费
  MERCHANT_TASK_REFUND = 33, // 商家任务退款
  MERCHANT_ADMIN_ADD = 28, // 管理员充值
  MERCHANT_ADMIN_DEDUCT = 29, // 管理员扣除

  // 追评相关 (对应原版 type 15-19)
  REVIEW_TASK_PAY_BALANCE = 15, // 使用押金发布追评任务
  REVIEW_TASK_PAY_SILVER = 16, // 使用银锭发布追评任务
  REVIEW_TASK_CANCEL_REFUND = 17, // 取消追评任务退回
  REVIEW_TASK_COMMISSION = 18, // 完成追评任务获得佣金
  REVIEW_TASK_REJECT_REFUND = 19, // 买手拒绝追评任务退回

  // 其他
  REWARD = 40, // 奖励
  REFUND = 41, // 退款
}

// ============ 财务流水记录表 ============
@Entity('finance_records')
export class FinanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 用户ID（买手ID或商家ID）

  @Column({ type: 'int' })
  userType: FinanceUserType; // 1买手 2商家

  @Column({ type: 'int' })
  moneyType: FinanceMoneyType; // 1余额 2银锭

  @Column({ type: 'int' })
  financeType: FinanceType; // 财务类型

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // 变动金额（正数增加，负数减少）

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number; // 变动后余额

  @Column({ type: 'text', nullable: true })
  memo: string; // 备注说明

  @Column({ nullable: true })
  relatedId: string; // 关联ID（订单ID、任务ID、提现ID等）

  @Column({ length: 50, nullable: true })
  relatedType: string; // 关联类型（order、task、withdrawal等）

  @Column({ nullable: true })
  operatorId: string; // 操作人ID（管理员操作时）

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}

// DTOs
export class CreateFinanceRecordDto {
  userId: string;
  userType: FinanceUserType;
  moneyType: FinanceMoneyType;
  financeType: FinanceType;
  amount: number;
  balanceAfter: number;
  memo?: string;
  relatedId?: string;
  relatedType?: string;
  operatorId?: string;
}

export class FinanceRecordFilterDto {
  userId?: string;
  userType?: FinanceUserType;
  moneyType?: FinanceMoneyType;
  financeType?: FinanceType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
