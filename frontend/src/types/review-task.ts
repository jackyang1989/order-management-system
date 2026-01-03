/**
 * 评价任务类型定义
 */

export enum ReviewTaskStatus {
    PENDING = 0,      // 待审核
    APPROVED = 1,     // 已通过
    REJECTED = 2,     // 已拒绝
    IN_PROGRESS = 3,  // 进行中
    COMPLETED = 4,    // 已完成
    CANCELLED = 5     // 已取消
}

export interface ReviewTask {
    id: string;
    merchantId: string;
    title: string;
    description?: string;
    goodsUrl: string;
    goodsImage?: string;
    goodsPrice: number;
    commission: number;
    totalCount: number;
    completedCount: number;
    status: ReviewTaskStatus;
    keywords?: string[];
    requirements?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateReviewTaskRequest {
    title: string;
    description?: string;
    goodsUrl: string;
    goodsImage?: string;
    goodsPrice: number;
    commission: number;
    totalCount: number;
    keywords?: string[];
    requirements?: string;
    expiresAt?: string;
}

export interface ReviewTaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
}

// 状态标签映射
export const ReviewTaskStatusLabels: Record<ReviewTaskStatus, string> = {
    [ReviewTaskStatus.PENDING]: '待审核',
    [ReviewTaskStatus.APPROVED]: '已通过',
    [ReviewTaskStatus.REJECTED]: '已拒绝',
    [ReviewTaskStatus.IN_PROGRESS]: '进行中',
    [ReviewTaskStatus.COMPLETED]: '已完成',
    [ReviewTaskStatus.CANCELLED]: '已取消'
};

// 状态颜色映射
export const ReviewTaskStatusColors: Record<ReviewTaskStatus, string> = {
    [ReviewTaskStatus.PENDING]: '#faad14',
    [ReviewTaskStatus.APPROVED]: '#52c41a',
    [ReviewTaskStatus.REJECTED]: '#ff4d4f',
    [ReviewTaskStatus.IN_PROGRESS]: '#1890ff',
    [ReviewTaskStatus.COMPLETED]: '#52c41a',
    [ReviewTaskStatus.CANCELLED]: '#999'
};
