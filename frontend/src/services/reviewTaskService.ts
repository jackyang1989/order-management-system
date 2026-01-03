import { BASE_URL } from '../../apiConfig';

// ========== 追评任务类型定义 ==========

export enum ReviewTaskStatus {
    UNPAID = 0,           // 未支付
    PAID = 1,             // 已支付 (等待管理员审核)
    APPROVED = 2,         // 已审核 (通知买手去追评)
    UPLOADED = 3,         // 已上传 (买手已上传追评截图，等待商家确认)
    COMPLETED = 4,        // 已完成
    CANCELLED = 5,        // 已取消
    BUYER_REJECTED = 6,   // 买手拒接
    REJECTED = 7,         // 已拒绝
}

export const ReviewTaskStatusLabels: Record<ReviewTaskStatus, { text: string; color: string }> = {
    [ReviewTaskStatus.UNPAID]: { text: '待支付', color: '#f59e0b' },
    [ReviewTaskStatus.PAID]: { text: '待审核', color: '#6366f1' },
    [ReviewTaskStatus.APPROVED]: { text: '待追评', color: '#3b82f6' },
    [ReviewTaskStatus.UPLOADED]: { text: '待确认', color: '#8b5cf6' },
    [ReviewTaskStatus.COMPLETED]: { text: '已完成', color: '#10b981' },
    [ReviewTaskStatus.CANCELLED]: { text: '已取消', color: '#6b7280' },
    [ReviewTaskStatus.BUYER_REJECTED]: { text: '买手拒接', color: '#ef4444' },
    [ReviewTaskStatus.REJECTED]: { text: '已拒绝', color: '#dc2626' },
};

export interface ReviewTask {
    id: string;
    merchantId: string;
    userId: string;
    buynoId: string;
    shopId: string;
    taobaoOrderNumber: string;
    taskNumber: string;
    userTaskId: string;
    sellerTaskId: string;
    payPrice: number;
    money: number;
    userMoney: number;
    yjprice: number;
    ydprice: number;
    state: ReviewTaskStatus;
    img: string;
    uploadTime: string;
    confirmTime: string;
    payTime: string;
    examineTime: string;
    remarks: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewTaskPraise {
    id: string;
    reviewTaskId: string;
    goodsId: string;
    type: number;  // 1=文字, 2=图片, 3=视频
    content: string;
    createdAt: string;
}

// ========== 买手端服务 ==========

// 获取买手的追评任务列表
export const fetchUserReviewTasks = async (
    state?: number,
    page: number = 1,
    limit: number = 15
): Promise<{ list: ReviewTask[]; total: number; page: number; limit: number }> => {
    try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        if (state !== undefined) {
            params.append('state', state.toString());
        }

        const response = await fetch(`${BASE_URL}/review-tasks/user/list?${params}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch review tasks');
        const res = await response.json();
        return res.data || { list: [], total: 0, page: 1, limit: 15 };
    } catch (error) {
        console.error('Fetch review tasks error:', error);
        return { list: [], total: 0, page: 1, limit: 15 };
    }
};

// 获取买手待处理的追评任务
export const fetchUserPendingReviewTasks = async (): Promise<{ list: ReviewTask[]; total: number }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/review-tasks/user/pending`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch pending tasks');
        const res = await response.json();
        return res.data || { list: [], total: 0 };
    } catch (error) {
        console.error('Fetch pending tasks error:', error);
        return { list: [], total: 0 };
    }
};

// 获取追评任务详情（含追评内容）
export const fetchReviewTaskDetail = async (id: string): Promise<{
    task: ReviewTask;
    praises: ReviewTaskPraise[];
} | null> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/review-tasks/${id}/detail`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch task detail');
        const res = await response.json();
        return res.success ? res.data : null;
    } catch (error) {
        console.error('Fetch task detail error:', error);
        return null;
    }
};

// 提交追评截图
export const submitReviewTask = async (
    reviewTaskId: string,
    images: string[]
): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/review-tasks/user/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ reviewTaskId, images })
        });
        const res = await response.json();
        return {
            success: res.success,
            message: res.message || (res.success ? '提交成功' : '提交失败')
        };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};

// 拒绝追评任务
export const rejectReviewTask = async (
    reviewTaskId: string,
    reason?: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/review-tasks/user/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ reviewTaskId, reason })
        });
        const res = await response.json();
        return {
            success: res.success,
            message: res.message || (res.success ? '已拒绝' : '操作失败')
        };
    } catch (error) {
        return { success: false, message: '网络错误' };
    }
};
