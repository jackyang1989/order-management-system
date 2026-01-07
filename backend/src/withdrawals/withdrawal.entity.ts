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
} from 'class-validator';

export enum WithdrawalStatus {
  PENDING = 0,                    // 待审核
  APPROVED_PENDING_TRANSFER = 1,  // 已审核待转账
  REJECTED = 2,                   // 已拒绝
  COMPLETED = 3,                  // 已完成（已打款）
}

export enum WithdrawalType {
  BALANCE = 1, // 本金提现
  SILVER = 2, // 银锭提现
}

export enum WithdrawalOwnerType {
  BUYER = 'buyer', // 买手
  MERCHANT = 'merchant', // 商家
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, default: WithdrawalOwnerType.BUYER })
  @Index()
  ownerType: WithdrawalOwnerType; // 所有者类型：买手或商家

  @Column()
  @Index()
  ownerId: string; // 所有者ID（买手ID或商家ID）

  // 保留 userId 字段用于向后兼容（买手提现）
  @Column({ nullable: true })
  @Index()
  userId?: string; // 用户ID（兼容旧数据，新数据使用ownerId）

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // 提现金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  fee: number; // 手续费

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  actualAmount: number; // 实际到账金额

  @Column({ type: 'int', default: WithdrawalType.BALANCE })
  type: WithdrawalType; // 提现类型

  @Column({ type: 'int', default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ nullable: true })
  bankCardId?: string; // 银行卡ID

  @Column({ length: 50 })
  bankName: string; // 银行名称

  @Column({ length: 50 })
  accountName: string; // 开户人

  @Column({ length: 30 })
  cardNumber: string; // 银行卡号

  @Column({ length: 20, nullable: true })
  phone?: string; // 手机号

  @Column({ type: 'text', nullable: true })
  remark?: string; // 备注/拒绝原因

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date; // 审核时间

  @Column({ nullable: true })
  reviewedBy?: string; // 审核人

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateWithdrawalDto {
  @IsNumber()
  @Min(10)
  amount: number;

  @IsEnum(WithdrawalType)
  @IsOptional()
  type?: WithdrawalType;

  @IsString()
  @IsNotEmpty()
  bankCardId: string;

  @IsString()
  @IsOptional()
  payPassword?: string; // 支付密码（买手必须验证，商家可选）

  @IsEnum(WithdrawalOwnerType)
  @IsOptional()
  ownerType?: WithdrawalOwnerType; // 所有者类型（用于统一接口）
}

export class ReviewWithdrawalDto {
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}
