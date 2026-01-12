import { BASE_URL } from '../../apiConfig';

export interface KeywordDetail {
    id: string;
    keyword: string;
    searchEngine?: string;
    orderType?: string;
    targetPrice?: number;
    amount?: number;
    discount?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    province?: string;
}

export interface KeywordScheme {
    id: string;
    name: string;
    description?: string;
    platform?: string;
    shopId?: string; // 关联的店铺ID
    details: KeywordDetail[];
    createdAt: string;
}

/**
 * 获取当前商户的所有关键词方案
 * @param shopId 可选，按店铺ID筛选
 */
export const fetchKeywordSchemes = async (shopId?: string): Promise<KeywordScheme[]> => {
    try {
        const token = localStorage.getItem('merchantToken');
        let url = `${BASE_URL}/keywords/schemes`;
        if (shopId) {
            url += `?shopId=${encodeURIComponent(shopId)}`;
        }
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch keyword schemes:', error);
        return [];
    }
};

/**
 * 获取指定方案的详情（包含关键词列表）
 */
export const fetchSchemeDetails = async (schemeId: string): Promise<KeywordScheme | null> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/keywords/schemes/${schemeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch scheme details:', error);
        return null;
    }
};
