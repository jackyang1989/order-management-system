import api from './api';

export interface EntryTypeData {
    id: string;
    code: string;
    name: string;
    icon?: string;
    color?: string;
    value: number;
    sortOrder: number;
}

/**
 * 获取启用的入口类型列表（公开API）
 */
export const fetchEnabledEntryTypes = async (): Promise<EntryTypeData[]> => {
    try {
        const res = await api.get('/entry-types');
        if (res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('获取入口类型失败:', error);
        return [];
    }
};

/**
 * 获取所有入口类型（后台管理API）
 */
export const fetchAllEntryTypes = async (activeOnly: boolean = true): Promise<EntryTypeData[]> => {
    try {
        const res = await api.get(`/admin/entry-types?activeOnly=${activeOnly}`);
        if (res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('获取入口类型失败:', error);
        return [];
    }
};

/**
 * 更新入口类型
 */
export const updateEntryType = async (id: string, data: Partial<EntryTypeData>): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.put(`/admin/entry-types/${id}`, data);
        return res.data;
    } catch (error: any) {
        console.error('更新入口类型失败:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
    }
};

/**
 * 切换入口类型状态
 */
export const toggleEntryType = async (id: string, isActive: boolean): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.put(`/admin/entry-types/${id}/toggle`, { isActive });
        return res.data;
    } catch (error: any) {
        console.error('切换入口类型状态失败:', error);
        return { success: false, message: error.response?.data?.message || '操作失败' };
    }
};
