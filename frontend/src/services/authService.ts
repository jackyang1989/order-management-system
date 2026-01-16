import { BASE_URL } from '../../apiConfig';
import { mockUsers, MockUser } from '../mocks/userMock';
export type { MockUser };

const USE_MOCK = false;

export interface LoginResult {
    success: boolean;
    message: string;
    data?: {
        accessToken: string;
        user: any;
    };
}

// 登录 - 支持用户名或手机号登录
export const login = async (usernameOrPhone: string, password: string): Promise<LoginResult> => {
    if (USE_MOCK) {
        console.log('[AuthService] Mock login attempt:', usernameOrPhone);
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = mockUsers.find(u => (u.phone === usernameOrPhone || u.username === usernameOrPhone) && u.password === password);
        if (user) {
            // 模拟存储 token
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', 'mock-jwt-token-' + user.id);
                localStorage.setItem('user', JSON.stringify(user));
            }
            return {
                success: true,
                message: '登录成功',
                data: {
                    accessToken: 'mock-jwt-token-' + user.id,
                    user
                }
            };
        }
        return {
            success: false,
            message: '用户名或密码错误'
        };
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 重要：允许发送和接收cookie
            body: JSON.stringify({ username: usernameOrPhone, phone: usernameOrPhone, password })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, message: data.message || '登录失败' };
        }
        return data;
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 发送验证码
export const sendSmsCode = async (phone: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        console.log('[AuthService] Mock SMS sent to:', phone);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: '验证码已发送 (Mock: 1234)' };
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        return response.json();
    } catch (error) {
        return { success: false, message: '发送失败' };
    }
};

// 发送登录验证码
export const sendLoginCode = async (phone: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        console.log('[AuthService] Mock login SMS sent to:', phone);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: '验证码已发送 (Mock: 123456)' };
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/send-login-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, message: data.message || '发送失败' };
        }
        return data;
    } catch (error) {
        return { success: false, message: '发送失败' };
    }
};

// 短信验证码登录
export const smsLogin = async (phone: string, code: string): Promise<LoginResult> => {
    if (USE_MOCK) {
        console.log('[AuthService] Mock SMS login:', phone, code);
        await new Promise(resolve => setTimeout(resolve, 800));
        if (code === '123456') {
            const user = mockUsers.find(u => u.phone === phone);
            if (user) {
                return {
                    success: true,
                    message: '登录成功',
                    data: { accessToken: 'mock-jwt-token-' + user.id, user }
                };
            }
        }
        return { success: false, message: '验证码错误' };
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/sms-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 重要：允许发送和接收cookie
            body: JSON.stringify({ phone, code })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, message: data.message || '登录失败' };
        }
        return data;
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 注册
export const register = async (data: {
    phone: string;
    password: string;
    username: string;
    invitationCode: string;
    smsCode?: string; // 可选，后端暂时不校验
}): Promise<LoginResult> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // 重要：允许发送和接收cookie
            body: JSON.stringify(data)
        });
        return response.json();
    } catch (error) {
        return { success: false, message: '注册失败' };
    }
};

// 获取当前用户
export const getCurrentUser = (): MockUser | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// 登出
export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// 检查是否登录
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
};

// 获取Token
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};
