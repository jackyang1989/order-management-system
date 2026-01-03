import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

// ========== VIP 套餐 ==========

@Entity('vip_packages')
export class VipPackage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;  // 套餐名称

    @Column({ type: 'int' })
    days: number;  // 有效天数

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;  // 原价

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    discountPrice: number;  // 优惠价

    @Column({ type: 'text', nullable: true })
    description: string;  // 描述

    @Column({ type: 'simple-array', nullable: true })
    benefits: string[];  // 权益列表

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;
}

// ========== VIP 购买记录 ==========

export enum VipPurchaseStatus {
    PENDING = 'pending',       // 待支付
    PAID = 'paid',             // 已支付
    CANCELLED = 'cancelled',   // 已取消
    REFUNDED = 'refunded'      // 已退款
}

@Entity('vip_purchases')
export class VipPurchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    packageId: string;

    @ManyToOne(() => VipPackage)
    @JoinColumn({ name: 'packageId' })
    package: VipPackage;

    @Column()
    packageName: string;

    @Column({ type: 'int' })
    days: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: VipPurchaseStatus,
        default: VipPurchaseStatus.PENDING
    })
    @Index()
    status: VipPurchaseStatus;

    @Column({ nullable: true })
    paymentMethod: string;  // 支付方式

    @Column({ nullable: true })
    transactionId: string;  // 支付流水号

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;

    @Column({ type: 'timestamp' })
    vipStartAt: Date;  // VIP开始时间

    @Column({ type: 'timestamp' })
    vipEndAt: Date;    // VIP结束时间

    @CreateDateColumn()
    createdAt: Date;
}

// ========== DTOs ==========

export class CreateVipPackageDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    days: number;

    @IsNumber()
    price: number;

    @IsNumber()
    discountPrice: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    benefits?: string[];

    @IsNumber()
    @IsOptional()
    sortOrder?: number;
}

export class PurchaseVipDto {
    @IsString()
    @IsNotEmpty()
    packageId: string;

    @IsString()
    @IsOptional()
    paymentMethod?: 'silver' | 'balance' | 'alipay';  // 支付方式: 银锭/本金/支付宝
}

// ========== 支付宝订单 ==========

export enum RechargeOrderStatus {
    PENDING = 0,     // 待支付
    PAID = 1,        // 已支付
    CANCELLED = 2,   // 已取消
    EXPIRED = 3      // 已过期
}

@Entity('recharge_orders')
export class RechargeOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    orderNo: string;  // 订单号

    @Column()
    @Index()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'int', default: 2 })
    userType: number;  // 1=商家, 2=买手

    @Column()
    packageId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'int', default: 0 })
    state: RechargeOrderStatus;

    @Column({ nullable: true })
    payUrl: string;  // 支付链接

    @Column({ type: 'bigint' })
    createTime: number;  // 创建时间戳

    @Column({ type: 'bigint', nullable: true })
    paidTime: number;  // 支付时间戳

    @CreateDateColumn()
    createdAt: Date;
}
