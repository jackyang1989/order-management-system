import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

/**
 * 用户类型枚举
 */
export enum RewardUserType {
  MERCHANT = 1, // 商家
  BUYER = 2, // 买手
}

/**
 * 充值状态
 */
export enum RechargeStatus {
  PENDING = 0, // 待支付
  PAID = 1, // 已支付
  FAILED = 2, // 支付失败
  CANCELLED = 3, // 已取消
}

/**
 * 支付方式
 */
export enum PayMethod {
  ALIPAY = 1, // 支付宝
  WECHAT = 2, // 微信
  BALANCE = 3, // 余额支付
}

/**
 * 银锭充值记录表
 * 记录所有银锭充值历史
 */
@Entity('reward_recharges')
export class RewardRecharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  uid: string; // 用户ID (买手ID或商家ID)

  @Column({ type: 'int' })
  utype: RewardUserType; // 用户类型: 1=商家, 2=买手

  @Column({ length: 100, nullable: true })
  userName: string; // 用户名 (冗余存储)

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number; // 充值金额（人民币）

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rewardAmount: number; // 获得银锭数量

  @Column({ type: 'int', default: RechargeStatus.PENDING })
  status: RechargeStatus; // 状态

  @Column({ type: 'int', default: PayMethod.ALIPAY })
  payMethod: PayMethod; // 支付方式

  @Column({ length: 100, nullable: true })
  orderNo: string; // 平台订单号

  @Column({ length: 100, nullable: true })
  tradeNo: string; // 第三方支付订单号

  @Column({ type: 'text', nullable: true })
  remarks: string; // 备注

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // 支付时间

  @CreateDateColumn()
  createdAt: Date;
}

// ============ DTOs ============

/**
 * 创建银锭充值DTO
 */
export class CreateRewardRechargeDto {
  @IsNumber()
  amount: number; // 充值金额

  @IsOptional()
  @IsEnum(PayMethod)
  payMethod?: PayMethod; // 支付方式
}

/**
 * 充值回调DTO
 */
export class RechargeCallbackDto {
  @IsString()
  orderNo: string; // 平台订单号

  @IsString()
  tradeNo: string; // 第三方支付订单号

  @IsNumber()
  amount: number; // 支付金额
}

/**
 * 充值记录查询DTO
 */
export class RewardRechargeFilterDto {
  @IsOptional()
  @IsString()
  uid?: string;

  @IsOptional()
  @IsEnum(RewardUserType)
  utype?: RewardUserType;

  @IsOptional()
  @IsEnum(RechargeStatus)
  status?: RechargeStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
