import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

// 用户类型
export enum RechargeUserType {
  BUYER = 2, // 买手
  MERCHANT = 1, // 商家
}

// 充值类型
export enum RechargeType {
  BALANCE = 1, // 充值押金/余额
  SILVER = 2, // 充值银锭
  VIP = 3, // 购买VIP会员
}

// 充值状态
export enum RechargeStatus {
  PENDING = 0, // 充值中/待支付
  SUCCESS = 1, // 已到账/成功
  FAILED = 2, // 失败
  CANCELLED = 3, // 已取消
}

// 支付方式
export enum PaymentMethod {
  ALIPAY = 'alipay', // 支付宝
  WECHAT = 'wechat', // 微信
  BANK = 'bank', // 银行转账
  ADMIN = 'admin', // 管理员充值
}

@Entity('recharges')
export class Recharge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 用户ID（买手ID或商家ID）

  @Column({ unique: true })
  orderNumber: string; // 充值订单号

  @Column({ type: 'int' })
  userType: RechargeUserType; // 1商家 2买手

  @Column({ type: 'int' })
  rechargeType: RechargeType; // 1押金 2银锭 3VIP

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // 充值金额

  @Column({ length: 50, nullable: true })
  tradeNo: string; // 第三方订单号（支付宝/微信）

  @Column({ type: 'int', default: RechargeStatus.PENDING })
  status: RechargeStatus;

  @Column({ length: 20, default: PaymentMethod.ALIPAY })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  arrivalTime: Date; // 到账时间

  @Column({ type: 'text', nullable: true })
  remark: string; // 备注

  @Column({ nullable: true })
  operatorId: string; // 操作人（管理员充值时）

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}

// DTOs
export class CreateRechargeDto {
  rechargeType: RechargeType;
  amount: number;
  paymentMethod?: PaymentMethod;
}

export class AdminRechargeDto {
  userId: string;
  userType: RechargeUserType;
  rechargeType: RechargeType;
  amount: number;
  remark?: string;
}

export class RechargeCallbackDto {
  orderNumber: string;
  tradeNo: string;
  status: RechargeStatus;
}

export class RechargeFilterDto {
  userId?: string;
  userType?: RechargeUserType;
  rechargeType?: RechargeType;
  status?: RechargeStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
