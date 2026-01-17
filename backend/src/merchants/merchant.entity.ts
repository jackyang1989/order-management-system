import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

// 商家状态
export enum MerchantStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已通过
  REJECTED = 2, // 已拒绝
  DISABLED = 3, // 已禁用
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  merchantNo: string; // 商家编号 M10001

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  wechat: string;

  @Column({ nullable: true })
  avatar: string;

  // 企业信息
  @Column({ name: 'business_license', nullable: true })
  businessLicense: string;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  // 账户余额
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({
    name: 'frozen_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  frozenBalance: number; // 冻结余额（任务预扣）

  // 银锭（奖励积分）
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  silver: number;

  // 状态
  @Column({ default: MerchantStatus.PENDING })
  status: MerchantStatus;

  // 支付密码
  @Column({ name: 'pay_password', nullable: true })
  payPassword: string;

  // 邀请码（自己的唯一邀请码）
  @Column({ name: 'invite_code', nullable: true, unique: true })
  inviteCode: string;

  // 注册时使用的邀请码（被谁邀请）
  @Column({ name: 'invited_by', nullable: true })
  invitedBy: string; // 邀请人的ID

  @Column({ name: 'invite_state', type: 'int', default: 0 })
  inviteState: number; // 邀请状态 0=未验证 1=已验证

  // 推荐人ID
  @Column({ name: 'referrer_id', nullable: true })
  referrerId: string;

  // 备注
  @Column({ nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// DTOs
export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  invitationCode: string; // 注册时填写的邀请码（必填）

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsOptional()
  vipExpireAt?: string; // VIP到期时间

  @IsOptional()
  balance?: number; // 本金余额

  @IsOptional()
  silver?: number; // 银锭余额

  @IsString()
  @IsOptional()
  note?: string; // 备注
}

export class MerchantLoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateMerchantDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsString()
  @IsOptional()
  businessLicense?: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
