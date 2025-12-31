import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum MerchantBankCardStatus {
    PENDING = 0,    // 待审核
    APPROVED = 1,   // 已通过
    REJECTED = 2,   // 已拒绝
    DELETED = 3     // 已删除
}

export enum MerchantBankCardType {
    PERSONAL = 1,   // 个人账户
    COMPANY = 2     // 企业对公账户
}

@Entity('merchant_bank_cards')
export class MerchantBankCard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    merchantId: string;  // 所属商家

    @Column({ length: 50 })
    bankName: string;  // 银行名称

    @Column({ length: 50 })
    accountName: string;  // 开户人姓名/公司名称

    @Column({ length: 30 })
    @Index()
    cardNumber: string;  // 银行卡号/对公账号

    @Column({ type: 'int', default: MerchantBankCardType.PERSONAL })
    cardType: MerchantBankCardType;

    @Column({ length: 20, nullable: true })
    phone?: string;  // 预留手机号

    @Column({ length: 50, nullable: true })
    province?: string;  // 开户省份

    @Column({ length: 50, nullable: true })
    city?: string;  // 开户城市

    @Column({ length: 100, nullable: true })
    branchName?: string;  // 开户支行

    @Column({ length: 20, nullable: true })
    idCard?: string;  // 身份证号（个人）

    @Column({ length: 50, nullable: true })
    taxNumber?: string;  // 税号（企业）

    @Column({ type: 'text', nullable: true })
    licenseImage?: string;  // 营业执照截图（企业）

    @Column({ type: 'text', nullable: true })
    idCardFrontImage?: string;  // 身份证正面照

    @Column({ type: 'text', nullable: true })
    idCardBackImage?: string;  // 身份证反面照

    @Column({ default: false })
    isDefault: boolean;  // 是否默认卡

    @Column({ type: 'int', default: MerchantBankCardStatus.PENDING })
    status: MerchantBankCardStatus;

    @Column({ type: 'text', nullable: true })
    rejectReason?: string;  // 拒绝原因

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateMerchantBankCardDto {
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsString()
    @IsNotEmpty()
    accountName: string;

    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @IsEnum(MerchantBankCardType)
    @IsOptional()
    cardType?: MerchantBankCardType;

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
    taxNumber?: string;
}

export class UpdateMerchantBankCardDto {
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
