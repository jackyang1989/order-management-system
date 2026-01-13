import { BASE_URL } from '../../apiConfig';

export type TaskStatus = 'ACTIVE' | 'PENDING' | 'CLOSED' | string;

// Multi-goods item from task_goods table
export interface TaskGoodsItem {
    id: string;
    taskId: string;
    goodsId?: string;
    name: string;
    pcImg?: string;
    link?: string;
    specName?: string;
    specValue?: string;
    price: number;
    num: number;
    totalPrice: number;
}

// Multi-keyword item from task_keywords table
export interface TaskKeywordItem {
    id: string;
    taskId: string;
    taskGoodsId?: string;
    keyword: string;
    terminal: number;
    discount?: string;
    filter?: string;
    sort?: string;
    maxPrice: number;
    minPrice: number;
    province?: string;
}

export interface TaskItem {
    id: string;
    taskNumber?: string;
    title: string;
    shopName: string;
    platform: string;
    taskType?: number;
    price: number;
    commission: number;
    userDivided: number;
    status: TaskStatus;
    progress?: string;
    mainImage?: string;
    keyword?: string;
    taoWord?: string;
    qrCode?: string;
    channelImages?: string;
    url?: string;
    terminal?: number;
    isFreeShipping?: boolean | number;
    isPraise?: boolean;
    praiseType?: string;
    praiseList?: string;
    praiseImgList?: string;
    praiseVideoList?: string;
    isImgPraise?: boolean;
    isVideoPraise?: boolean;
    memo?: string;
    needCompare?: boolean;
    compareKeyword?: string;
    needFavorite?: boolean;
    needFollow?: boolean;
    needContactCS?: boolean;
    needAddCart?: boolean;
    totalBrowseMinutes?: number;
    mainBrowseMinutes?: number;
    subBrowseMinutes?: number;
    isRepay?: boolean;
    isNextDay?: boolean;
    count?: number;
    claimedCount?: number;
    extraReward?: number;
    extraCommission?: number;
    // Multi-goods and multi-keywords from refactored version
    goodsList?: TaskGoodsItem[];
    keywords?: TaskKeywordItem[];
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

const authHeader = (): Record<string, string> => {
    if (typeof localStorage === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeTask = (raw: any): TaskItem => ({
    id: raw?.id,
    taskNumber: raw?.taskNumber,
    title: raw?.title || raw?.taskTitle || '任务',
    shopName: raw?.shopName || raw?.merchantName || '-',
    platform: raw?.platform || raw?.taskType || '-',
    taskType: raw?.taskType,
    price: Number(raw?.goodsPrice || raw?.productPrice || raw?.total_price) || 0,
    commission: Number(raw?.totalCommission || raw?.commission || raw?.user_reward) || 0,
    userDivided: Number(raw?.userDivided || raw?.user_divided) || 0,
    status: raw?.status || 'ACTIVE',
    progress: raw?.progress ? `${parseInt(raw.progress, 10)}%` : undefined,
    mainImage: raw?.mainImage,
    keyword: raw?.keyword,
    taoWord: raw?.taoWord,
    qrCode: raw?.qrCode,
    channelImages: raw?.channelImages,
    url: raw?.url,
    terminal: raw?.terminal,
    isFreeShipping: raw?.isFreeShipping,
    isPraise: raw?.isPraise,
    praiseType: raw?.praiseType,
    praiseList: raw?.praiseList,
    praiseImgList: raw?.praiseImgList,
    praiseVideoList: raw?.praiseVideoList,
    isImgPraise: raw?.isImgPraise,
    isVideoPraise: raw?.isVideoPraise,
    memo: raw?.memo,
    needCompare: raw?.needCompare,
    compareKeyword: raw?.compareKeyword,
    needFavorite: raw?.needFavorite,
    needFollow: raw?.needFollow,
    needContactCS: raw?.needContactCS,
    needAddCart: raw?.needAddCart,
    totalBrowseMinutes: raw?.totalBrowseMinutes,
    mainBrowseMinutes: raw?.mainBrowseMinutes,
    subBrowseMinutes: raw?.subBrowseMinutes,
    isRepay: raw?.isRepay,
    isNextDay: raw?.isNextDay,
    count: raw?.count,
    claimedCount: raw?.claimedCount,
    extraReward: raw?.extraReward || raw?.extraCommission,
    extraCommission: raw?.extraCommission,
    // Multi-goods and multi-keywords from refactored version
    goodsList: Array.isArray(raw?.goodsList) ? raw.goodsList : undefined,
    keywords: Array.isArray(raw?.keywords) ? raw.keywords : undefined,
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
