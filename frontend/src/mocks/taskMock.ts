// 任务 Mock 数据
export interface MockTask {
    id: string;
    taskNumber: string;
    title?: string;
    description?: string;
    platform?: string;
    productName?: string;
    shopName?: string;
    taskType: string;
    taskTypeLabel?: string;
    goodsPrice?: number;      // 前端兼容字段
    productPrice?: number;    // 后端字段
    commission: number;
    userDivided?: number; // 加赏
    totalCount: number;
    remainCount?: number;
    claimCount?: number;      // 前端兼容字段
    claimedCount?: number;    // 后端字段
    terminal?: 'MOBILE' | 'PC';
    sellerPhone: string;
    createdAt?: string | Date;
    status: string;
}

export const mockTasks: MockTask[] = [
    {
        id: 't1',
        taskNumber: 'TASK-20231201-001',
        shopName: '天猫旗舰店',
        taskType: 'KEYWORD',
        taskTypeLabel: '关键词',
        goodsPrice: 128.00,
        commission: 5.00,
        userDivided: 2.00,
        totalCount: 20,
        remainCount: 15,
        claimCount: 5,
        terminal: 'MOBILE',
        sellerPhone: '138****8000',
        createdAt: '2023-12-01T10:00:00Z',
        status: 'ACTIVE'
    },
    {
        id: 't2',
        taskNumber: 'TASK-20231201-002',
        shopName: '淘宝精品店',
        taskType: 'TAOKOULING',
        taskTypeLabel: '淘口令',
        goodsPrice: 299.00,
        commission: 8.00,
        userDivided: 3.00,
        totalCount: 10,
        remainCount: 3,
        claimCount: 7,
        terminal: 'MOBILE',
        sellerPhone: '139****9000',
        createdAt: '2023-12-01T11:00:00Z',
        status: 'ACTIVE'
    },
    {
        id: 't3',
        taskNumber: 'TASK-20231202-001',
        shopName: '飞猪旅行店',
        taskType: 'QR_CODE',
        taskTypeLabel: '二维码',
        goodsPrice: 588.00,
        commission: 15.00,
        userDivided: 5.00,
        totalCount: 5,
        remainCount: 5,
        claimCount: 0,
        terminal: 'PC',
        sellerPhone: '137****7000',
        createdAt: '2023-12-02T09:00:00Z',
        status: 'ACTIVE'
    },
    {
        id: 't4',
        taskNumber: 'TASK-20231202-002',
        shopName: '数码专营店',
        taskType: 'ZHITONGCHE',
        taskTypeLabel: '直通车',
        goodsPrice: 1299.00,
        commission: 25.00,
        userDivided: 10.00,
        totalCount: 8,
        remainCount: 2,
        claimCount: 6,
        terminal: 'MOBILE',
        sellerPhone: '136****6000',
        createdAt: '2023-12-02T14:00:00Z',
        status: 'ACTIVE'
    }
];
