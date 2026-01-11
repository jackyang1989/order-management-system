import { BASE_URL } from '../../apiConfig';

export interface Shop {
    id: string;
    platform: 'TAOBAO' | 'TMALL' | 'JD' | 'PDD' | 'DOUYIN' | 'OTHER';
    shopName: string;
    accountName?: string;  // 可能为空
    contactName?: string;  // 可能为空
    mobile?: string;       // 可能为空
    province?: string;
    city?: string;
    district?: string;
    detailAddress?: string;
    url?: string;
    status: 0 | 1 | 2 | 3;
    auditRemark?: string;
}

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('merchantToken') || localStorage.getItem('token')) : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const fetchShops = async (): Promise<Shop[]> => {
    try {
        const res = await fetch(`${BASE_URL}/shops`, { headers: getHeaders() });
        const json = await res.json();
        // 过滤掉无效数据
        if (json.success && Array.isArray(json.data)) {
            return json.data.filter((s: Shop | null | undefined) => s && s.id);
        }
        return [];
    } catch (error) {
        console.error('获取店铺列表失败:', error);
        return [];
    }
};

export const createShop = async (data: Partial<Shop> | FormData): Promise<{ success: boolean; message: string }> => {
    const isFormData = data instanceof FormData;
    const headers = getHeaders();
    if (isFormData) {
        delete (headers as any)['Content-Type']; // Let browser set Content-Type for FormData
    }

    const res = await fetch(`${BASE_URL}/shops`, {
        method: 'POST',
        headers,
        body: isFormData ? data : JSON.stringify(data)
    });
    return res.json();
};

export const updateShop = async (id: string, data: Partial<Shop>): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/shops/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return res.json();
};

export const deleteShop = async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/shops/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return res.json();
};
