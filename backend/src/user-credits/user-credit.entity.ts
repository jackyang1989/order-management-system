import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

// 用户类型
export enum CreditUserType {
  BUYER = 1, // 买手
  MERCHANT = 2, // 商家
}

// 信用变动类型
export enum CreditChangeType {
  INIT = 'init', // 初始化
  ORDER_COMPLETE = 'order_complete', // 订单完成
  ORDER_CANCEL = 'order_cancel', // 订单取消
  REFUND = 'refund', // 退款
  TIMEOUT = 'timeout', // 超时
  COMPLAINT = 'complaint', // 投诉
  REWARD = 'reward', // 奖励
  PENALTY = 'penalty', // 处罚
  ADMIN_ADJUST = 'admin_adjust', // 管理员调整
  DAILY_BONUS = 'daily_bonus', // 每日活跃奖励
  VIP_BONUS = 'vip_bonus', // VIP奖励
}

// 信用等级
export enum CreditLevel {
  BLACKLIST = -1, // 黑名单
  POOR = 0, // 较差
  NORMAL = 1, // 正常
  GOOD = 2, // 良好
  EXCELLENT = 3, // 优秀
  OUTSTANDING = 4, // 卓越
}

// 用户信用信息
@Entity('user_credits')
export class UserCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  userId: string; // 用户ID

  @Column({ type: 'int' })
  userType: CreditUserType; // 用户类型

  @Column({ type: 'int', default: 100 })
  score: number; // 信用分（0-150）

  @Column({ type: 'int', default: CreditLevel.NORMAL })
  level: CreditLevel; // 信用等级

  @Column({ default: 0 })
  totalOrders: number; // 总订单数

  @Column({ default: 0 })
  completedOrders: number; // 完成订单数

  @Column({ default: 0 })
  cancelledOrders: number; // 取消订单数

  @Column({ default: 0 })
  refundedOrders: number; // 退款订单数

  @Column({ default: 0 })
  timeoutCount: number; // 超时次数

  @Column({ default: 0 })
  complaintCount: number; // 被投诉次数

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  completionRate: number; // 完成率

  @Column({ default: false })
  isBlacklisted: boolean; // 是否黑名单

  @Column({ type: 'timestamp', nullable: true })
  blacklistUntil: Date; // 黑名单解除时间

  @Column({ type: 'text', nullable: true })
  blacklistReason: string; // 加入黑名单原因

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 信用变动记录
@Entity('credit_logs')
export class CreditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 用户ID

  @Column({ type: 'int' })
  userType: CreditUserType; // 用户类型

  @Column({ length: 30 })
  changeType: CreditChangeType; // 变动类型

  @Column({ type: 'int' })
  oldScore: number; // 原分数

  @Column({ type: 'int' })
  change: number; // 变动值（正负）

  @Column({ type: 'int' })
  newScore: number; // 新分数

  @Column({ nullable: true })
  relatedId: string; // 关联ID（订单等）

  @Column({ type: 'text', nullable: true })
  reason: string; // 变动原因

  @Column({ nullable: true })
  operatorId: string; // 操作人

  @CreateDateColumn()
  createdAt: Date;
}

// 信用等级配置
@Entity('credit_level_configs')
export class CreditLevelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true })
  level: CreditLevel; // 等级

  @Column({ length: 20 })
  name: string; // 等级名称

  @Column({ type: 'int' })
  minScore: number; // 最低分数

  @Column({ type: 'int' })
  maxScore: number; // 最高分数

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionBonus: number; // 佣金加成

  @Column({ type: 'int', default: 0 })
  dailyTaskLimit: number; // 每日任务限制（0表示使用默认）

  @Column({ type: 'text', nullable: true })
  privileges: string; // 特权描述

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class AdminAdjustCreditDto {
  @IsNumber()
  @Min(-100)
  @Max(100)
  change: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class BlacklistUserDto {
  @IsNumber()
  @IsOptional()
  days?: number; // 封禁天数，0或不传表示永久

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreditLogFilterDto {
  @IsEnum(CreditChangeType)
  @IsOptional()
  changeType?: CreditChangeType;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
