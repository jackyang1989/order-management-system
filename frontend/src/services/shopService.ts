import { BASE_URL } from '../../apiConfig';

// 获取完整的图片URL（处理相对路径）
export const getFullImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // 相对路径，拼接后端基础URL
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface Shop {
    id: string;
    platform: string;  // 平台类型，如 TAOBAO, TMALL, JD 等
    shopName: string;
    accountName?: string;  // 可能为空
    contactName?: string;  // 可能为空
    mobile?: string;       // 可能为空
    province?: string;
    city?: string;
    district?: string;
    detailAddress?: string;
    url?: string;
    screenshot?: string;   // 店铺后台截图URL
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

/**
 * 上传店铺截图
 */
export const uploadShopScreenshot = async (file: File): Promise<{ success: boolean; message: string; url?: string }> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('merchantToken') || localStorage.getItem('token')) : '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('usage', 'screenshot');

    const res = await fetch(`${BASE_URL}/uploads/file`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    const json = await res.json();
    if (json.success && json.data?.url) {
        return { success: true, message: '上传成功', url: json.data.url };
    }
    return { success: false, message: json.message || '上传失败' };
};
