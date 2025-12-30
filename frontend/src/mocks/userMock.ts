// Mock 用户数据
export interface MockUser {
    id: string;
    phone: string;
    username: string;
    password: string; // MD5 hashed in real system
    vip: boolean;
    vipExpireAt?: string | Date;
    reward: number; // 累计奖励
    creditScore: number;
    balance?: number; // 余额
    silver?: number; // 银锭
    frozenSilver?: number; // 冻结银锭
    invitationCode?: string;
    invitedBy?: string;
}

export const mockUsers: MockUser[] = [
    {
        id: '1',
        phone: '13800138000',
        username: '测试用户',
        password: '123456',
        vip: true,
        vipExpireAt: '2025-12-31T23:59:59Z',
        reward: 50,
        creditScore: 100
    },
    {
        id: '2',
        phone: '13900139000',
        username: '商家用户',
        password: '123456',
        vip: true,
        vipExpireAt: '2025-06-30T23:59:59Z',
        reward: 200,
        creditScore: 100
    }
];

export interface MockBuyerAccount {
    id: string;
    userId: string;
    platform: '淘宝' | '京东' | '拼多多';
    accountName: string; // 淘宝账号/旺旺ID
    province?: string;
    city?: string;
    district?: string;
    receiverName?: string; // 收货人
    receiverPhone?: string; // 收货人手机
    fullAddress?: string; // 完整地址
    alipayName?: string; // 支付宝认证姓名
    star?: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | number;
    rejectReason?: string;
    createdAt?: string;
}

export const mockBuyerAccounts: MockBuyerAccount[] = [
    {
        id: 'ba1',
        userId: '1',
        platform: '淘宝',
        accountName: 'tb_buyer_001',
        receiverName: '张三',
        status: 'APPROVED',
        star: 3
    },
    {
        id: 'ba2',
        userId: '1',
        platform: '淘宝',
        accountName: 'tb_buyer_002',
        receiverName: '李四',
        status: 'PENDING',
        star: 2
    }
];
