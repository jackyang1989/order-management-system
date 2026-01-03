/**
 * 订单类型定义
 */

export enum OrderStatus {
    PENDING = 0,      // 待付款
    PAID = 1,         // 已付款
    PROCESSING = 2,   // 处理中
    SHIPPED = 3,      // 已发货
    COMPLETED = 4,    // 已完成
    CANCELLED = 5,    // 已取消
    REFUNDED = 6      // 已退款
}

export interface Order {
    id: string;
    orderNo: string;
    userId?: string;
    merchantId?: string;
    taskId?: string;
    goodsName: string;
    goodsImage?: string;
    goodsPrice: number;
    quantity: number;
    totalAmount: number;
    commission: number;
    status: OrderStatus;
    buyerName?: string;
    buyerPhone?: string;
    shippingAddress?: string;
    trackingNo?: string;
    remark?: string;
    paidAt?: string;
    shippedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface OrderStats {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalAmount: number;
    totalCommission: number;
}

// 状态标签映射
export const OrderStatusLabels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: '待付款',
    [OrderStatus.PAID]: '已付款',
    [OrderStatus.PROCESSING]: '处理中',
    [OrderStatus.SHIPPED]: '已发货',
    [OrderStatus.COMPLETED]: '已完成',
    [OrderStatus.CANCELLED]: '已取消',
    [OrderStatus.REFUNDED]: '已退款'
};

// 状态颜色映射
export const OrderStatusColors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: '#faad14',
    [OrderStatus.PAID]: '#1890ff',
    [OrderStatus.PROCESSING]: '#1890ff',
    [OrderStatus.SHIPPED]: '#52c41a',
    [OrderStatus.COMPLETED]: '#52c41a',
    [OrderStatus.CANCELLED]: '#999',
    [OrderStatus.REFUNDED]: '#ff4d4f'
};
