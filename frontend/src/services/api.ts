import { BASE_URL } from '../../apiConfig';

interface ApiResponse<T = any> {
    data: T;
    status: number;
}

const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    // 优先使用商家token，其次用户token
    return localStorage.getItem('merchantToken') || localStorage.getItem('token') || null;
};

const api = {
    async get<T = any>(url: string): Promise<ApiResponse<T>> {
        const token = getToken();
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        const data = await response.json();
        return { data, status: response.status };
    },

    async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
        const token = getToken();
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        return { data, status: response.status };
    },

    async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
        const token = getToken();
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        return { data, status: response.status };
    },

    async delete<T = any>(url: string): Promise<ApiResponse<T>> {
        const token = getToken();
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        const data = await response.json();
        return { data, status: response.status };
    },
};

export default api;
