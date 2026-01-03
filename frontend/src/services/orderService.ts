import { BASE_URL } from '../../apiConfig';
import { mockOrders, MockOrder } from '../mocks/orderMock';

const USE_MOCK = false;

// 获取我的订单
export const fetchMyOrders = async (status?: string): Promise<MockOrder[]> => {
    if (USE_MOCK) {
        console.log('[OrderService] Fetching mock orders, status:', status);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (status && status !== 'all') {
            return mockOrders.filter(o => o.status === status);
        }
        return mockOrders;
    }

    try {
        const url = status && status !== 'all' ? `${BASE_URL}/orders?status=${status}` : `${BASE_URL}/orders`;
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch orders error:', error);
        return [];
    }
};

// 获取订单详情
export const fetchOrderDetail = async (id: string): Promise<MockOrder | null> => {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return mockOrders.find(o => o.id === id) || null;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/orders/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const res = await response.json();
        return res.data || null;
    } catch (error) {
        return null;
    }
};

// 创建订单（领取任务）
export const createOrder = async (taskId: string, buyerAccount: string): Promise<{ success: boolean; orderId?: string }> => {
    if (USE_MOCK) {
        console.log('[OrderService] Mock create order:', taskId, buyerAccount);
        await new Promise(resolve => setTimeout(resolve, 800));

        const newOrderId = `new_order_${Date.now()}`;
        // Push a new mock order to the list
        mockOrders.unshift({
            id: newOrderId,
            taskNumber: `T${Date.now()}`,
            shopName: '新接店铺',
            status: 'PENDING',
            statusLabel: '进行中',
            commission: 8.00,
            principal: 100.00,
            userDivided: 0,
            goodsPrice: 100.00,
            buyerAccount: buyerAccount,
            taskType: 'KEYWORD',
            keyword: '系统分配关键词',
            taskStep: 1,
            endingTime: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString()
        });

        return { success: true, orderId: newOrderId };
    }

    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            },
            body: JSON.stringify({ taskId, buyerAccount })
        });
        const res = await response.json();
        if (response.ok && res.code === 1) {
             // 假设后端返回 data.id 或 data.orderId
             return { success: true, orderId: res.data?.id || res.data?.orderId };
        }
        return { success: false };
    } catch (error) {
        return { success: false };
    }
}

// 提交步骤
export const submitOrderStep = async (orderId: string, step: number, data: any): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        console.log('[OrderService] Mock submit step:', step, 'for order:', orderId);
        console.log('Submission Data:', data);
        if (data instanceof FormData) {
            console.log('Files included:', [...data.entries()]);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, message: '提交成功' };
    }

    try {
        const formData = new FormData();
        formData.append('step', String(step));

        // If data is just a plain object, append its keys. If it's ALREADY FormData, that's different logic.
        // But the frontend usually keeps 'data' as state object { file: File, text: ... }
        // So let's construct FormData here.
        Object.entries(data).forEach(([key, value]) => {
            if (value instanceof File) {
                formData.append(key, value);
            } else if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        const response = await fetch(`${BASE_URL}/orders/${orderId}/step`, {
            method: 'POST',
            headers: localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {},
            // headers: { 'Content-Type': 'multipart/form-data' }, // Should NOT set this manually for FormData
            body: formData
        });
        return response.json();
    } catch (error) {
        return { success: false, message: '提交失败' };
    }
};

// 取消订单
export const cancelOrder = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        console.log('[OrderService] Mock cancel order:', orderId);
        await new Promise(resolve => setTimeout(resolve, 600));
        return { success: true, message: '订单已取消' };
    }

    try {
        const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}
        });

        return response.json();
    } catch (error) {
        return { success: false, message: '取消失败' };
    }
};
