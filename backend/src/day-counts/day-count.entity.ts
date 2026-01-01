import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsNumber, IsOptional, IsDateString } from 'class-validator';

// 用户类型
export enum DayCountUserType {
    BUYER = 1,        // 买手
    MERCHANT = 2,     // 商家
}

// 每日任务统计
@Entity('user_day_counts')
@Index(['userId', 'date'], { unique: true })
export class UserDayCount {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    userId: string;  // 用户ID

    @Column({ type: 'int' })
    userType: DayCountUserType;  // 用户类型

    @Column({ type: 'date' })
    @Index()
    date: string;  // 日期 YYYY-MM-DD

    @Column({ default: 0 })
    taskCount: number;  // 任务数（买手接单/商家发布）

    @Column({ default: 0 })
    completedCount: number;  // 完成数

    @Column({ default: 0 })
    cancelledCount: number;  // 取消数

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount: number;  // 总金额

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    commissionEarned: number;  // 佣金收入（买手）

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    commissionPaid: number;  // 佣金支出（商家）

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    rechargeAmount: number;  // 充值金额

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    withdrawAmount: number;  // 提现金额

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// 平台每日统计
@Entity('platform_day_stats')
@Index(['date'], { unique: true })
export class PlatformDayStat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: string;  // 日期

    // 用户统计
    @Column({ default: 0 })
    newBuyers: number;  // 新增买手

    @Column({ default: 0 })
    newMerchants: number;  // 新增商家

    @Column({ default: 0 })
    activeBuyers: number;  // 活跃买手

    @Column({ default: 0 })
    activeMerchants: number;  // 活跃商家

    // 任务统计
    @Column({ default: 0 })
    newTasks: number;  // 新发布任务

    @Column({ default: 0 })
    completedTasks: number;  // 完成任务

    @Column({ default: 0 })
    cancelledTasks: number;  // 取消任务

    // 订单统计
    @Column({ default: 0 })
    newOrders: number;  // 新订单

    @Column({ default: 0 })
    completedOrders: number;  // 完成订单

    @Column({ default: 0 })
    refundOrders: number;  // 退款订单

    // 金额统计
    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalOrderAmount: number;  // 订单总金额

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    totalCommission: number;  // 佣金总额

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    platformRevenue: number;  // 平台收入

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    rechargeAmount: number;  // 充值金额

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    withdrawAmount: number;  // 提现金额

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class DayCountFilterDto {
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}

export class IncrementDayCountDto {
    @IsNumber()
    @IsOptional()
    taskCount?: number;

    @IsNumber()
    @IsOptional()
    completedCount?: number;

    @IsNumber()
    @IsOptional()
    cancelledCount?: number;

    @IsNumber()
    @IsOptional()
    totalAmount?: number;

    @IsNumber()
    @IsOptional()
    commissionEarned?: number;

    @IsNumber()
    @IsOptional()
    commissionPaid?: number;
}
