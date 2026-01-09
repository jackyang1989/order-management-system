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
    platformAccount: string; // 平台账号
    province?: string;
    city?: string;
    district?: string;
    buyerName?: string; // 收货人
    buyerPhone?: string; // 收货人手机
    fullAddress?: string; // 完整地址
    realName?: string; // 实名认证姓名
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
        platformAccount: 'tb_buyer_001',
        buyerName: '张三',
        status: 'APPROVED',
        star: 3
    },
    {
        id: 'ba2',
        userId: '1',
        platform: '淘宝',
        platformAccount: 'tb_buyer_002',
        buyerName: '李四',
        status: 'PENDING',
        star: 2
    }
];
