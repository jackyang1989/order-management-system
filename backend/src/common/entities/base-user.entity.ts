import { Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * BaseUserEntity - 买手和商家的公共基类
 *
 * 包含两者共有的账户相关字段：
 * - 认证信息（用户名、密码、手机号）
 * - 余额信息（本金、银锭、冻结金额）
 * - VIP信息
 * - 支付密码
 *
 * 使用说明：
 * - User 和 Merchant 实体应继承此基类
 * - 子类负责定义自己特有的字段
 * - 此类使用 TypeORM 的实体继承特性
 */
export abstract class BaseUserEntity {
  // ============ 认证信息 ============

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // hashed

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  wechat?: string;

  // ============ 账户余额 ============

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // 本金/押金余额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  frozenBalance: number; // 冻结本金

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  silver: number; // 银锭余额

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    nullable: true,
  })
  frozenSilver?: number; // 冻结银锭

  // ============ VIP信息 ============

  @Column({ default: false })
  vip: boolean;

  @Column({ type: 'timestamp', nullable: true })
  vipExpireAt?: Date;

  // ============ 支付密码 ============

  @Column({ nullable: true })
  payPassword?: string; // 支付密码 (hashed)

  // ============ 时间戳 ============

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 账户类型枚举
 */
export enum AccountType {
  BUYER = 'buyer',
  MERCHANT = 'merchant',
}
