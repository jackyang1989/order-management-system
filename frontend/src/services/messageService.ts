import { BASE_URL } from '../../apiConfig';

// ========== 消息类型定义 ==========

export interface Message {
    id: string;
    type: 'system' | 'task' | 'order' | 'finance' | 'promotion';
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    orderId?: string;
    taskId?: string;
}

export interface MessageFilter {
    type?: string;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
}

export interface UnreadCount {
    total: number;
    system?: number;
    task?: number;
    order?: number;
    finance?: number;
    promotion?: number;
}

// ========== 消息服务 ==========

// 获取消息列表
export const fetchMessages = async (filter?: MessageFilter): Promise<{ list: Message[]; total: number }> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (filter?.type) params.append('type', filter.type);
        if (filter?.isRead !== undefined) params.append('isRead', filter.isRead.toString());
        if (filter?.page) params.append('page', filter.page.toString());
        if (filter?.pageSize) params.append('pageSize', filter.pageSize.toString());

        const response = await fetch(`${BASE_URL}/messages?${params.toString()}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const res = await response.json();
        return { list: res.data || [], total: res.total || 0 };
    } catch (error) {
        console.error('Fetch messages error:', error);
        return { list: [], total: 0 };
    }
};

// 获取消息详情
export const fetchMessageDetail = async (id: string): Promise<Message | null> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch message detail');
        const res = await response.json();
        return res.data || null;
    } catch (error) {
        console.error('Fetch message detail error:', error);
        return null;
    }
};

// 标记单条消息为已读
export const markAsRead = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/${id}/read`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: result.success, message: result.message || (result.success ? '已标记为已读' : '操作失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 全部标记为已读
export const markAllAsRead = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/read-all`, {
            method: 'PUT',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: result.success, message: result.message || (result.success ? '已全部标记为已读' : '操作失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 删除单条消息
export const deleteMessage = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();
        return { success: result.success, message: result.message || (result.success ? '删除成功' : '删除失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 批量删除消息
export const batchDeleteMessages = async (ids: string[]): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/batch-delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ ids })
        });
        const result = await response.json();
        return { success: result.success, message: result.message || (result.success ? '删除成功' : '删除失败') };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 获取未读消息数量
export const getUnreadCount = async (): Promise<number> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/unread/count`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch unread count');
        const res = await response.json();
        return res.data?.count || 0;
    } catch (error) {
        console.error('Fetch unread count error:', error);
        return 0;
    }
};

// 获取各类型未读数量
export const getUnreadCountByType = async (): Promise<UnreadCount> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/messages/unread/by-type`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch unread count by type');
        const res = await response.json();
        return res.data || { total: 0 };
    } catch (error) {
        console.error('Fetch unread count by type error:', error);
        return { total: 0 };
    }
};
