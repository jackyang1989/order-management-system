'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { 
    PlatformLabels, 
    TerminalLabels, 
    TaskStatusLabels, 
    TerminalType 
} from '@/shared/taskSpec';
import { formatDateTime, formatMoney } from '@/shared/formatters';

interface TaskDetail {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopId: string;
    shopName: string;
    url: string;
    mainImage: string;
    keyword: string;
    taoWord?: string;
    qrCode?: string;
    channelImages?: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    isFreeShipping: number | boolean;
    isPraise: boolean;
    praiseType: string;
    praiseList: string;
    praiseImgList: string;
    praiseVideoList: string;
    isImgPraise: boolean;
    isVideoPraise: boolean;
    isTimingPublish: boolean;
    publishTime?: string;
    isTimingPay: boolean;
    timingTime?: string;
    isCycleTime: boolean;
    cycleTime?: number;
    cycle?: number;
    unionInterval?: number;
    isRepay: boolean;
    isNextDay: boolean;
    terminal: number;
    addReward: number;
    extraCommission?: number;
    totalDeposit: number;
    totalCommission: number;
    baseServiceFee: number;
    praiseFee: number;
    imgPraiseFee: number;
    videoPraiseFee: number;
    shippingFee: number;
    margin: number;
    memo?: string;
    needCompare: boolean;
    compareKeyword?: string;
    compareCount?: number;
    needFavorite: boolean;
    needFollow: boolean;
    needContactCS: boolean;
    needAddCart: boolean;
    totalBrowseMinutes: number;
    mainBrowseMinutes: number;
    subBrowseMinutes: number;
    isPasswordEnabled?: boolean;
    checkPassword?: string;
    createdAt: string;
    updatedAt: string;
    // 多商品列表
    goodsList?: TaskGoodsItem[];
    // 多关键词列表
    keywords?: TaskKeywordItem[];
    // 新增字段
    fastRefund?: boolean;
    weight?: number;
    contactCSContent?: string;
}

// 任务商品项
interface TaskGoodsItem {
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
    orderSpecs?: string; // JSON string of { specName, specValue, quantity }[]
    verifyCode?: string;
}

// 任务关键词项
interface TaskKeywordItem {
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

interface OrderItem {
    id: string;
    buynoAccount: string;
    status: string;
    productPrice: number;
    commission: number;
    createdAt: string;
    completedAt?: string;
}

const OrderStatusMap: Record<string, { text: string; color: 'blue' | 'amber' | 'green' | 'red' | 'slate' }> = {
    PENDING: { text: '进行入', color: 'blue' },
    SUBMITTED: { text: '待审核', color: 'amber' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已驳回', color: 'red' },
    COMPLETED: { text: '已完成', color: 'slate' }
};

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.id as string;
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [praiseModal, setPraiseModal] = useState<'text' | 'image' | 'video' | null>(null);

    useEffect(() => {
        if (taskId) loadTaskDetail();
    }, [taskId]);

    const loadTaskDetail = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }
        setLoading(true);
        try {
            const taskRes = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const taskJson = await taskRes.json();
            if (taskJson.success) setTask(taskJson.data);
            else {
                alert('任务不存在或无权访问');
                router.push('/merchant/tasks');
                return;
            }
            const ordersRes = await fetch(`${BASE_URL}/orders/task/${taskId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const ordersJson = await ordersRes.json();
            if (ordersJson.success) setOrders(ordersJson.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        const token = localStorage.getItem('merchantToken');
        setCancelling(true);
        setShowCancelModal(false);
        try {
            const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) {
                alert('任务已取消，资金已返还');
                loadTaskDetail();
            } else {
                alert(json.message || '取消失败');
            }
        } catch {
            alert('网络错误');
        } finally {
            setCancelling(false);
        }
    };

    // 解析好评内容
    const parsePraiseList = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try {
            return JSON.parse(jsonStr) || [];
        } catch {
            return [];
        }
    };

    // 解析好评图片 (二维数组)
    const parsePraiseImgList = (jsonStr: string | undefined): string[][] => {
        if (!jsonStr) return [];
        try {
            return JSON.parse(jsonStr) || [];
        } catch {
            return [];
        }
    };

    // 解析通道图片
    const parseChannelImages = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try {
            return JSON.parse(jsonStr) || [];
        } catch {
            return [];
        }
    };

    // 判断进店方式
    const getEntryMethod = (t: TaskDetail): { type: string; content: React.ReactNode } => {
        if (t.qrCode) {
            return { type: '二维码', content: <img src={t.qrCode} alt="二维码" className="h-24 w-24 rounded border" /> };
        }
        if (t.taoWord) {
            return { type: '淘口令', content: <code className="rounded bg-amber-50 px-2 py-1 text-sm text-amber-700">{t.taoWord}</code> };
        }
        const channelImgs = parseChannelImages(t.channelImages);
        if (channelImgs.length > 0) {
            return {
                type: '通道',
                content: (
                    <div className="flex flex-wrap gap-2">
                        {channelImgs.map((img, i) => (
                            <img key={i} src={img} alt={`通道图${i + 1}`} className="h-20 w-20 rounded border object-cover" />
                        ))}
                    </div>
                )
            };
        }
        return { type: '关键词', content: <span className="font-medium text-primary-600">{t.keyword}</span> };
    };

    if (loading) return <div className="flex h-[400px] items-center justify-center text-[#6b7280]">加载中...</div>;

    if (!task) {
        return (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-4 text-5xl">📋</div>
                <div className="mb-5 text-[#6b7280]">任务不存在</div>
                <Button onClick={() => router.push('/merchant/tasks')}>返回列表</Button>
            </div>
        );
    }

    const statusStyle = {
        text: TaskStatusLabels[task.status] || '未知',
        color: (task.status === 0 ? 'amber' : task.status === 1 ? 'green' : task.status === 2 ? 'blue' : task.status === 3 ? 'red' : 'slate') as 'amber' | 'green' | 'blue' | 'red' | 'slate'
    };
    const progress = task.count > 0 ? (task.completedCount / task.count) * 100 : 0;
    const pct = Math.max(0, Math.min(100, Math.round(progress / 5) * 5)) as
        | 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50
        | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 100;
    const progressWidthClass = {
        0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]', 25: 'w-[25%]',
        30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]', 50: 'w-[50%]',
        55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]', 75: 'w-[75%]',
        80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full'
    } as const;
    const statCards = [
        { value: task.count, label: '总任务数', color: 'text-primary-600' },
        { value: task.claimedCount, label: '已领取', color: 'text-warning-500' },
        { value: task.completedCount, label: '已完成', color: 'text-success-600' },
        { value: task.count - (task.claimedCount || 0), label: '剩余可接', color: 'text-[#6b7280]' }
    ];
    const entryMethod = getEntryMethod(task);
    const praiseTexts = parsePraiseList(task.praiseList);
    const praiseImgs = parsePraiseImgList(task.praiseImgList);
    const praiseVideos = parsePraiseList(task.praiseVideoList);

    // 浏览行为配置
    const browseActions = [
        { key: 'needCompare', label: '货比', enabled: task.needCompare, extra: task.needCompare ? `${task.compareCount || 3}家商品` : undefined },
        { key: 'needFavorite', label: '收藏商品', enabled: task.needFavorite },
        { key: 'needFollow', label: '关注店铺', enabled: task.needFollow },
        { key: 'needAddCart', label: '加入购物车', enabled: task.needAddCart },
        { key: 'needContactCS', label: '联系客服', enabled: task.needContactCS, extra: task.contactCSContent }
    ];

    // 增值服务配置
    const valueAddedServices = [
        { label: '定时发布', enabled: task.isTimingPublish, value: task.publishTime ? formatDateTime(task.publishTime) : '' },
        { label: '定时付款', enabled: task.isTimingPay, value: task.timingTime ? formatDateTime(task.timingTime) : '' },
        { label: '回购任务', enabled: task.isRepay },
        { label: '隔天任务', enabled: task.isNextDay },
        { label: '延长周期', enabled: (task.cycle || 0) > 0, value: task.cycle ? `${task.cycle}天` : '' },
        { label: '接单间隔', enabled: (task.unionInterval || 0) > 0, value: task.unionInterval ? `${task.unionInterval}分钟` : '' },
        { label: '快速返款', enabled: !!task.fastRefund },
        { label: '包裹重量', enabled: (task.weight || 0) > 0, value: `${task.weight}kg` }
    ];

    const isFreeShipping = task.isFreeShipping === 1 || task.isFreeShipping === true;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/merchant/tasks')} className="flex h-9 items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-4 text-[13px] text-primary-500 hover:bg-[#eff6ff]">
                        ← 返回列表
                    </button>
                    <h1 className="text-2xl font-bold">任务详情</h1>
                </div>
                <Badge variant="soft" color={statusStyle.color} className="px-4 py-1.5 text-sm font-medium">{statusStyle.text}</Badge>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="col-span-2 space-y-6">
                    {/* Product Info - 多商品列表 */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">
                                商品信息
                                {(task.goodsList?.length || 0) > 1 && (
                                    <span className="ml-2 text-sm font-normal text-[#6b7280]">
                                        (共{task.goodsList?.length}个商品)
                                    </span>
                                )}
                            </h2>
                            {/* 如果有多商品列表，显示列表；否则显示单商品 */}
                            {task.goodsList && task.goodsList.length > 0 ? (
                                <div className="space-y-4">
                                    {task.goodsList.map((goods, index) => (
                                        <div key={goods.id} className={cn(
                                            "flex gap-4 rounded-lg p-3",
                                            index === 0 ? "border-2 border-primary-200 bg-primary-50" : "border border-[#e5e7eb] bg-slate-50"
                                        )}>
                                            {goods.pcImg && (
                                                <img src={goods.pcImg} alt="" className="h-[80px] w-[80px] rounded-md border border-[#e5e7eb] object-cover" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <Badge variant="soft" color={index === 0 ? "blue" : "slate"} className="text-xs">
                                                        {index === 0 ? '主商品' : `副商品${index}`}
                                                    </Badge>
                                                    {goods.specName && goods.specValue && (
                                                        <span className="text-xs text-[#6b7280]">
                                                            {goods.specName}: {goods.specValue}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mb-1 text-sm font-medium line-clamp-2">{goods.name}</div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="font-bold text-danger-400">¥{Number(goods.price).toFixed(2)}</span>
                                                    <span className="text-[#6b7280]">×{goods.num}</span>
                                                    <span className="text-[#6b7280]">小计: ¥{Number(goods.totalPrice).toFixed(2)}</span>
                                                </div>
                                                {goods.link && (
                                                    <a href={goods.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500">
                                                        查看链接 →
                                                    </a>
                                                )}
                                                {/* 下单规格显示 */}
                                                {goods.orderSpecs && (() => {
                                                    try {
                                                        const specs = JSON.parse(goods.orderSpecs);
                                                        if (Array.isArray(specs) && specs.length > 0) {
                                                            return (
                                                                <div className="mt-2 space-y-1">
                                                                    <div className="text-xs font-medium text-[#6b7280]">下单规格:</div>
                                                                    {specs.map((spec: { specName: string; specValue: string; quantity: number }, idx: number) => (
                                                                        <div key={idx} className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1 text-xs">
                                                                            <span className="text-[#374151]">{spec.specName}: {spec.specValue}</span>
                                                                            <span className="text-[#6b7280]">× {spec.quantity}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    } catch {
                                                        return null;
                                                    }
                                                })()}
                                                {/* 核对口令显示 */}
                                                {goods.verifyCode && (
                                                    <div className="mt-1 text-xs text-[#6b7280]">
                                                        核对口令: <span className="font-medium text-primary-600">{goods.verifyCode}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* 兼容旧版单商品显示 */
                                <div className="flex gap-4">
                                    {task.mainImage && <img src={task.mainImage} alt="" className="h-[120px] w-[120px] rounded-md border border-[#e5e7eb] object-cover" />}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 text-base font-medium">{task.title}</div>
                                        <div className="mb-2 flex items-center gap-2 text-sm text-[#6b7280]">
                                            <Badge variant="soft" color="blue" className="text-xs">{PlatformLabels[task.taskType] || '未知平台'}</Badge>
                                            {task.shopName}
                                        </div>
                                        <div className="mb-2 text-xl font-bold text-danger-400">¥{formatMoney(task.goodsPrice)}</div>
                                        {task.url && <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary-500">查看商品链接 →</a>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Entry Method & Keywords 进店方式与关键词 */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">进店方式</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <Badge variant="soft" color="blue">{entryMethod.type}</Badge>
                                    <div className="flex-1">{entryMethod.content}</div>
                                </div>

                                {/* 多关键词列表 */}
                                {task.keywords && task.keywords.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="text-sm font-medium text-[#3b4559]">关键词配置 ({task.keywords.length}个)</div>
                                        <div className="space-y-2">
                                            {task.keywords.map((kw, index) => (
                                                <div key={kw.id} className="rounded-lg border border-[#e5e7eb] bg-slate-50 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="soft" color="blue" className="text-xs">
                                                                关键词{index + 1}
                                                            </Badge>
                                                            <span className="font-medium text-primary-600">{kw.keyword}</span>
                                                        </div>
                                                        <Badge variant="soft" color="slate" className="text-xs">
                                                            {kw.terminal === 1 ? '电脑端' : '手机端'}
                                                        </Badge>
                                                    </div>
                                                    {/* 筛选设置 */}
                                                    {(kw.sort || kw.province || kw.minPrice > 0 || kw.maxPrice > 0) && (
                                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b7280]">
                                                            {kw.sort && <span className="rounded bg-white px-2 py-0.5">排序: {kw.sort}</span>}
                                                            {kw.province && <span className="rounded bg-white px-2 py-0.5">发货地: {kw.province}</span>}
                                                            {(kw.minPrice > 0 || kw.maxPrice > 0) && (
                                                                <span className="rounded bg-white px-2 py-0.5">
                                                                    价格: ¥{kw.minPrice || 0} - ¥{kw.maxPrice || '不限'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* 兼容旧版单关键词 */
                                    task.keyword && entryMethod.type === '关键词' && (
                                        <div className="text-sm text-[#6b7280]">
                                            搜索关键词: <span className="font-medium text-primary-600">{task.keyword}</span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Browse Requirements 浏览要求 */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">浏览要求</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {/* 浏览行为 */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-[#3b4559]">浏览行为</div>
                                    <div className="flex flex-wrap gap-2">
                                        {browseActions.map(action => (
                                            <Badge
                                                key={action.key}
                                                variant="soft"
                                                color={action.enabled ? 'green' : 'slate'}
                                            >
                                                {action.label}
                                                {action.enabled && action.extra && `: ${action.extra}`}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                {/* 浏览时长 */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-[#3b4559]">浏览时长</div>
                                    <div className={`grid gap-2 text-center ${task.hasSubProduct !== false ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                        <div className="rounded bg-slate-50 p-2">
                                            <div className="text-lg font-bold text-primary-600">{task.totalBrowseMinutes || 15}</div>
                                            <div className="text-xs text-[#6b7280]">总计/分钟</div>
                                        </div>
                                        <div className="rounded bg-slate-50 p-2">
                                            <div className="text-lg font-bold text-warning-500">{task.compareBrowseMinutes || 3}</div>
                                            <div className="text-xs text-[#6b7280]">货比/分钟</div>
                                        </div>
                                        <div className="rounded bg-slate-50 p-2">
                                            <div className="text-lg font-bold text-success-600">{task.mainBrowseMinutes || 8}</div>
                                            <div className="text-xs text-[#6b7280]">主品/分钟</div>
                                        </div>
                                        {task.hasSubProduct !== false && (
                                            <div className="rounded bg-slate-50 p-2">
                                                <div className="text-lg font-bold text-slate-500">{task.subBrowseMinutes || 2}</div>
                                                <div className="text-xs text-[#6b7280]">副品/分钟</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Value Added Services 增值服务 */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">增值服务</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {/* 结算方式 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="text-xs text-[#6b7280]">结算方式</div>
                                    <div className="mt-1 text-sm font-medium text-[#3b4559]">{TerminalLabels[task.terminal as TerminalType] || '未知'}</div>
                                </div>
                                {/* 包邮 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="text-xs text-[#6b7280]">运费</div>
                                    <Badge variant="soft" color={isFreeShipping ? 'green' : 'amber'} className="mt-1">
                                        {isFreeShipping ? '包邮' : '非包邮'}
                                    </Badge>
                                </div>
                                {/* 加赏 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="text-xs text-[#6b7280]">额外加赏</div>
                                    <div className="mt-1 text-sm font-medium text-warning-500">
                                        {(task.addReward || task.extraCommission || 0) > 0 ? `+¥${task.addReward || task.extraCommission}/单` : '无'}
                                    </div>
                                </div>
                                {/* 增值服务项 */}
                                {valueAddedServices.filter(s => s.enabled).map((service, i) => (
                                    <div key={i} className="rounded-md border border-green-200 bg-green-50 p-3">
                                        <div className="text-xs text-green-600">{service.label}</div>
                                        {service.value && <div className="mt-1 text-sm font-medium text-green-700">{service.value}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Praise Settings 好评设置 */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">好评设置</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {/* 文字好评 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[#6b7280]">文字好评</div>
                                        {task.isPraise && praiseTexts.length > 0 && (
                                            <button onClick={() => setPraiseModal('text')} className="text-xs text-primary-500 hover:underline">查看</button>
                                        )}
                                    </div>
                                    <Badge variant="soft" color={task.isPraise ? 'green' : 'slate'} className="mt-1">
                                        {task.isPraise ? `${praiseTexts.length}条` : '未设置'}
                                    </Badge>
                                </div>
                                {/* 图片好评 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[#6b7280]">图片好评</div>
                                        {task.isImgPraise && praiseImgs.length > 0 && (
                                            <button onClick={() => setPraiseModal('image')} className="text-xs text-primary-500 hover:underline">查看</button>
                                        )}
                                    </div>
                                    <Badge variant="soft" color={task.isImgPraise ? 'green' : 'slate'} className="mt-1">
                                        {task.isImgPraise ? `${praiseImgs.length}组` : '未设置'}
                                    </Badge>
                                </div>
                                {/* 视频好评 */}
                                <div className="rounded-md border border-[#e5e7eb] p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-[#6b7280]">视频好评</div>
                                        {task.isVideoPraise && praiseVideos.length > 0 && (
                                            <button onClick={() => setPraiseModal('video')} className="text-xs text-primary-500 hover:underline">查看</button>
                                        )}
                                    </div>
                                    <Badge variant="soft" color={task.isVideoPraise ? 'green' : 'slate'} className="mt-1">
                                        {task.isVideoPraise ? `${praiseVideos.length}个` : '未设置'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Merchant Memo 商家备注 */}
                    {task.memo && (
                        <Card className="bg-white" noPadding>
                            <div className="px-6 py-5">
                                <h2 className="mb-3 text-base font-semibold">下单提示/商家备注</h2>
                                <div className="rounded bg-amber-50 p-4 text-sm text-amber-800 whitespace-pre-wrap">{task.memo}</div>
                            </div>
                        </Card>
                    )}

                    {/* Task Progress */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">任务进度</h2>
                            <div className="mb-5 grid grid-cols-4 gap-4">
                                {statCards.map((stat, i) => (
                                    <div key={i} className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center">
                                        <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                                        <div className="mt-1 text-xs text-[#6b7280]">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="mb-1.5 flex justify-between text-[13px] text-[#6b7280]">
                                    <span>完成进度</span>
                                    <span>{progress.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                                    <span className={cn('block h-full rounded-full bg-primary-500 transition-all', progressWidthClass[pct])} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Orders List */}
                    <Card className="overflow-hidden bg-white" noPadding>
                        <div className="border-b border-[#e5e7eb] px-6 py-4">
                            <h2 className="text-base font-semibold">关联订单 ({orders.length})</h2>
                        </div>
                        {orders.length === 0 ? (
                            <div className="flex min-h-[180px] items-center justify-center text-[#6b7280]">暂无订单</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-[600px] w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                            <th className="px-4 py-3 text-left text-[13px] text-[#6b7280]">买号</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-[#6b7280]">金额</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-[#6b7280]">状态</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-[#6b7280]">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const orderStatus = OrderStatusMap[order.status] || { text: order.status, color: 'slate' as const };
                                            return (
                                                <tr key={order.id} className="border-b border-[#e5e7eb]">
                                                    <td className="px-4 py-3.5 text-sm">{order.buynoAccount}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="font-medium">¥{Number(order.productPrice).toFixed(2)}</div>
                                                        <div className="text-xs text-success-600">佣金 ¥{Number(order.commission).toFixed(2)}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5"><Badge variant="soft" color={orderStatus.color}>{orderStatus.text}</Badge></td>
                                                    <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Task Info */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">任务信息</h2>
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between"><span className="text-[#6b7280]">任务编号</span><span className="font-mono text-primary-600">{task.taskNumber}</span></div>
                                <div className="flex justify-between"><span className="text-[#6b7280]">创建时间</span><span>{formatDateTime(task.createdAt)}</span></div>
                                <div className="flex justify-between"><span className="text-[#6b7280]">结算方式</span><span>{TerminalLabels[task.terminal] || '未知'}</span></div>
                                <div className="flex justify-between"><span className="text-[#6b7280]">包邮</span><span>{isFreeShipping ? '是' : '否'}</span></div>
                                {task.isPasswordEnabled && task.checkPassword && (
                                    <div className="flex justify-between"><span className="text-[#6b7280]">验证口令</span><span className="font-medium text-danger-400">{task.checkPassword}</span></div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Fee Breakdown */}
                    <Card className="bg-white" noPadding>
                        <div className="px-6 py-5">
                            <h2 className="mb-5 text-base font-semibold">费用明细</h2>
                            <div className="grid gap-2.5 text-sm">
                                <div className="flex justify-between"><span className="text-[#6b7280]">商品本金 × {task.count}</span><span>¥{formatMoney(Number(task.goodsPrice) * task.count)}</span></div>
                                <div className="flex justify-between"><span className="text-[#6b7280]">基础服务费</span><span>¥{formatMoney(Number(task.baseServiceFee || 0) * task.count)}</span></div>
                                {Number(task.praiseFee) > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">文字好评费</span><span>¥{formatMoney(Number(task.praiseFee) * task.count)}</span></div>}
                                {Number(task.imgPraiseFee) > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">图片好评费</span><span>¥{formatMoney(Number(task.imgPraiseFee) * task.count)}</span></div>}
                                {Number(task.videoPraiseFee) > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">视频好评费</span><span>¥{formatMoney(Number(task.videoPraiseFee) * task.count)}</span></div>}
                                {Number(task.shippingFee) > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">邮费</span><span>¥{formatMoney(task.shippingFee)}</span></div>}
                                {Number(task.margin) > 0 && <div className="flex justify-between"><span className="text-[#6b7280]">保证金</span><span>¥{formatMoney(task.margin)}</span></div>}
                                <div className="mt-1.5 border-t border-[#e5e7eb] pt-2.5">
                                    <div className="flex justify-between font-semibold"><span>押金总计</span><span className="text-primary-600">¥{formatMoney(task.totalDeposit || 0)}</span></div>
                                    <div className="mt-1.5 flex justify-between font-semibold"><span>佣金总计</span><span className="text-danger-400">¥{formatMoney(task.totalCommission || 0)}</span></div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    {task.status === 1 && task.claimedCount === 0 && (
                        <button
                            onClick={handleCancelClick}
                            disabled={cancelling}
                            className={cn('h-9 w-full rounded-md border border-danger-400 bg-white px-3 text-danger-400 hover:bg-[#fef2f2]', cancelling && 'cursor-not-allowed opacity-70')}
                        >
                            {cancelling ? '取消中...' : '取消任务'}
                        </button>
                    )}
                </div>
            </div>

            {/* Praise Detail Modal */}
            <Modal
                title={praiseModal === 'text' ? '文字好评内容' : praiseModal === 'image' ? '图片好评' : '视频好评'}
                open={!!praiseModal}
                onClose={() => setPraiseModal(null)}
                className="max-w-2xl"
            >
                <div className="max-h-[60vh] overflow-y-auto">
                    {praiseModal === 'text' && (
                        <div className="space-y-3">
                            {praiseTexts.map((txt, i) => (
                                <div key={i} className="rounded border border-slate-200 bg-slate-50 p-3">
                                    <div className="mb-1 text-xs text-slate-400">第 {i + 1} 组</div>
                                    <div className="text-sm text-slate-700">{txt}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {praiseModal === 'image' && (
                        <div className="space-y-4">
                            {praiseImgs.map((group, i) => (
                                <div key={i} className="rounded border border-slate-200 p-3">
                                    <div className="mb-2 text-xs text-slate-400">第 {i + 1} 组</div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.map((img, j) => (
                                            <img key={j} src={img} alt="" className="h-24 w-24 rounded border object-cover" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {praiseModal === 'video' && (
                        <div className="space-y-4">
                            {praiseVideos.map((video, i) => (
                                <div key={i} className="rounded border border-slate-200 p-3">
                                    <div className="mb-2 text-xs text-slate-400">第 {i + 1} 个视频</div>
                                    <video src={video} controls className="max-h-64 w-full rounded" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Cancel Task Confirmation Modal */}
            <Modal
                title="取消任务"
                open={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div className="text-sm text-slate-600">
                        <p className="mb-2">确定要取消此任务吗？</p>
                        <p className="text-xs text-slate-500">已冻结的资金将返还到您的账户。</p>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowCancelModal(false)}
                            disabled={cancelling}
                        >
                            取消
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleCancelConfirm}
                            disabled={cancelling}
                        >
                            {cancelling ? '取消中...' : '确认取消'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
