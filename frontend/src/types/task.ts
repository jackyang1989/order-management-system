/**
 * 任务类型定义
 */

export enum TaskStatus {
    DRAFT = 0,        // 草稿
    PENDING = 1,      // 待审核
    APPROVED = 2,     // 已通过
    REJECTED = 3,     // 已拒绝
    ACTIVE = 4,       // 进行中
    PAUSED = 5,       // 已暂停
    COMPLETED = 6,    // 已完成
    CANCELLED = 7     // 已取消
}

export interface Task {
    id: string;
    merchantId: string;
    shopId?: string;
    title: string;
    description?: string;
    platform: string;
    taskType: number;
    goodsUrl: string;
    goodsImage?: string;
    goodsPrice: number;
    commission: number;
    serviceFee: number;
    totalCount: number;
    completedCount: number;
    receivedCount: number;
    status: TaskStatus;
    keywords?: string[];
    requirements?: string;
    startAt?: string;
    endAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface TaskData {
    id: string;
    title: string;
    platform: string;
    goodsUrl: string;
    goodsImage?: string;
    goodsPrice: number;
    commission: number;
    status: TaskStatus;
    keywords?: string[];
    requirements?: string;
}

export interface TaskStats {
    total: number;
    pending: number;
    active: number;
    completed: number;
    cancelled: number;
}

// 状态标签映射
export const TaskStatusLabels: Record<TaskStatus, string> = {
    [TaskStatus.DRAFT]: '草稿',
    [TaskStatus.PENDING]: '待审核',
    [TaskStatus.APPROVED]: '已通过',
    [TaskStatus.REJECTED]: '已拒绝',
    [TaskStatus.ACTIVE]: '进行中',
    [TaskStatus.PAUSED]: '已暂停',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.CANCELLED]: '已取消'
};

// 状态颜色映射
export const TaskStatusColors: Record<TaskStatus, string> = {
    [TaskStatus.DRAFT]: '#999',
    [TaskStatus.PENDING]: '#faad14',
    [TaskStatus.APPROVED]: '#52c41a',
    [TaskStatus.REJECTED]: '#ff4d4f',
    [TaskStatus.ACTIVE]: '#1890ff',
    [TaskStatus.PAUSED]: '#faad14',
    [TaskStatus.COMPLETED]: '#52c41a',
    [TaskStatus.CANCELLED]: '#999'
};

// 平台标签映射
export const PlatformLabels: Record<string, string> = {
    taobao: '淘宝',
    tmall: '天猫',
    jd: '京东',
    pdd: '拼多多',
    douyin: '抖音'
};
