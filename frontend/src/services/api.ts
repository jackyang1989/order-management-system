import { BASE_URL } from '../../apiConfig';

// 重新导出 BASE_URL 供其他模块使用
export { BASE_URL };

export interface ApiResponse<T = unknown> {
    data: T;
    status: number;
    success?: boolean;
    message?: string;
    error?: boolean;
    errorMessage?: string;
}

/**
 * 获取认证Token
 * 优先使用商家token，其次用户token
 */
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('merchantToken') || localStorage.getItem('token') || null;
};

/**
 * 获取商家Token
 */
export const getMerchantToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('merchantToken') || null;
};

/**
 * 获取买手Token
 */
export const getUserToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || null;
};

/**
 * 设置Token
 */
export const setToken = (token: string, type: 'user' | 'merchant' = 'user'): void => {
    if (typeof window === 'undefined') return;
    const key = type === 'merchant' ? 'merchantToken' : 'token';
    localStorage.setItem(key, token);
};

/**
 * 清除Token
 */
export const clearToken = (type?: 'user' | 'merchant'): void => {
    if (typeof window === 'undefined') return;
    if (type === 'merchant') {
        localStorage.removeItem('merchantToken');
    } else if (type === 'user') {
        localStorage.removeItem('token');
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('merchantToken');
    }
};

/**
 * 安全 fetch 封装 - 防止白屏
 * 所有网络错误返回空对象，不抛出异常
 */
const safeFetch = async <T = any>(
    url: string,
    options: RequestInit
): Promise<ApiResponse<T>> => {
    try {
        const response = await fetch(url, options);

        // 处理非 JSON 响应
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn(`[API] Non-JSON response from ${url}`);
            return {
                data: {} as T,
                status: response.status,
                error: true,
                errorMessage: `Non-JSON response: ${response.status}`,
            };
        }

        const data = await response.json();
        return { data, status: response.status };
    } catch (error) {
        // 网络错误、JSON 解析错误等 - 返回空对象防止白屏
        console.error(`[API] Fetch error for ${url}:`, error);
        return {
            data: {} as T,
            status: 0,
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Network error',
        };
    }
};

const api = {
    async get<T = any>(url: string): Promise<ApiResponse<T>> {
        const token = getToken();
        return safeFetch<T>(`${BASE_URL}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    },

    async post<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
        const token = getToken();
        return safeFetch<T>(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    async put<T = any>(url: string, body?: any): Promise<ApiResponse<T>> {
        const token = getToken();
        return safeFetch<T>(`${BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    async delete<T = any>(url: string): Promise<ApiResponse<T>> {
        const token = getToken();
        return safeFetch<T>(`${BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    },
};

export default api;
