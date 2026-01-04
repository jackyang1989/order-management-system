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

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  qq: string;

  // 企业信息
  @Column({ name: 'company_name', nullable: true })
  companyName: string;

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

  // VIP
  @Column({ default: false })
  vip: boolean;

  @Column({ name: 'vip_expire_at', nullable: true })
  vipExpireAt: Date;

  // 状态
  @Column({ default: MerchantStatus.PENDING })
  status: MerchantStatus;

  // 支付密码
  @Column({ name: 'pay_password', nullable: true })
  payPassword: string;

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
  @IsOptional()
  qq?: string;

  @IsString()
  @IsOptional()
  companyName?: string;
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
  qq?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  businessLicense?: string;

  @IsString()
  @IsOptional()
  contactName?: string;
}
