import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TaskStatus {
    ACTIVE = 'ACTIVE',      // 可领取
    COMPLETED = 'COMPLETED', // 已完成
    CANCELLED = 'CANCELLED'  // 已取消
}

export enum TaskType {
    TAOBAO = '淘宝',
    JD = '京东',
    PDD = '拼多多'
}

export interface TaskStep {
    step: number;
    title: string;
    description: string;
    requireScreenshot: boolean;
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Index()
    taskNumber: string;   // 任务编号

    @Column()
    title: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 20 })
    platform: TaskType;

    @Column()
    productName: string;

    @Column({ nullable: true })
    productImage?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    productPrice: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    commission: number;

    @Column({ type: 'text', nullable: true })
    requirements: string;

    @Column({ type: 'jsonb', default: '[]' })
    steps: TaskStep[];

    @Column({ default: 1 })
    totalCount: number;   // 总需人数

    @Column({ default: 0 })
    claimedCount: number; // 已领取人数

    @Column({ type: 'varchar', length: 20, default: TaskStatus.ACTIVE })
    status: TaskStatus;

    @Column({ nullable: true })
    sellerPhone: string;  // 商家手机号

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}


export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskType)
    platform: TaskType;

    @IsString()
    @IsNotEmpty()
    productName: string;

    @IsString()
    @IsOptional()
    productImage?: string;

    @IsNumber()
    productPrice: number;

    @IsNumber()
    commission: number;

    @IsString()
    requirements: string;

    @IsArray()
    steps: TaskStep[];

    @IsNumber()
    totalCount: number;
}

export class ClaimTaskDto {
    @IsString()
    @IsNotEmpty()
    taskId: string;

    @IsString()
    @IsNotEmpty()
    buynoId: string;
}

export class TaskFilterDto {
    @IsEnum(TaskType)
    @IsOptional()
    platform?: TaskType;

    @IsString()
    @IsOptional()
    search?: string;

    @IsNumber()
    @IsOptional()
    minCommission?: number;

    @IsNumber()
    @IsOptional()
    maxCommission?: number;
}
