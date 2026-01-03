// 订单 Mock 数据 (用户接的任务)
// 任务状态 - 对应原版8个主状态 + 4个审核状态
export type OrderStatus =
    | 'PENDING'           // 进行中
    | 'PAID'              // 已付款
    | 'SHIPPED'           // 已发货
    | 'RECEIVED'          // 已签收
    | 'WAITING_RECEIVE'   // 待收货
    | 'WAITING_REVIEW_REFUND' // 待审核返款
    | 'REFUNDED'          // 已退款/已返款
    | 'COMPLETED'         // 已完成
    | 'CANCELLED'         // 已取消
    | 'SUBMITTED'         // 已提交
    | 'APPROVED'          // 已审核通过
    | 'REJECTED';         // 已驳回

export interface MockOrder {
    id: string;
    taskNumber: string;
    shopName: string;
    taskType: string;
    principal: number; // 本金
    commission: number;
    userDivided: number;
    buyerAccount: string; // 买号账号（支持多平台）
    keyword: string; // 搜索关键词
    goodsPrice: number; // 商品价格
    status: OrderStatus;
    statusLabel: string;
    taskStep: number;
    createdAt: string;
    endingTime: string;
    // 可选字段 - 详情页展示
    terminal?: string | number;  // 终端类型
    memo?: string;               // 备注
    updatedAt?: string;          // 更新时间
    deliveryTime?: string;       // 发货时间
    taobaoOrderNumber?: string;  // 淘宝订单号
    platformRefundTime?: string; // 平台返款时间
    productPrice?: number;       // 商品价格
    taobaoId?: string;           // 商品淘宝ID
}

export const mockOrders: MockOrder[] = [
    {
        id: 'o1',
        taskNumber: 'TASK-20231201-001-1234',
        shopName: '天猫旗舰店',
        taskType: '关键词',
        principal: 128.00,
        commission: 5.00,
        userDivided: 2.00,
        buyerAccount: 'tb_buyer_001',
        keyword: '男士休闲裤',
        goodsPrice: 128.00,
        status: 'PENDING',
        statusLabel: '已接手，待开始',
        taskStep: 1,
        createdAt: '2023-12-01T10:30:00Z',
        endingTime: '2023-12-01T11:30:00Z'
    },
    {
        id: 'o2',
        taskNumber: 'TASK-20231130-005-5678',
        shopName: '淘宝精品店',
        taskType: '淘口令',
        principal: 299.00,
        commission: 8.00,
        userDivided: 3.00,
        buyerAccount: 'tb_buyer_002',
        keyword: '行李箱',
        goodsPrice: 299.00,
        status: 'COMPLETED',
        statusLabel: '已完成',
        taskStep: 5,
        createdAt: '2023-11-30T14:00:00Z',
        endingTime: '2023-11-30T15:00:00Z'
    }
];
