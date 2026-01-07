import { BASE_URL } from '../../apiConfig';

export type TaskStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | string;

export interface TaskItem {
    id: string;
    title: string;
    shopName: string;
    platform: string;
    price: number;
    commission: number;
    userDivided: number;
    status: TaskStatus;
    progress?: string;
}

export interface ContinueTaskItem {
    id: string;
    taskId: string;
    title: string;
    shopName: string;
    platform: string;
    price: number;
    commission: number;
    userDivided: number;
    status: string;
    currentStep?: number;
    totalSteps?: number;
}

const authHeader = () => {
    if (typeof localStorage === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeTask = (raw: any): TaskItem => ({
    id: raw?.id,
    title: raw?.title || raw?.taskTitle || '任务',
    shopName: raw?.shopName || raw?.merchantName || '-',
    platform: raw?.platform || raw?.taskType || '-',
    price: Number(raw?.goodsPrice || raw?.productPrice || raw?.total_price) || 0,
    commission: Number(raw?.totalCommission || raw?.commission || raw?.user_reward) || 0,
    userDivided: Number(raw?.userDivided || raw?.user_divided) || 0,
    status: raw?.status || 'ACTIVE',
    progress: raw?.progress ? `${parseInt(raw.progress, 10)}%` : undefined,
});

const normalizeContinue = (raw: any): ContinueTaskItem => ({
    id: raw?.id || raw?.orderId || raw?.taskId,
    taskId: raw?.taskId || raw?.seller_task_id || raw?.id,
    title: raw?.taskTitle || raw?.title || '任务',
    shopName: raw?.shopName || raw?.seller || '-',
    platform: raw?.platform || raw?.task_type || '-',
    price: Number(raw?.productPrice || raw?.principal || raw?.total_price) || 0,
    commission: Number(raw?.commission) || Number(raw?.user_reward) || 0,
    userDivided: Number(raw?.userDivided || raw?.user_divided) || 0,
    status: raw?.status || raw?.task_step || 'PENDING',
    currentStep: raw?.task_step || raw?.currentStep,
    totalSteps: raw?.totalSteps,
});

export async function fetchTaskList(filter?: Record<string, any>): Promise<{ list: TaskItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filter) Object.entries(filter).forEach(([k, v]) => { if (v !== undefined && v !== '') params.append(k, String(v)); });
    const res = await fetch(`${BASE_URL}/tasks?${params.toString()}`, { headers: { ...authHeader() } });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || '获取任务失败');
    const list = Array.isArray(data?.data) ? data.data.map(normalizeTask) : [];
    return { list, total: list.length };
}

export async function fetchTaskDetail(id: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, { headers: { ...authHeader() } });
    const data = await res.json();
    if (!res.ok || data?.success === false || !data?.data) throw new Error(data?.message || '获取任务详情失败');
    return normalizeTask(data.data);
}

export async function claimTask(taskId: string, buynoId: string): Promise<{ orderId: string }> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ buynoId }),
    });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || '领取任务失败');
    return { orderId: data?.data?.orderId || data?.data?.id };
}

export async function fetchContinueTasks(): Promise<ContinueTaskItem[]> {
    // TODO: replace with real API endpoint if available
    // Using orders pending as continue list fallback
    const res = await fetch(`${BASE_URL}/orders?status=PENDING`, { headers: { ...authHeader() } });
    const data = await res.json();
    if (!res.ok || data?.success === false) throw new Error(data?.message || '获取待完成任务失败');
    const list = Array.isArray(data?.data) ? data.data.map(normalizeContinue) : [];
    return list;
}
