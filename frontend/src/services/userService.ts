import { BASE_URL } from '../../apiConfig';
import { mockBuyerAccounts, MockBuyerAccount } from '../mocks/userMock';

const USE_MOCK = false;

// ========== 买号管理 ==========

// 获取当前用户的买号列表
export const fetchBuyerAccounts = async (): Promise<MockBuyerAccount[]> => {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...mockBuyerAccounts];
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/buyer-accounts`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch accounts');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch buyer accounts error:', error);
        return [];
    }
};

// 添加买号
export const addBuyerAccount = async (account: Omit<MockBuyerAccount, 'id' | 'userId' | 'status'>): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 600));
        const newAccount: MockBuyerAccount = {
            id: `ba_${Date.now()}`,
            userId: '1',
            status: 'PENDING',
            ...account
        };
        mockBuyerAccounts.push(newAccount);
        return { success: true, message: '提交成功，等待审核' };
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/buyer-accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(account)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '提交成功' : '提交失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 删除买号
export const deleteBuyerAccount = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '删除成功' : '删除失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// ========== 银行卡管理 ==========

export interface BankCard {
    id: string;
    bankName: string;
    accountName: string;
    cardNumber: string;
    phone?: string;
    province?: string;
    city?: string;
    branchName?: string;
    isDefault: boolean;
    status: number;
    createdAt: string;
}

// 获取银行卡列表
export const fetchBankCards = async (): Promise<BankCard[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bank-cards`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch bank cards');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch bank cards error:', error);
        return [];
    }
};

// 添加银行卡
export const addBankCard = async (card: {
    bankName: string;
    accountName: string;
    cardNumber: string;
    phone?: string;
    province?: string;
    city?: string;
    branchName?: string;
}): Promise<{ success: boolean; message: string; data?: BankCard }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bank-cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(card)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message, data: result.data };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 设为默认银行卡
export const setDefaultBankCard = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bank-cards/${id}/default`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: response.ok, message: result.message };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 删除银行卡
export const deleteBankCard = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bank-cards/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: response.ok, message: result.message };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// ========== 提现管理 ==========

export interface Withdrawal {
    id: string;
    amount: number;
    fee: number;
    actualAmount: number;
    type: number; // 1=本金 2=银锭
    status: number; // 0=待审核 1=已通过 2=已拒绝 3=已完成
    bankName: string;
    accountName: string;
    cardNumber: string;
    remark?: string;
    createdAt: string;
}

export interface WithdrawalStats {
    pending: number;
    completed: number;
    totalWithdrawn: number;
}

// 获取提现记录
export const fetchWithdrawals = async (): Promise<Withdrawal[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/withdrawals`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch withdrawals');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch withdrawals error:', error);
        return [];
    }
};

// 获取提现统计
export const fetchWithdrawalStats = async (): Promise<WithdrawalStats> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/withdrawals/stats`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const res = await response.json();
        return res.data || { pending: 0, completed: 0, totalWithdrawn: 0 };
    } catch (error) {
        console.error('Fetch withdrawal stats error:', error);
        return { pending: 0, completed: 0, totalWithdrawn: 0 };
    }
};

// 发起提现
export const createWithdrawal = async (data: {
    amount: number;
    type?: number;
    bankCardId: string;
}): Promise<{ success: boolean; message: string; data?: Withdrawal }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/withdrawals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message, data: result.data };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// ========== 邀请统计 ==========

export interface InviteStats {
    totalInvited: number;
    todayInvited: number;
    totalReward: number;
    todayReward: number;
}

export interface InviteRecord {
    id: string;
    username: string;
    registerTime: string;
    completedTasks: number;
    reward: number;
}

// 获取邀请统计
export const fetchInviteStats = async (): Promise<InviteStats> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/invite/stats`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch invite stats');
        const res = await response.json();
        return res.data || { totalInvited: 0, todayInvited: 0, totalReward: 0, todayReward: 0 };
    } catch (error) {
        console.error('Fetch invite stats error:', error);
        return { totalInvited: 0, todayInvited: 0, totalReward: 0, todayReward: 0 };
    }
};

// 获取邀请记录
export const fetchInviteRecords = async (): Promise<InviteRecord[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/invite/records`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch invite records');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch invite records error:', error);
        return [];
    }
};

// ========== 资金记录 ==========

export interface FundRecord {
    id: string;
    type: 'principal' | 'silver'; // 本金 或 银锭
    action: 'in' | 'out'; // 收入 或 支出
    amount: number;
    balance: number; // 变动后余额
    description: string;
    orderId?: string; // 关联订单ID
    createdAt: string;
}

export interface FundRecordQuery {
    type?: 'principal' | 'silver';
    action?: 'in' | 'out';
    page?: number;
    pageSize?: number;
}

// 获取资金记录
export const fetchFundRecords = async (query?: FundRecordQuery): Promise<{ list: FundRecord[]; total: number }> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (query?.type) params.append('type', query.type);
        if (query?.action) params.append('action', query.action);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.pageSize) params.append('pageSize', query.pageSize.toString());

        const response = await fetch(`${BASE_URL}/user/fund-records?${params.toString()}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch fund records');
        const res = await response.json();
        return { list: res.data?.list || [], total: res.data?.total || 0 };
    } catch (error) {
        console.error('Fetch fund records error:', error);
        return { list: [], total: 0 };
    }
};

// ========== 用户资料 ==========

export interface UserProfile {
    id: string;
    username: string;
    phone: string;
    qq?: string;            // QQ号码
    realName?: string;      // 实名
    balance: number;        // 本金余额
    frozenBalance: number;  // 冻结本金
    silver: number;         // 银锭
    frozenSilver: number;   // 冻结银锭
    vip: boolean;
    vipExpireAt?: string;
    totalEarned: number;    // 累计赚取
    pendingReward: number;  // 待发放
    experience: number;     // 经验值
    createdAt: string;
}

// 获取用户资料
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/profile`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const res = await response.json();
        return res.data || null;
    } catch (error) {
        console.error('Fetch user profile error:', error);
        return null;
    }
};
