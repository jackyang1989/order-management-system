// 订单 Mock 数据 (用户接的任务)
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
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'RECEIVED' | 'REFUNDED' | 'COMPLETED' | 'CANCELLED';
    statusLabel: string;
    taskStep: number;
    createdAt: string;
    endingTime: string;
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
