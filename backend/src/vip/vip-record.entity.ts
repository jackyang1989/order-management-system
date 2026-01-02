import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 用户类型枚举
 */
export enum VipUserType {
    MERCHANT = 1,   // 商家
    BUYER = 2,      // 买手
}

/**
 * VIP充值记录表 (对应原版 tfkz_vip_record)
 * 记录所有VIP开通/续费历史
 */
@Entity('vip_records')
export class VipRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    uid: string;                // 用户ID (买手ID或商家ID)

    @Column({ type: 'int' })
    utype: VipUserType;         // 用户类型: 1=商家, 2=买手

    @Column({ length: 100, nullable: true })
    userName: string;           // 用户名 (冗余存储)

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    price: number;              // 支付金额

    @Column({ type: 'text', nullable: true })
    remarks: string;            // 备注说明

    @Column({ type: 'int', nullable: true })
    expireTime: number;         // VIP到期时间戳

    @Column({ type: 'int', default: 0 })
    days: number;               // VIP时长(天)

    @Column({ type: 'int', default: 0 })
    payType: number;            // 支付方式: 1=支付宝, 2=押金, 3=银锭

    @Column({ nullable: true })
    payOrderNo: string;         // 支付订单号

    @CreateDateColumn()
    createdAt: Date;
}

// ============ DTOs ============

/**
 * 创建VIP记录DTO
 */
export class CreateVipRecordDto {
    @IsString()
    uid: string;

    @IsNumber()
    utype: VipUserType;

    @IsOptional()
    @IsString()
    userName?: string;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsOptional()
    @IsNumber()
    expireTime?: number;

    @IsOptional()
    @IsNumber()
    days?: number;

    @IsOptional()
    @IsNumber()
    payType?: number;

    @IsOptional()
    @IsString()
    payOrderNo?: string;
}

/**
 * VIP开通请求DTO (用于用户自助开通)
 */
export class VipOpenDto {
    @IsNumber()
    vipLevel: number;           // VIP档位: 1, 2, 3 (对应3月, 6月, 9月)

    @IsNumber()
    payType: number;            // 支付方式: 1=支付宝, 2=押金, 3=银锭
}

/**
 * 管理员设置VIP DTO
 */
export class AdminSetVipDto {
    @IsString()
    userId: string;

    @IsNumber()
    userType: VipUserType;      // 1=商家, 2=买手

    @IsNumber()
    days: number;               // VIP天数

    @IsOptional()
    @IsString()
    remarks?: string;
}

/**
 * VIP记录查询DTO
 */
export class VipRecordFilterDto {
    @IsOptional()
    @IsString()
    uid?: string;

    @IsOptional()
    @IsNumber()
    utype?: VipUserType;

    @IsOptional()
    @IsNumber()
    payType?: number;

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
