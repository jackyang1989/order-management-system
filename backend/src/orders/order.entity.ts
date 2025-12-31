import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum OrderStatus {
    PENDING = 'PENDING',       // 进行中
    SUBMITTED = 'SUBMITTED',   // 待审核
    APPROVED = 'APPROVED',     // 审核通过
    REJECTED = 'REJECTED',     // 审核拒绝
    COMPLETED = 'COMPLETED',   // 已完成
    CANCELLED = 'CANCELLED'    // 已取消
}

export interface OrderStepData {
    step: number;
    title: string;
    description: string;
    submitted: boolean;
    submittedAt?: Date;
    screenshot?: string;
    inputData?: Record<string, any>;
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    taskId: string;

    @Column()
    @Index()
    userId: string;

    @Column()
    buynoId: string;

    @Column()
    buynoAccount: string;

    @Column()
    taskTitle: string;

    @Column({ length: 20 })
    platform: string;

    @Column()
    productName: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    productPrice: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    commission: number;

    // ============ 资金相关字段 ============
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    userPrincipal: number; // 买手垫付本金

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    sellerPrincipal: number; // 商家返款本金

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    prepayAmount: number; // 预付金额（是否垫付场景）

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    finalAmount: number; // 尾款金额

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    refundAmount: number; // 实际返款金额

    @Column({ default: false })
    isAdvancePay: boolean; // 是否垫付任务

    // ============ 发货相关字段 ============
    @Column({ type: 'int', default: 0 })
    deliveryState: number; // 发货状态 0未发货 1已发货 2已签收

    @Column({ nullable: true })
    delivery: string; // 快递公司

    @Column({ nullable: true })
    deliveryNum: string; // 快递单号

    @Column({ nullable: true })
    deliveryTime: Date; // 发货时间

    @Column({ nullable: true })
    taobaoOrderNumber: string; // 淘宝订单号

    // ============ 收货地址 ============
    @Column({ nullable: true })
    addressName: string; // 收货人

    @Column({ nullable: true })
    addressPhone: string; // 收货电话

    @Column({ type: 'text', nullable: true })
    address: string; // 收货地址

    // ============ 审核相关 ============
    @Column({ type: 'text', nullable: true })
    remark: string; // 备注

    @Column({ type: 'text', nullable: true })
    rejectReason: string; // 驳回原因

    @Column({ nullable: true })
    refundTime: Date; // 返款时间

    @Column({ default: 1 })
    currentStep: number;

    @Column()
    totalSteps: number;

    @Column({ type: 'jsonb', default: '[]' })
    stepData: OrderStepData[];

    @Column({ type: 'varchar', length: 20, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Column({ type: 'timestamp', nullable: true })
    endingTime?: Date;  // 订单超时时间

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;
}


export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    taskId: string;

    @IsString()
    @IsNotEmpty()
    buynoId: string;

    @IsString()
    @IsNotEmpty()
    buynoAccount: string;
}

export class SubmitStepDto {
    @IsNumber()
    step: number;

    @IsString()
    @IsOptional()
    screenshot?: string;

    @IsOptional()
    inputData?: Record<string, any>;
}

export class OrderFilterDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsString()
    @IsOptional()
    platform?: string;
}
