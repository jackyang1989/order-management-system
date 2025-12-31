import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReviewTaskStatus {
    PENDING = 1,        // 待处理（等待买手追评）
    SUBMITTED = 2,      // 待审核（买手已提交追评）
    APPROVED = 3,       // 已通过（待返款）
    COMPLETED = 4,      // 已完成
    REJECTED = 5,       // 已拒绝（被买手拒绝）
    CANCELLED = 6       // 已取消（被商家取消）
}

@Entity('review_tasks')
export class ReviewTask {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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
    buynoAccount: string;   // 买号

    @Column({ type: 'text', nullable: true })
    content: string;        // 追评内容要求

    @Column({ type: 'simple-array', nullable: true })
    images: string[];       // 追评图片要求

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

    @Column({ type: 'simple-array', nullable: true })
    submittedImages: string[];

    @Column({ type: 'timestamp', nullable: true })
    submittedAt: Date;

    @Column({ type: 'text', nullable: true })
    rejectReason: string;   // 拒绝原因

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
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
