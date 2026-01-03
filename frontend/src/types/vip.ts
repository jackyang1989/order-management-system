/**
 * VIP类型定义
 */

export interface VipPackage {
    id: string;
    name: string;
    days: number;
    price: number;
    discountPrice: number;
    description?: string;
    benefits?: string[];
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
}

export interface VipPurchase {
    id: string;
    userId: string;
    packageId: string;
    packageName: string;
    days: number;
    amount: number;
    status: VipPurchaseStatus;
    paymentMethod?: string;
    transactionId?: string;
    paidAt?: string;
    vipStartAt: string;
    vipEndAt: string;
    createdAt: string;
}

export type VipPurchaseStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface VipStatus {
    isVip: boolean;
    expireAt: string | null;
    daysRemaining: number;
}

export interface VipLevel {
    id: string;
    name: string;
    level: number;
    type: 'buyer' | 'merchant';
    price: number;
    duration: number;
    icon?: string;
    color?: string;
    dailyTaskLimit: number;
    commissionBonus: number;
    withdrawFeeDiscount: number;
    priorityLevel: number;
    canReserveTask: boolean;
    showVipBadge: boolean;
    publishTaskLimit: number;
    serviceFeeDiscount: number;
    priorityReview: boolean;
    dedicatedSupport: boolean;
    freePromotionDays: number;
    description?: string;
    privileges?: string[];
    isActive: boolean;
    sortOrder: number;
}

export interface PurchaseVipRequest {
    packageId: string;
    paymentMethod?: 'silver' | 'balance' | 'alipay';
}

// VIP购买状态标签
export const VipPurchaseStatusLabels: Record<VipPurchaseStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
};

// 支付方式标签
export const PaymentMethodLabels: Record<string, string> = {
    silver: '银锭支付',
    balance: '本金支付',
    alipay: '支付宝支付'
};
