import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum TaskDraftStep {
    STEP1_BASIC = 1,      // 基础信息
    STEP2_ADVANCED = 2,   // 高级设置
    STEP3_PREVIEW = 3,    // 预览确认
    STEP4_PAYMENT = 4,    // 支付
}

@Entity('task_drafts')
export class TaskDraft {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    merchantId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'merchantId' })
    merchant: User;

    @Column({ type: 'enum', enum: TaskDraftStep, default: TaskDraftStep.STEP1_BASIC })
    currentStep: TaskDraftStep;

    // Step 1: 基础信息
    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    platform: string;

    @Column({ nullable: true })
    shopId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    goodsPrice: number;

    @Column({ nullable: true })
    goodsLink: string;

    @Column({ nullable: true })
    platformProductId: string;  // 从订单侠 API 解析出的平台商品ID

    @Column({ nullable: true })
    goodsImage: string;

    @Column({ type: 'int', nullable: true })
    totalCount: number;

    @Column({ type: 'int', nullable: true })
    terminal: number;

    @Column({ type: 'int', nullable: true })
    version: number;

    // Step 2: 高级设置
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    commission: number;

    @Column({ type: 'int', nullable: true })
    praiseType: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    praiseFee: number;

    @Column({ type: 'text', nullable: true })
    praiseContent: string;

    @Column({ type: 'text', nullable: true })
    praiseImages: string;

    @Column({ nullable: true })
    praiseVideo: string;

    @Column({ type: 'boolean', default: false })
    isPresale: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    presaleDeposit: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    finalPayment: number;

    @Column({ type: 'boolean', default: false })
    isTiming: boolean;

    @Column({ type: 'timestamp', nullable: true })
    timingPublishTime: Date;

    @Column({ type: 'int', nullable: true })
    taskTimeLimit: number;

    @Column({ type: 'int', nullable: true })
    unionInterval: number;

    @Column({ type: 'int', nullable: true })
    cycle: number;

    @Column({ type: 'boolean', default: false })
    isFreeShipping: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    postage: number;

    @Column({ type: 'text', nullable: true })
    deliveryRequirement: string;

    @Column({ type: 'text', nullable: true })
    keywords: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    addReward: number;

    @Column({ type: 'text', nullable: true })
    memo: string;

    // 费用计算结果（Step 3 预览时计算）
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    calculatedBaseFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    calculatedPraiseFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    calculatedTimingFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    calculatedMargin: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    calculatedTotalAmount: number;

    @Column({ type: 'boolean', default: false })
    isCompleted: boolean;

    @Column({ nullable: true })
    taskId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
