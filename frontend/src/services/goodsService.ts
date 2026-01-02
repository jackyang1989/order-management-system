import api from './api';

export interface Goods {
    id: string;
    sellerId: string;
    shopId: string;
    shop?: {
        id: string;
        shopName: string;
    };
    name: string;
    link?: string;
    taobaoId?: string;
    verifyCode?: string;
    pcImg?: string; // JSON数组
    specName?: string;
    specValue?: string;
    price: number;
    num: number;
    showPrice: number;
    goodsKeyId?: string;
    state: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGoodsDto {
    shopId: string;
    name: string;
    link?: string;
    taobaoId?: string;
    verifyCode?: string;
    pcImg?: string;
    specName?: string;
    specValue?: string;
    price: number;
    num?: number;
    showPrice?: number;
    goodsKeyId?: string;
}

export interface UpdateGoodsDto {
    name?: string;
    link?: string;
    taobaoId?: string;
    verifyCode?: string;
    pcImg?: string;
    specName?: string;
    specValue?: string;
    price?: number;
    num?: number;
    showPrice?: number;
    goodsKeyId?: string;
}

export interface GoodsFilterDto {
    shopId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

// 获取商品列表
export const fetchGoods = async (filter?: GoodsFilterDto): Promise<{ data: Goods[], total: number, page: number, totalPages: number }> => {
    try {
        const params = new URLSearchParams();
        if (filter?.shopId) params.append('shopId', filter.shopId);
        if (filter?.search) params.append('search', filter.search);
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.limit) params.append('limit', filter.limit.toString());

        const res = await api.get(`/goods?${params.toString()}`);
        if (res.data.success) {
            return {
                data: res.data.data || [],
                total: res.data.total || 0,
                page: res.data.page || 1,
                totalPages: res.data.totalPages || 1
            };
        }
        return { data: [], total: 0, page: 1, totalPages: 1 };
    } catch (error) {
        console.error('获取商品列表失败:', error);
        return { data: [], total: 0, page: 1, totalPages: 1 };
    }
};

// 获取单个商品
export const fetchGoodsById = async (id: string): Promise<Goods | null> => {
    try {
        const res = await api.get(`/goods/${id}`);
        if (res.data.success) {
            return res.data.data;
        }
        return null;
    } catch (error) {
        console.error('获取商品详情失败:', error);
        return null;
    }
};

// 获取店铺商品列表
export const fetchGoodsByShop = async (shopId: string): Promise<Goods[]> => {
    try {
        const res = await api.get(`/goods/shop/${shopId}`);
        if (res.data.success) {
            return res.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('获取店铺商品失败:', error);
        return [];
    }
};

// 创建商品
export const createGoods = async (dto: CreateGoodsDto): Promise<{ success: boolean; message: string; data?: Goods }> => {
    try {
        const res = await api.post('/goods', dto);
        return res.data;
    } catch (error: any) {
        console.error('创建商品失败:', error);
        return { success: false, message: error.response?.data?.message || '创建失败' };
    }
};

// 更新商品
export const updateGoods = async (id: string, dto: UpdateGoodsDto): Promise<{ success: boolean; message: string; data?: Goods }> => {
    try {
        const res = await api.put(`/goods/${id}`, dto);
        return res.data;
    } catch (error: any) {
        console.error('更新商品失败:', error);
        return { success: false, message: error.response?.data?.message || '更新失败' };
    }
};

// 删除商品
export const deleteGoods = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await api.delete(`/goods/${id}`);
        return res.data;
    } catch (error: any) {
        console.error('删除商品失败:', error);
        return { success: false, message: error.response?.data?.message || '删除失败' };
    }
};
