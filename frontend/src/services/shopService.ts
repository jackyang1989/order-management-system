import { BASE_URL } from '../../apiConfig';

export interface Shop {
    id: string;
    platform: 'TAOBAO' | 'TMALL' | 'JD' | 'PDD' | 'DOUYIN' | 'OTHER';
    shopName: string;
    accountName: string;
    contactName: string;
    mobile: string;
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
    const res = await fetch(`${BASE_URL}/shops`, { headers: getHeaders() });
    const json = await res.json();
    return json.success ? json.data : [];
};

export const createShop = async (data: Partial<Shop>): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE_URL}/shops`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
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
