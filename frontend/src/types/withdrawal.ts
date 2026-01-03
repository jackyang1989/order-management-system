/**
 * 提现类型定义
 * 统一买手和商家的提现接口
 */

export type WithdrawalOwnerType = 'buyer' | 'merchant';

export type WithdrawalStatus = 0 | 1 | 2 | 3; // PENDING | APPROVED | REJECTED | COMPLETED

export type WithdrawalType = 1 | 2; // BALANCE | SILVER

export interface Withdrawal {
    id: string;
    ownerType: WithdrawalOwnerType;
    ownerId: string;
    amount: number;
    fee: number;
    actualAmount: number;
    type: WithdrawalType;
    status: WithdrawalStatus;
    bankCardId?: string;
    bankName: string;
    accountName: string;
    cardNumber: string;
    phone?: string;
    remark?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateWithdrawalRequest {
    amount: number;
    type?: WithdrawalType;
    bankCardId: string;
    payPassword?: string;
}

export interface ReviewWithdrawalRequest {
    status: WithdrawalStatus;
    remark?: string;
}

// 状态标签映射
export const WithdrawalStatusLabels: Record<WithdrawalStatus, string> = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝',
    3: '已完成'
};

// 类型标签映射
export const WithdrawalTypeLabels: Record<WithdrawalType, string> = {
    1: '本金提现',
    2: '银锭提现'
};

// 状态颜色映射
export const WithdrawalStatusColors: Record<WithdrawalStatus, string> = {
    0: '#faad14', // 橙色 - 待审核
    1: '#52c41a', // 绿色 - 已通过
    2: '#ff4d4f', // 红色 - 已拒绝
    3: '#1890ff'  // 蓝色 - 已完成
};
