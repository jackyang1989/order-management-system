import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum BankCardStatus {
    PENDING = 0,      // 待审核
    APPROVED = 1,     // 已通过
    REJECTED = 2,     // 已拒绝
    DELETED = 3       // 已删除
}

@Entity('bank_cards')
export class BankCard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;  // 所属用户

    @Column({ length: 50 })
    bankName: string;  // 银行名称

    @Column({ length: 50 })
    accountName: string;  // 开户人姓名

    @Column({ length: 30 })
    @Index()
    cardNumber: string;  // 银行卡号

    @Column({ length: 20, nullable: true })
    phone?: string;  // 预留手机号

    @Column({ length: 50, nullable: true })
    province?: string;  // 开户省份

    @Column({ length: 50, nullable: true })
    city?: string;  // 开户城市

    @Column({ length: 100, nullable: true })
    branchName?: string;  // 开户支行

    @Column({ length: 20, nullable: true })
    idCard?: string;  // 身份证号

    @Column({ type: 'text', nullable: true })
    idCardFrontImage?: string;  // 身份证正面照

    @Column({ type: 'text', nullable: true })
    idCardBackImage?: string;  // 身份证反面照

    @Column({ default: false })
    isDefault: boolean;  // 是否默认卡

    @Column({ type: 'int', default: BankCardStatus.PENDING })
    status: BankCardStatus;

    @Column({ type: 'text', nullable: true })
    rejectReason?: string;  // 拒绝原因

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateBankCardDto {
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsString()
    @IsNotEmpty()
    accountName: string;

    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    branchName?: string;

    @IsString()
    @IsOptional()
    idCard?: string;

    @IsString()
    @IsOptional()
    idCardFrontImage?: string;  // 身份证正面照 (base64或URL)

    @IsString()
    @IsOptional()
    idCardBackImage?: string;   // 身份证反面照 (base64或URL)
}

export class UpdateBankCardDto {
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    province?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    branchName?: string;
}
