import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReviewTaskStatus {
    PENDING = 1,        // 待处理（等待买手追评）
    SUBMITTED = 2,      // 待审核（买手已提交追评）
    WAITING_REFUND = 3, // 待返款（审核通过）
    COMPLETED = 4,      // 已完成
    CANCELLED = 5,      // 已取消（被商家取消）
    BUYER_REJECTED = 6, // 买手已拒绝
}

// 追评类型
export enum ReviewType {
    TEXT = 1,       // 文字追评
    IMAGE = 2,      // 图片追评
    VIDEO = 3,      // 视频追评
}

@Entity('review_tasks')
export class ReviewTask {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    reviewNo: string; // 追评任务编号

    @Column()
    @Index()
    orderId: string;        // 关联原订单

    @Column()
    @Index()
    taskId: string;         // 关联原任务

    @Column()
    @Index()
    merchantId: string;     // 商家ID

    @Column()
    @Index()
    userId: string;         // 买手ID

    @Column({ nullable: true })
    buynoId: string;        // 买号ID

    @Column({ nullable: true })
    buynoAccount: string;   // 买号

    @Column({ type: 'int', default: ReviewType.TEXT })
    reviewType: ReviewType; // 追评类型

    @Column({ type: 'text', nullable: true })
    content: string;        // 追评内容要求

    @Column({ type: 'jsonb', nullable: true })
    images: string[];       // 追评图片要求

    @Column({ type: 'text', nullable: true })
    video: string;          // 追评视频要求

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    commission: number;     // 追评佣金

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deposit: number;        // 押金

    @Column({ type: 'int', default: ReviewTaskStatus.PENDING })
    status: ReviewTaskStatus;

    @Column({ type: 'timestamp', nullable: true })
    deadline: Date;         // 追评截止时间

    // 买手提交的追评凭证
    @Column({ type: 'text', nullable: true })
    submittedContent: string;

    @Column({ type: 'jsonb', nullable: true })
    submittedImages: string[];

    @Column({ type: 'text', nullable: true })
    submittedVideo: string;

    @Column({ type: 'text', nullable: true })
    submittedScreenshot: string; // 追评截图凭证

    @Column({ type: 'timestamp', nullable: true })
    submittedAt: Date;

    // 审核相关
    @Column({ type: 'text', nullable: true })
    rejectReason: string;   // 拒绝原因

    @Column({ nullable: true })
    reviewerId: string;     // 审核人ID

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt: Date;       // 审核时间

    // 返款相关
    @Column({ type: 'timestamp', nullable: true })
    refundTime: Date;       // 返款时间

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    refundAmount: number;   // 实际返款金额

    // 通知状态
    @Column({ default: false })
    notified: boolean;      // 是否已通知买手

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// 追评内容详情表（多商品场景）
@Entity('review_task_details')
export class ReviewTaskDetail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    reviewTaskId: string;   // 关联追评任务

    @Column({ nullable: true })
    goodsId: string;        // 商品ID

    @Column({ nullable: true })
    goodsName: string;      // 商品名称

    @Column({ type: 'int', default: ReviewType.TEXT })
    reviewType: ReviewType;

    @Column({ type: 'text', nullable: true })
    requiredContent: string; // 要求的追评内容

    @Column({ type: 'jsonb', nullable: true })
    requiredImages: string[];

    @Column({ type: 'text', nullable: true })
    submittedContent: string; // 提交的追评内容

    @Column({ type: 'jsonb', nullable: true })
    submittedImages: string[];

    @Column({ default: false })
    isCompleted: boolean;

    @CreateDateColumn()
    createdAt: Date;
}

// DTOs
export class CreateReviewTaskDto {
    orderId: string;
    content?: string;
    images?: string[];
    commission: number;
    deposit?: number;
    deadline?: string;      // ISO date string
}

export class SubmitReviewDto {
    content: string;
    images?: string[];
}
