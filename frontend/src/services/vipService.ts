import { BASE_URL } from '../../apiConfig';

// ========== VIP 类型定义 ==========

export interface VipPackage {
    id: string;
    name: string;
    days: number;
    price: number;
    discountPrice: number;
    description: string;
    benefits: string[];
}

export interface VipStatus {
    isVip: boolean;
    expireAt: string | null;
    daysRemaining: number;
}

export interface VipPurchase {
    id: string;
    packageName: string;
    days: number;
    amount: number;
    status: string;
    paymentMethod: string;
    paidAt: string;
    vipStartAt: string;
    vipEndAt: string;
    createdAt: string;
}

// 支付方式类型
export type PaymentMethod = 'silver' | 'balance' | 'alipay';

// 购买结果
export interface PurchaseResult {
    success: boolean;
    message: string;
    data?: VipPurchase | {
        payUrl: string;
        orderNo: string;
    };
}

// ========== VIP 服务 ==========

// 获取VIP套餐列表
export const fetchVipPackages = async (): Promise<VipPackage[]> => {
    try {
        const response = await fetch(`${BASE_URL}/vip/packages`);
        if (!response.ok) throw new Error('Failed to fetch VIP packages');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch VIP packages error:', error);
        return [];
    }
};

// 获取VIP状态
export const fetchVipStatus = async (): Promise<VipStatus> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/vip/status`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch VIP status');
        const res = await response.json();
        return res.data || { isVip: false, expireAt: null, daysRemaining: 0 };
    } catch (error) {
        console.error('Fetch VIP status error:', error);
        return { isVip: false, expireAt: null, daysRemaining: 0 };
    }
};

// 购买VIP - 支持三种支付方式
export const purchaseVip = async (
    packageId: string,
    paymentMethod: PaymentMethod = 'silver'
): Promise<PurchaseResult> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/vip/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ packageId, paymentMethod })
        });
        const result = await response.json();
        return {
            success: result.success,
            message: result.message || (result.success ? '购买成功' : '购买失败'),
            data: result.data
        };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 获取购买记录
export const fetchVipRecords = async (page: number = 1, pageSize: number = 20): Promise<{ list: VipPurchase[]; total: number }> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        const response = await fetch(`${BASE_URL}/vip/records?${params.toString()}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch VIP records');
        const res = await response.json();
        return res.data || { list: [], total: 0 };
    } catch (error) {
        console.error('Fetch VIP records error:', error);
        return { list: [], total: 0 };
    }
};

// 获取用户余额（用于VIP充值页面展示）
export const fetchUserBalanceForVip = async (): Promise<{
    balance: number;
    silver: number;
}> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/user/profile`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch user balance');
        const res = await response.json();
        return {
            balance: res.data?.balance || 0,
            silver: res.data?.silver || 0
        };
    } catch (error) {
        console.error('Fetch user balance error:', error);
        return { balance: 0, silver: 0 };
    }
};
