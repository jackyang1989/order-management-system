import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';

export enum MerchantWithdrawalStatus {
    PENDING = 0,      // 待审核
    APPROVED = 1,     // 已通过
    REJECTED = 2,     // 已拒绝
    COMPLETED = 3     // 已完成（已打款）
}

export enum MerchantWithdrawalType {
    BALANCE = 1,      // 本金/押金提现
    SILVER = 2        // 银锭提现
}

@Entity('merchant_withdrawals')
export class MerchantWithdrawal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    merchantId: string;  // 商家ID

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;  // 提现金额

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fee: number;  // 手续费

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    actualAmount: number;  // 实际到账金额

    @Column({ type: 'int', default: MerchantWithdrawalType.BALANCE })
    type: MerchantWithdrawalType;  // 提现类型

    @Column({ type: 'int', default: MerchantWithdrawalStatus.PENDING })
    @Index()
    status: MerchantWithdrawalStatus;

    @Column({ nullable: true })
    bankCardId?: string;  // 银行卡ID

    @Column({ length: 50 })
    bankName: string;  // 银行名称

    @Column({ length: 50 })
    accountName: string;  // 开户人

    @Column({ length: 30 })
    cardNumber: string;  // 银行卡号

    @Column({ length: 20, nullable: true })
    phone?: string;  // 手机号

    @Column({ type: 'text', nullable: true })
    remark?: string;  // 备注/拒绝原因

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;  // 审核时间

    @Column({ nullable: true })
    reviewedBy?: string;  // 审核人

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateMerchantWithdrawalDto {
    @IsNumber()
    @Min(100)
    amount: number;

    @IsEnum(MerchantWithdrawalType)
    @IsOptional()
    type?: MerchantWithdrawalType;

    @IsString()
    @IsNotEmpty()
    bankCardId: string;
}

export class ReviewMerchantWithdrawalDto {
    @IsEnum(MerchantWithdrawalStatus)
    status: MerchantWithdrawalStatus;

    @IsString()
    @IsOptional()
    remark?: string;
}
