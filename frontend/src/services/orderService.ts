import { BASE_URL } from '../../apiConfig';

export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED' | string;

export interface OrderSummary {
    id: string;
    taskId: string;
    taskTitle: string;
    shopName: string;
    platform: string;
    productPrice: number;
    commission: number;
    userDivided: number;
    status: OrderStatus;
    currentStep?: number;
    totalSteps?: number;
    endingTime?: string;
}

const authHeader = (): Record<string, string> => {
    if (typeof localStorage === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalize = (raw: any): OrderSummary => ({
    id: raw?.id,
    taskId: raw?.taskId,
    taskTitle: raw?.taskTitle || raw?.productName || '任务',
    shopName: raw?.shopName || raw?.merchantName || '-',
    platform: raw?.platform || raw?.taskType || '-',
    productPrice: Number(raw?.productPrice) || 0,
    commission: Number(raw?.commission) || 0,
    userDivided: Number(raw?.userDivided) || 0,
    status: raw?.status || 'PENDING',
    currentStep: raw?.currentStep,
    totalSteps: raw?.totalSteps,
    endingTime: raw?.endingTime,
});

export async function listOrders(status?: OrderStatus): Promise<OrderSummary[]> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetch(`${BASE_URL}/orders${params}`, { headers: { ...authHeader() } });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
        throw new Error(data?.message || '获取订单失败');
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(normalize);
}

export async function fetchOrderDetail(id: string): Promise<OrderSummary> {
    const res = await fetch(`${BASE_URL}/orders/${id}`, { headers: { ...authHeader() } });
    const data = await res.json();
    if (!res.ok || data?.success === false || !data?.data) {
        throw new Error(data?.message || '获取订单详情失败');
    }
    return normalize(data.data);
}

export async function createOrder(taskId: string, buynoId: string): Promise<{ orderId: string }> {
    const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
        },
        body: JSON.stringify({ taskId, buynoId }),
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
        throw new Error(data?.message || '领取任务失败');
    }
    return { orderId: data?.data?.id || data?.data?.orderId };
}

export async function submitOrderStep(orderId: string, step: number, payload: Record<string, any>): Promise<void> {
    const formData = new FormData();
    formData.append('step', String(step));
    Object.entries(payload || {}).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (v instanceof File) {
            formData.append(k, v);
        } else {
            formData.append(k, String(v));
        }
    });
    const res = await fetch(`${BASE_URL}/orders/${orderId}/submit-step`, {
        method: 'POST',
        headers: { ...authHeader() },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
        throw new Error(data?.message || '提交失败');
    }
}

export async function cancelOrder(orderId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) {
        throw new Error(data?.message || '取消失败');
    }
}
