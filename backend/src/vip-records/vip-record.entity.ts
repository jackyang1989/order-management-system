import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsUUID, Min, Max } from 'class-validator';

// VIP等级
export enum VipLevel {
    NORMAL = 0,       // 普通用户
    VIP1 = 1,         // VIP1
    VIP2 = 2,         // VIP2
    VIP3 = 3,         // VIP3
    VIP4 = 4,         // VIP4
    VIP5 = 5,         // VIP5
}

// 用户类型
export enum VipUserType {
    BUYER = 1,        // 买手
    MERCHANT = 2,     // 商家
}

// 记录类型
export enum VipRecordType {
    UPGRADE = 1,      // 升级
    DOWNGRADE = 2,    // 降级
    RENEW = 3,        // 续费
    EXPIRE = 4,       // 过期
    ADMIN_SET = 5,    // 管理员设置
}

// VIP记录
@Entity('vip_records')
export class VipRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;  // 用户ID

    @Column({ type: 'int' })
    userType: VipUserType;  // 用户类型

    @Column({ type: 'int' })
    oldLevel: VipLevel;  // 原等级

    @Column({ type: 'int' })
    newLevel: VipLevel;  // 新等级

    @Column({ type: 'int' })
    recordType: VipRecordType;  // 记录类型

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount: number;  // 支付金额（升级/续费）

    @Column({ type: 'int', default: 0 })
    duration: number;  // 时长（天）

    @Column({ type: 'timestamp', nullable: true })
    expireAt: Date;  // 到期时间

    @Column({ nullable: true })
    operatorId: string;  // 操作人（管理员设置时）

    @Column({ type: 'text', nullable: true })
    remark: string;  // 备注

    @CreateDateColumn()
    createdAt: Date;
}

// VIP等级配置
@Entity('vip_level_configs')
export class VipLevelConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    userType: VipUserType;  // 用户类型

    @Column({ type: 'int' })
    level: VipLevel;  // VIP等级

    @Column({ length: 50 })
    name: string;  // 等级名称

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    monthlyPrice: number;  // 月费

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    yearlyPrice: number;  // 年费

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    commissionRate: number;  // 佣金加成比例（如 0.05 表示加5%）

    @Column({ type: 'int', default: 0 })
    maxDailyTasks: number;  // 每日最大任务数（0表示不限）

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    maxTaskPrice: number;  // 最大任务单价（0表示不限）

    @Column({ default: false })
    priorityMatching: boolean;  // 优先匹配

    @Column({ default: false })
    exclusiveTasks: boolean;  // 专属任务

    @Column({ type: 'text', nullable: true })
    privileges: string;  // 特权描述（JSON）

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    sort: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// 用户VIP状态
@Entity('user_vip_status')
export class UserVipStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    userId: string;  // 用户ID

    @Column({ type: 'int' })
    userType: VipUserType;  // 用户类型

    @Column({ type: 'int', default: VipLevel.NORMAL })
    level: VipLevel;  // 当前VIP等级

    @Column({ type: 'timestamp', nullable: true })
    expireAt: Date;  // 到期时间

    @Column({ default: false })
    isExpired: boolean;  // 是否已过期

    @Column({ type: 'int', default: 0 })
    totalDays: number;  // 累计VIP天数

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalSpent: number;  // 累计消费

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class PurchaseVipDto {
    @IsEnum(VipLevel)
    level: VipLevel;

    @IsNumber()
    @Min(1)
    @Max(12)
    months: number;  // 购买月数
}

export class AdminSetVipDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsEnum(VipUserType)
    userType: VipUserType;

    @IsEnum(VipLevel)
    level: VipLevel;

    @IsNumber()
    @Min(1)
    duration: number;  // 天数

    @IsString()
    @IsOptional()
    remark?: string;
}

export class VipLevelConfigDto {
    @IsEnum(VipLevel)
    level: VipLevel;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    monthlyPrice: number;

    @IsNumber()
    @Min(0)
    yearlyPrice: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    @IsOptional()
    commissionRate?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maxDailyTasks?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maxTaskPrice?: number;
}

export class VipRecordFilterDto {
    @IsEnum(VipRecordType)
    @IsOptional()
    recordType?: VipRecordType;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}
