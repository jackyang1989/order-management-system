import api from './api';

export enum BlacklistType {
    PERMANENT = 0,
    TEMPORARY = 1
}

export interface MerchantBlacklist {
    id: string;
    sellerId: string;
    accountName: string;
    type: BlacklistType;
    status: number;
    endTime?: string;
    reason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBlacklistDto {
    accountName: string;
    type?: BlacklistType;
    endTime?: string;
    reason?: string;
}

export interface UpdateBlacklistDto {
    accountName?: string;
    type?: BlacklistType;
    endTime?: string;
    reason?: string;
}

// 获取黑名单列表
export const fetchBlacklist = async (filter?: {
    accountName?: string;
    type?: BlacklistType;
    page?: number;
    limit?: number;
}): Promise<{ data: MerchantBlacklist[]; total: number; page: number }> => {
    try {
        const params = new URLSearchParams();
        if (filter?.accountName) params.append('accountName', filter.accountName);
        if (filter?.type !== undefined) params.append('type', filter.type.toString());
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.limit) params.append('limit', filter.limit.toString());

        const res = await api.get(`/merchant/blacklist?${params.toString()}`);
        if (res.data.success) {
            return {
                data: res.data.data || [],
                total: res.data.total || 0,
                page: res.data.page || 1
            };
        }
        return { data: [], total: 0, page: 1 };
    } catch (error) {
        console.error('获取黑名单失败:', error);
        return { data: [], total: 0, page: 1 };
    }
};

// 添加黑名单
export const addBlacklist = async (dto: CreateBlacklistDto): Promise<{ success: boolean; message: string; data?: MerchantBlacklist }> => {
    try {
        const res = await api.post('/merchant/blacklist', dto);
        return res.data;
    } catch (error: any) {
        console.error('添加黑名单失败:', error);
        return { success: false, message: error.response?.data?.message || '添加失败' };
    }
};

// 更新黑名单
export const updateBlacklist = async (id: string, dto: UpdateBlacklistDto): Promise<{ success: boolean; message: string; data?: MerchantBlacklist }> => {
    try {
        const res = await api.put(`/merchant/blacklist/${id}`, dto);
        return res.data;
    } catch (error: any) {
        console.error('更新黑名单失败:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
    }
};

// 删除黑名单
export const deleteBlacklist = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.delete(`/merchant/blacklist/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('删除黑名单失败:', error);
        return { success: false, message: error.response?.data?.message || '删除失败' };
    }
};

// 检查账号是否在黑名单
export const checkBlacklist = async (accountName: string): Promise<boolean> => {
    try {
        const res = await api.get(`/merchant/blacklist/check/${encodeURIComponent(accountName)}`);
        if (res.data.success) {
            return res.data.data.isBlacklisted;
        }
        return false;
    } catch (error) {
        console.error('检查黑名单失败:', error);
        return false;
    }
};
