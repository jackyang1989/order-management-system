import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum BankCardStatus {
    PENDING = 0,      // 待审核
    APPROVED = 1,     // 已通过
    REJECTED = 2,     // 已拒绝
    DELETED = 3       // 已删除
}

export enum BankCardOwnerType {
    BUYER = 'buyer',       // 买手
    MERCHANT = 'merchant'  // 商家
}

export enum BankCardType {
    PERSONAL = 1,   // 个人账户
    COMPANY = 2     // 企业对公账户
}

@Entity('bank_cards')
export class BankCard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 20, default: BankCardOwnerType.BUYER })
    @Index()
    ownerType: BankCardOwnerType;  // 所有者类型：买手或商家

    @Column()
    @Index()
    ownerId: string;  // 所有者ID（买手ID或商家ID）

    // 保留 userId 字段用于向后兼容（买手银行卡）
    @Column({ nullable: true })
    @Index()
    userId?: string;  // 用户ID（兼容旧数据，新数据使用ownerId）

    @Column({ length: 50 })
    bankName: string;  // 银行名称

    @Column({ length: 50 })
    accountName: string;  // 开户人姓名

    @Column({ length: 30 })
    @Index()
    cardNumber: string;  // 银行卡号

    @Column({ type: 'int', default: BankCardType.PERSONAL, nullable: true })
    cardType?: BankCardType;  // 卡类型（商家可选：个人/企业）

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

    // 商家特有字段
    @Column({ length: 50, nullable: true })
    taxNumber?: string;  // 税号（企业）

    @Column({ type: 'text', nullable: true })
    licenseImage?: string;  // 营业执照截图（企业）

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

    @IsEnum(BankCardType)
    @IsOptional()
    cardType?: BankCardType;

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

    // 商家特有字段
    @IsString()
    @IsOptional()
    taxNumber?: string;  // 税号（企业）

    @IsString()
    @IsOptional()
    licenseImage?: string;  // 营业执照截图（企业）

    @IsEnum(BankCardOwnerType)
    @IsOptional()
    ownerType?: BankCardOwnerType;  // 所有者类型（用于统一接口）
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

    @IsString()
    @IsOptional()
    taxNumber?: string;

    @IsString()
    @IsOptional()
    licenseImage?: string;
}
