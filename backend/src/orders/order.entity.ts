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
