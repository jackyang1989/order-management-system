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
    wechatQrCode?: string;
    alipayQrCode?: string;
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
    wechatQrCode?: string;
    alipayQrCode?: string;
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
export const fetchWithdrawals = async (startDate?: string, endDate?: string): Promise<Withdrawal[]> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`${BASE_URL}/withdrawals/my?${params.toString()}`, {
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
export const fetchInviteRecords = async (filter?: {
    startDate?: string;
    endDate?: string;
    keyword?: string;
}): Promise<InviteRecord[]> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (filter?.startDate) params.append('startDate', filter.startDate);
        if (filter?.endDate) params.append('endDate', filter.endDate);
        if (filter?.keyword) params.append('keyword', filter.keyword);

        const response = await fetch(`${BASE_URL}/invite/record?${params.toString()}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch invite records');
        const res = await response.json();
        // Map API response to InviteRecord format
        const list = res.data?.list || [];
        return list.map((item: any) => ({
            id: item.id,
            username: item.inviteeName || '未知用户',
            registerTime: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '',
            completedTasks: item.completedOrders || 0,
            reward: item.rewardAmount || 0,
        }));
    } catch (error) {
        console.error('Fetch invite records error:', error);
        return [];
    }
};

// 邀请配置
export interface InviteConfig {
    merchantInviteEnabled: boolean;
    inviteUnlockThreshold: number;
    referralRewardPerOrder: number;
    referralMaxCount: number;
    referralMaxAmount: number;
    referralLifetimeMaxAmount: number;
    buyerReferralReward: number;
    merchantReferralReward: number;
}

// 获取邀请配置
export const fetchInviteConfig = async (): Promise<InviteConfig> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/invite/config`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch invite config');
        const res = await response.json();
        return res.data || {
            merchantInviteEnabled: false,
            inviteUnlockThreshold: 10,
            referralRewardPerOrder: 1,
            referralMaxCount: 5,
            referralMaxAmount: 5,
            referralLifetimeMaxAmount: 1000,
            buyerReferralReward: 5,
            merchantReferralReward: 10,
        };
    } catch (error) {
        console.error('Fetch invite config error:', error);
        return {
            merchantInviteEnabled: false,
            inviteUnlockThreshold: 10,
            referralRewardPerOrder: 1,
            referralMaxCount: 5,
            referralMaxAmount: 5,
            referralLifetimeMaxAmount: 1000,
            buyerReferralReward: 5,
            merchantReferralReward: 10,
        };
    }
};

// 商家邀请资格
export interface MerchantInviteEligibility {
    canInvite: boolean;
    reason?: string;
    completedTasks: number;
    requiredTasks: number;
}

// 检查商家邀请资格
export const checkMerchantInviteEligibility = async (): Promise<MerchantInviteEligibility> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/invite/merchant-eligibility`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to check merchant invite eligibility');
        const res = await response.json();
        return res.data || { canInvite: false, reason: '未知错误', completedTasks: 0, requiredTasks: 10 };
    } catch (error) {
        console.error('Check merchant invite eligibility error:', error);
        return { canInvite: false, reason: '网络错误', completedTasks: 0, requiredTasks: 10 };
    }
};

// 邀请资格（通用）
export interface InviteEligibility {
    canInvite: boolean;
    reason?: string;
    completedTasks: number;
    requiredTasks: number;
}

// 检查邀请资格（通用）
export const checkInviteEligibility = async (): Promise<InviteEligibility> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/invite/eligibility`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to check invite eligibility');
        const res = await response.json();
        return res.data || { canInvite: false, reason: '未知错误', completedTasks: 0, requiredTasks: 10 };
    } catch (error) {
        console.error('Check invite eligibility error:', error);
        return { canInvite: false, reason: '网络错误', completedTasks: 0, requiredTasks: 10 };
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

// 导出资金记录为 Excel (CSV 格式)
export const exportFundRecordsToExcel = async (type?: 'principal' | 'silver'): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        params.append('pageSize', '10000'); // 获取所有记录

        const response = await fetch(`${BASE_URL}/user/fund-records?${params.toString()}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch fund records');
        const res = await response.json();
        const records: FundRecord[] = res.data?.list || [];

        if (records.length === 0) {
            throw new Error('没有可导出的记录');
        }

        // 生成 CSV 内容
        const typeLabel = type === 'principal' ? '本金' : type === 'silver' ? '银锭' : '全部';
        const headers = ['时间', '类型', '收支', '金额', '余额', '描述'];
        const rows = records.map(r => [
            new Date(r.createdAt).toLocaleString('zh-CN'),
            r.type === 'principal' ? '本金' : '银锭',
            r.action === 'in' ? '收入' : '支出',
            r.amount.toFixed(2),
            r.balance.toFixed(2),
            r.description
        ]);

        // 添加 BOM 以支持中文
        const BOM = '\uFEFF';
        const csvContent = BOM + [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

        // 创建下载
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `资金记录_${typeLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export fund records error:', error);
        throw error;
    }
};

// ========== 用户资料 ==========

export interface UserProfileStats {
    totalPaidPrincipal: number;     // 累计垫付本金
    monthlyRemainingTasks: number;  // 本月剩余任务数
    totalCompletedTasks: number;    // 累计完成任务数
    totalEarnedSilver: number;      // 累计赚取银锭
    pendingMerchantSilver: number;  // 待商家发放银锭
    frozenSilver: number;           // 冻结的银锭
    silverToYuan: number;           // 银锭折现金额
    todayInvited: number;           // 今日邀请人数
    totalInvited: number;           // 总邀请人数
    pendingOrders: number;          // 进行中订单数
    submittedOrders: number;        // 待审核订单数
    experience: number;             // 经验值
}

export interface UserProfile {
    id: string;
    username: string;
    phone: string;
    wechat?: string;            // 微信号
    avatar?: string;            // 头像
    realName?: string;      // 实名
    balance: number;        // 本金余额
    frozenBalance: number;  // 冻结本金
    silver: number;         // 银锭
    frozenSilver: number;   // 冻结银锭
    totalEarned: number;    // 累计赚取
    pendingReward: number;  // 待发放
    experience: number;     // 经验值
    createdAt: string;
    stats?: UserProfileStats;  // 扩展统计数据
}

// 获取用户资料
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const token = localStorage.getItem('token');
        console.log('[UserService] fetchUserProfile - token exists:', !!token);
        console.log('[UserService] fetchUserProfile - token value:', token ? token.substring(0, 50) + '...' : 'null');
        
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('[UserService] Request headers:', headers);
        
        const response = await fetch(`${BASE_URL}/user/profile`, {
            headers,
            cache: 'no-store'
        });

        console.log('[UserService] Response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('[UserService] Unauthorized - clearing token');
                console.warn('[UserService] Token was:', token ? 'present' : 'missing');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null; // Return null instead of throwing
            }
            throw new Error(`Failed to fetch user profile: ${response.status}`);
        }

        const res = await response.json();
        return res.data || null;
    } catch (error) {
        console.error('Fetch user profile error:', error);
        return null;
    }
};

// 发送个人中心相关验证码
export const sendProfileSmsCode = async (phone: string, type: 'change_phone' | 'change_password' | 'change_pay_password'): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/send-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ phone, type })
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '发送成功' : '发送失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 修改登录密码
export const changePassword = async (data: { oldPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '修改成功' : '修改失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 修改支付密码
export const changePayPassword = async (data: { newPayPassword: string; phone: string; smsCode: string }): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/change-pay-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '修改成功' : '修改失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 修改手机号
export const changePhone = async (data: { oldPhone: string; payPassword: string; newPhone: string; smsCode: string }): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/change-phone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: response.ok, message: result.message || (response.ok ? '修改成功' : '修改失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 更新用户资料（头像、微信号等）
export const updateUserProfile = async (data: { avatar?: string; wechat?: string }): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: response.ok && result.success, message: result.message || (response.ok ? '更新成功' : '更新失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};
