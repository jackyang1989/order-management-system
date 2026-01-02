import api from './api';

export enum KeywordPlatform {
    TAOBAO = 1,
    TMALL = 2,
    FEIZHU = 3
}

export enum KeywordTerminal {
    PC = 1,
    MOBILE = 2
}

export interface KeywordDetail {
    id: string;
    goodsKeyId: string;
    keyword: string;
    terminal: KeywordTerminal;
    discount?: string;
    filter?: string;
    sort?: string;
    maxPrice: number;
    minPrice: number;
    province?: string;
    createdAt: string;
}

export interface GoodsKey {
    id: string;
    sellerId: string;
    name: string;
    platform: KeywordPlatform;
    details?: KeywordDetail[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateGoodsKeyDto {
    name: string;
    platform?: KeywordPlatform;
    details?: CreateKeywordDetailDto[];
}

export interface UpdateGoodsKeyDto {
    name?: string;
    platform?: KeywordPlatform;
}

export interface CreateKeywordDetailDto {
    keyword: string;
    terminal?: KeywordTerminal;
    discount?: string;
    filter?: string;
    sort?: string;
    maxPrice?: number;
    minPrice?: number;
    province?: string;
}

export interface UpdateKeywordDetailDto {
    keyword?: string;
    terminal?: KeywordTerminal;
    discount?: string;
    filter?: string;
    sort?: string;
    maxPrice?: number;
    minPrice?: number;
    province?: string;
}

// 平台名称映射
export const platformNames: Record<KeywordPlatform, string> = {
    [KeywordPlatform.TAOBAO]: '淘宝',
    [KeywordPlatform.TMALL]: '天猫',
    [KeywordPlatform.FEIZHU]: '飞猪'
};

// 终端名称映射
export const terminalNames: Record<KeywordTerminal, string> = {
    [KeywordTerminal.PC]: '电脑端',
    [KeywordTerminal.MOBILE]: '手机端'
};

// ============ 关键词方案 API ============

// 获取所有关键词方案
export const fetchKeywordSchemes = async (): Promise<GoodsKey[]> => {
    try {
        const res = await api.get('/keywords/schemes');
        if (res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('获取关键词方案失败:', error);
        return [];
    }
};

// 获取单个方案（包含详情）
export const fetchKeywordSchemeById = async (id: string): Promise<GoodsKey | null> => {
    try {
        const res = await api.get(`/keywords/schemes/${id}`);
        if (res.data.success) {
            return res.data.data;
        }
        return null;
    } catch (error) {
        console.error('获取关键词方案详情失败:', error);
        return null;
    }
};

// 创建关键词方案
export const createKeywordScheme = async (dto: CreateGoodsKeyDto): Promise<{ success: boolean; message: string; data?: GoodsKey }> => {
    try {
        const res = await api.post('/keywords/schemes', dto);
        return res.data;
    } catch (error: any) {
        console.error('创建关键词方案失败:', error);
        return { success: false, message: error.response?.data?.message || '创建失败' };
    }
};

// 更新关键词方案
export const updateKeywordScheme = async (id: string, dto: UpdateGoodsKeyDto): Promise<{ success: boolean; message: string; data?: GoodsKey }> => {
    try {
        const res = await api.put(`/keywords/schemes/${id}`, dto);
        return res.data;
    } catch (error: any) {
        console.error('更新关键词方案失败:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
    }
};

// 删除关键词方案
export const deleteKeywordScheme = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.delete(`/keywords/schemes/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('删除关键词方案失败:', error);
        return { success: false, message: error.response?.data?.message || '删除失败' };
    }
};

// ============ 关键词详情 API ============

// 获取方案下的所有关键词
export const fetchKeywordDetails = async (schemeId: string): Promise<KeywordDetail[]> => {
    try {
        const res = await api.get(`/keywords/schemes/${schemeId}/details`);
        if (res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('获取关键词详情失败:', error);
        return [];
    }
};

// 添加关键词
export const addKeywordDetail = async (schemeId: string, dto: CreateKeywordDetailDto): Promise<{ success: boolean; message: string; data?: KeywordDetail }> => {
    try {
        const res = await api.post(`/keywords/schemes/${schemeId}/details`, dto);
        return res.data;
    } catch (error: any) {
        console.error('添加关键词失败:', error);
        return { success: false, message: error.response?.data?.message || '添加失败' };
    }
};

// 更新关键词
export const updateKeywordDetail = async (detailId: string, dto: UpdateKeywordDetailDto): Promise<{ success: boolean; message: string; data?: KeywordDetail }> => {
    try {
        const res = await api.put(`/keywords/details/${detailId}`, dto);
        return res.data;
    } catch (error: any) {
        console.error('更新关键词失败:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
    }
};

// 删除关键词
export const deleteKeywordDetail = async (detailId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.delete(`/keywords/details/${detailId}`);
        return res.data;
    } catch (error: any) {
        console.error('删除关键词失败:', error);
        return { success: false, message: error.response?.data?.message || '删除失败' };
    }
};
