import { BASE_URL } from '../../apiConfig';
import { mockTasks, MockTask } from '../mocks/taskMock';

const USE_MOCK = false;

export interface TaskFilter {
    taskType?: string;
    priceRange?: string;
    terminal?: string;
    page?: number;
    pageSize?: number;
}

// 获取任务列表
export const fetchTasks = async (filter?: TaskFilter): Promise<{ list: MockTask[]; total: number }> => {
    if (USE_MOCK) {
        console.log('[TaskService] Fetching mock tasks with filter:', filter);
        await new Promise(resolve => setTimeout(resolve, 600));

        let filtered = [...mockTasks];

        if (filter?.taskType && filter.taskType !== 'all') {
            filtered = filtered.filter(t => t.taskType === filter.taskType);
        }

        if (filter?.terminal && filter.terminal !== 'all') {
            filtered = filtered.filter(t => t.terminal === filter.terminal);
        }

        if (filter?.priceRange) {
            const ranges: Record<string, [number, number]> = {
                '1': [0, 200],
                '2': [200, 500],
                '3': [500, 1000],
                '4': [1000, 2000],
                '5': [2000, Infinity]
            };
            const [min, max] = ranges[filter.priceRange] || [0, Infinity];
            filtered = filtered.filter(t => t.goodsPrice >= min && t.goodsPrice < max);
        }

        return { list: filtered, total: filtered.length };
    }

    try {
        const params = new URLSearchParams();
        if (filter) {
            Object.entries(filter).forEach(([k, v]) => {
                if (v !== undefined) params.append(k, String(v));
            });
        }
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/tasks?${params}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const res = await response.json();
        // Backend returns { success, data: Task[] }, convert to { list, total }
        const data = res.data || [];
        return { list: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return { list: [], total: 0 };
    }
};

// 获取任务详情
export const fetchTaskDetail = async (id: string): Promise<MockTask | null> => {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return mockTasks.find(t => t.id === id) || null;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/tasks/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const res = await response.json();
        return res.data || null;
    } catch (error) {
        return null;
    }
};

// 接单
export const claimTask = async (taskId: string, buynoId: string): Promise<{ success: boolean; message: string; orderId?: string }> => {
    // Mock implementation
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 500));
        // Simulate success
        return { success: true, message: '任务领取成功', orderId: 'mock-order-' + Date.now() };
    }

    try {
        const response = await fetch(`${BASE_URL}/tasks/${taskId}/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
            },
            body: JSON.stringify({ buynoId })
        });
        return response.json();
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

