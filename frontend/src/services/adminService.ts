import api from './api';
import { BASE_URL } from './api';

// System Config Interface (mirroring backend SystemConfigDto)
export interface SystemConfigDto {
    siteName?: string;
    siteKeywords?: string;
    siteDescription?: string;

    // Withdrawal Config
    userMinMoney?: number;
    userMinReward?: number;
    userFeeMaxPrice?: number;
    userCashFree?: number;
    sellerMinMoney?: number;
    sellerCashFee?: number;
    rewardPrice?: number; // Silver exchange rate

    // Registration
    registerAudit?: boolean;
    registerReward?: number;

    // Task/Order
    baseServiceFee?: number;
    praiseFee?: number;
    imagePraiseFee?: number;
    videoPraiseFee?: number;
}

// Merchant Interface for Admin
export interface AdminMerchant {
    id: string;
    username: string;
    phone: string;
    wechat?: string;
    companyName?: string;
    contactName?: string;
    businessLicense?: string;
    balance: number;
    frozenBalance: number;
    silver: number;
    status: number; // 0=PENDING, 1=APPROVED, 2=REJECTED, 3=DISABLED
    vip: boolean;
    vipExpireAt?: string;
    inviteCode?: string;
    referrerId?: string;
    referrerName?: string; // 推荐人名称
    note?: string; // 违规备注
    shopCount?: number; // 店铺数量
    createdAt: string;
    updatedAt?: string;
}

// Withdrawal Interface
export interface AdminWithdrawal {
    id: string;
    userId: string;
    userType: 'user' | 'merchant';
    type: 'balance' | 'silver';
    amount: number;
    fee: number;
    actualAmount: number;
    status: string; // PENDING, APPROVED, REJECTED
    bankName: string;
    cardNumber: string;
    holderName: string;
    createdAt: string;
    remark?: string;
}

export const adminService = {
    // ============ System Config ============
    getGlobalConfig: () => api.get<SystemConfigDto>('/system-config/global'),
    updateGlobalConfig: (data: SystemConfigDto) => api.put<SystemConfigDto>('/system-config/global', data),

    // ============ Merchant Management ============
    getMerchants: (params?: { page?: number; limit?: number; status?: number; keyword?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', String(params.page));
        if (params?.limit) query.append('limit', String(params.limit));
        if (params?.status !== undefined) query.append('status', String(params.status));
        if (params?.keyword) query.append('keyword', params.keyword);
        return api.get<{ data: AdminMerchant[]; total: number }>(`/admin/merchants?${query.toString()}`);
    },

    createMerchant: (data: {
        username: string;
        password: string;
        phone: string;
        wechat?: string;
        companyName?: string;
        vipExpireAt?: string;
        balance?: number;
        silver?: number;
        note?: string;
    }) =>
        api.post('/admin/merchants', data),

    banMerchant: (id: string, reason: string) => api.post(`/admin/merchants/${id}/ban`, { reason }),
    unbanMerchant: (id: string) => api.post(`/admin/merchants/${id}/unban`),

    adjustMerchantBalance: (id: string, data: { type: 'balance' | 'silver'; action: 'add' | 'deduct'; amount: number; reason: string }) =>
        api.post(`/admin/merchants/${id}/adjust-balance`, {
            type: data.type,
            amount: data.amount,
            reason: data.reason
        }),

    setMerchantVip: (id: string, days: number) => api.post(`/admin/merchants/${id}/vip`, { days }),
    removeMerchantVip: (id: string) => api.post(`/admin/merchants/${id}/remove-vip`),

    // ============ Finance / Withdrawals ============
    getWithdrawals: (params?: { page?: number; limit?: number; status?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', String(params.page));
        if (params?.limit) query.append('limit', String(params.limit));
        if (params?.status) query.append('status', params.status);
        return api.get<{ data: AdminWithdrawal[]; total: number }>(`/admin/withdrawals?${query.toString()}`);
    },

    reviewWithdrawal: (id: string, approved: boolean, remark?: string) =>
        api.put(`/admin/withdrawals/${id}/review`, { approved, remark }),

    // ============ Order Management ============
    getOrders: (params?: { page?: number; limit?: number; status?: string; keyword?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', String(params.page));
        if (params?.limit) query.append('limit', String(params.limit));
        if (params?.status) query.append('status', params.status);
        if (params?.keyword) query.append('keyword', params.keyword);
        return api.get<{ data: any[]; total: number }>(`/orders/admin/list?${query.toString()}`);
    }
};
