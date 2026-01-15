'use client';

import { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { BASE_URL } from '../../../../apiConfig';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    platform: string;
    productName: string;
    productPrice: number;
    commission: number;
    userDivided: number;
    silverPrepay: number;
    buynoAccount: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    // 发货相关
    deliveryCompany?: string;
    deliveryNumber?: string;
    deliveredAt?: string;
    // 返款相关
    returnedAt?: string;
    returnAmount?: number;
    stepData: {
        step: number;
        title: string;
        screenshot?: string;
        submitted: boolean;
    }[];
    // Task关联数据
    task?: {
        taskNumber?: string;
        shopName?: string;
        // 浏览要求
        needCompare?: boolean;
        compareCount?: number;
        needFavorite?: boolean;
        needFollow?: boolean;
        needAddCart?: boolean;
        needContactCS?: boolean;
        contactCSContent?: string;
        totalBrowseMinutes?: number;
        compareBrowseMinutes?: number;
        mainBrowseMinutes?: number;
        subBrowseMinutes?: number;
        hasSubProduct?: boolean;
        // 增值服务
        weight?: number;
        fastRefund?: boolean;
        extraReward?: number;
        addReward?: number;
        isPasswordEnabled?: boolean;
        checkPassword?: string;
        isFreeShipping?: boolean;
        isTimingPublish?: boolean;
        publishTime?: string;
        isTimingPay?: boolean;
        timingPayTime?: string;
        isRepay?: boolean;
        isNextDay?: boolean;
        isCycleTime?: boolean;
        cycleTime?: number;
        // 好评相关 (JSON strings from backend)
        isPraise?: boolean;
        praiseList?: string;
        isImgPraise?: boolean;
        praiseImgList?: string;
        isVideoPraise?: boolean;
        praiseVideoList?: string;
        // 下单提示
        memo?: string;
        // 费用明细
        baseServiceFee?: number;
        praiseFee?: number;
        imgPraiseFee?: number;
        videoPraiseFee?: number;
        timingPublishFee?: number;
        timingPayFee?: number;
        nextDayFee?: number;
        goodsMoreFee?: number;
        shippingFee?: number;
        margin?: number;
        goodsPrice?: number;
        totalDeposit?: number;
        totalCommission?: number;
    };
}

interface Stats {
    pendingReview: number;
    approved: number;
    rejected: number;
    completed: number;
    pendingShip: number;     // 待发货
    pendingReceive: number;  // 待收货
    pendingReturn: number;   // 待返款
    total: number;
}

const statusConfig: Record<string, { text: string; className: string }> = {
    PENDING: { text: '进行中', className: 'bg-primary-50 text-primary-600' },
    SUBMITTED: { text: '待审核', className: 'bg-warning-50 text-warning-600' },
    APPROVED: { text: '已通过', className: 'bg-success-50 text-success-600' },
    REJECTED: { text: '已驳回', className: 'bg-danger-50 text-danger-500' },
    PENDING_SHIP: { text: '待发货', className: 'bg-orange-50 text-orange-600' },
    SHIPPED: { text: '待收货', className: 'bg-blue-50 text-blue-600' },
    RECEIVED: { text: '待返款', className: 'bg-purple-50 text-purple-600' },
    COMPLETED: { text: '已完成', className: 'bg-[#f9fafb] text-[#6b7280]' },
};

export default function MerchantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats>({ pendingReview: 0, approved: 0, rejected: 0, completed: 0, pendingShip: 0, pendingReceive: 0, pendingReturn: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('SUBMITTED');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [reviewing, setReviewing] = useState(false);
    // 发货相关
    const [showShipModal, setShowShipModal] = useState(false);
    const [shipOrderId, setShipOrderId] = useState<string>('');
    const [deliveryCompany, setDeliveryCompany] = useState('');
    const [deliveryNumber, setDeliveryNumber] = useState('');
    const [shipping, setShipping] = useState(false);
    // 返款相关
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnOrderId, setReturnOrderId] = useState<string>('');
    const [returnAmount, setReturnAmount] = useState<number>(0);
    const [returning, setReturning] = useState(false);

    // 解析JSON字段的辅助函数
    const parsePraiseList = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr) || []; } catch { return []; }
    };

    const parsePraiseImgList = (jsonStr: string | undefined): string[][] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr) || []; } catch { return []; }
    };

    const parsePraiseVideoList = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr) || []; } catch { return []; }
    };

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        setLoading(true);
        try {
            // Load orders
            const ordersRes = await fetch(`${BASE_URL}/orders/merchant/list?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ordersJson = await ordersRes.json();
            if (ordersJson.success) {
                setOrders(ordersJson.data);
            }

            // Load stats
            const statsRes = await fetch(`${BASE_URL}/orders/merchant/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsJson = await statsRes.json();
            if (statsJson.success) {
                setStats(statsJson.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (orderId: string, approved: boolean, reason?: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        setReviewing(true);
        try {
            const res = await fetch(`${BASE_URL}/orders/${orderId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved, rejectReason: reason })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(approved ? '审核通过' : '已驳回');
                setSelectedOrder(null);
                loadData();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setReviewing(false);
        }
    };

    // 发货处理
    const openShipModal = (orderId: string) => {
        setShipOrderId(orderId);
        setDeliveryCompany('');
        setDeliveryNumber('');
        setShowShipModal(true);
    };

    const handleShip = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !shipOrderId) return;
        if (!deliveryCompany || !deliveryNumber) {
            toastError('请填写快递公司和快递单号');
            return;
        }

        setShipping(true);
        try {
            const res = await fetch(`${BASE_URL}/orders/${shipOrderId}/ship`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ delivery: deliveryCompany, deliveryNum: deliveryNumber })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('发货成功');
                setShowShipModal(false);
                setShipOrderId('');
                loadData();
            } else {
                toastError(json.message || '发货失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setShipping(false);
        }
    };

    // 返款处理
    const openReturnModal = (order: Order) => {
        setReturnOrderId(order.id);
        setReturnAmount(Number(order.productPrice) + Number(order.commission));
        setShowReturnModal(true);
    };

    const handleReturn = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !returnOrderId) return;
        if (returnAmount <= 0) {
            toastError('返款金额必须大于0');
            return;
        }

        setReturning(true);
        try {
            const res = await fetch(`${BASE_URL}/orders/${returnOrderId}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: returnAmount })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('返款成功');
                setShowReturnModal(false);
                setReturnOrderId('');
                loadData();
            } else {
                toastError(json.message || '返款失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setReturning(false);
        }
    };

    // 常用快递公司
    const deliveryCompanies = ['顺丰速运', '圆通速递', '中通快递', '韵达快递', '申通快递', '邮政EMS', '京东物流', '极兔速递'];

    const statCards = [
        { label: '待审核', value: stats.pendingReview, colorClass: 'text-warning-500', filterKey: 'SUBMITTED' },
        { label: '待发货', value: stats.pendingShip, colorClass: 'text-orange-500', filterKey: 'PENDING_SHIP' },
        { label: '待收货', value: stats.pendingReceive, colorClass: 'text-blue-500', filterKey: 'SHIPPED' },
        { label: '待返款', value: stats.pendingReturn, colorClass: 'text-purple-500', filterKey: 'RECEIVED' },
        { label: '已完成', value: stats.completed, colorClass: 'text-success-600', filterKey: 'COMPLETED' },
        { label: '总订单', value: stats.total, colorClass: 'text-[#6b7280]', filterKey: '' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statCards.map((stat, idx) => (
                    <button
                        key={idx}
                        onClick={() => stat.filterKey && setFilter(stat.filterKey)}
                        disabled={!stat.filterKey}
                        className={cn(
                            'group relative overflow-hidden rounded-[24px] bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)]',
                            filter === stat.filterKey
                                ? 'shadow-[0_4px_12px_rgba(59,130,246,0.1)] ring-2 ring-primary-500 ring-offset-2'
                                : 'shadow-[0_2px_10px_rgba(0,0,0,0.02)]',
                            !stat.filterKey && 'cursor-default'
                        )}
                    >
                        <div className={cn('text-3xl font-black tracking-tight', stat.colorClass)}>{stat.value}</div>
                        <div className="mt-1 text-[11px] font-bold uppercase text-slate-400">{stat.label}</div>
                        {filter === stat.filterKey && (
                            <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-primary-500/10" />
                        )}
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['SUBMITTED', 'PENDING_SHIP', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={cn(
                            'h-[40px] whitespace-nowrap rounded-full px-5 text-[13px] font-bold transition-all',
                            filter === status
                                ? 'bg-primary-600 text-white shadow-none'
                                : 'bg-white text-slate-500 hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                        )}
                    >
                        {statusConfig[status]?.text || status}
                    </button>
                ))}
            </div>

            {/* Orders Table - Card Style */}
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                    <div className="flex min-h-[400px] items-center justify-center text-slate-400 font-medium">加载中...</div>
                ) : orders.length === 0 ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                        <div className="mb-3 text-4xl opacity-50">📂</div>
                        <div className="text-[14px] font-medium text-slate-400">暂无订单数据</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">任务</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">买号</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">金额</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">提交时间</th>
                                    <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        className={cn(
                                            "group border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                                            index === orders.length - 1 && "border-0"
                                        )}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900">{order.taskTitle}</div>
                                            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
                                                <span>{order.platform}</span>
                                                {order.task?.taskNumber && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                        <span>#{order.task.taskNumber}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-slate-500">{order.buynoAccount}</td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900">¥{Number(order.productPrice).toFixed(2)}</div>
                                            <div className="mt-1 text-xs font-bold text-emerald-500">
                                                佣金 ¥{Number(order.commission).toFixed(2)}
                                                {order.userDivided > 0 && ` (分成 ¥${Number(order.userDivided).toFixed(2)})`}
                                            </div>
                                            {order.silverPrepay > 0 && (
                                                <div className="mt-1 text-xs font-medium text-amber-500">
                                                    押金 {order.silverPrepay} 银锭
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold', statusConfig[order.status]?.className)}>
                                                {statusConfig[order.status]?.text || order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-slate-400">
                                            {new Date(order.completedAt || order.createdAt).toLocaleString('zh-CN')}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {order.status === 'SUBMITTED' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 rounded-[12px] bg-primary-600 px-4 text-xs font-bold text-white shadow-none hover:bg-primary-700"
                                                        onClick={() => setSelectedOrder(order)}
                                                    >
                                                        审核
                                                    </Button>
                                                )}
                                                {order.status === 'PENDING_SHIP' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 rounded-[12px] bg-orange-500 px-4 text-xs font-bold text-white shadow-none hover:bg-orange-600"
                                                        onClick={() => openShipModal(order.id)}
                                                    >
                                                        发货
                                                    </Button>
                                                )}
                                                {order.status === 'RECEIVED' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 rounded-[12px] bg-purple-500 px-4 text-xs font-bold text-white shadow-none hover:bg-purple-600"
                                                        onClick={() => openReturnModal(order)}
                                                    >
                                                        返款
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-8 rounded-[12px] border-none bg-slate-100 px-4 text-xs font-bold text-slate-600 shadow-none hover:bg-slate-200"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    查看
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <Modal
                open={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`订单详情 - ${selectedOrder?.status === 'SUBMITTED' ? '待审核' : statusConfig[selectedOrder?.status || '']?.text || ''}`}
                className="max-w-2xl rounded-[32px]"
            >
                {selectedOrder && (() => {
                    // 从task对象读取字段
                    const task = selectedOrder.task || {};
                    const praiseTexts = parsePraiseList(task.praiseList);
                    const praiseImages = parsePraiseImgList(task.praiseImgList);
                    const praiseVideos = parsePraiseVideoList(task.praiseVideoList);

                    return (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4 rounded-[20px] bg-slate-50 p-5 text-sm">
                            <div><span className="font-bold text-slate-400">任务：</span><span className="font-medium text-slate-700">{selectedOrder.taskTitle}</span></div>
                            <div><span className="font-bold text-slate-400">平台：</span><span className="font-medium text-slate-700">{selectedOrder.platform}</span></div>
                            <div><span className="font-bold text-slate-400">买号：</span><span className="font-medium text-slate-700">{selectedOrder.buynoAccount}</span></div>
                            <div><span className="font-bold text-slate-400">金额：</span><span className="font-bold text-slate-900">¥{Number(selectedOrder.productPrice).toFixed(2)}</span></div>
                        </div>

                        {/* Step Screenshots */}
                        <div>
                            <h3 className="mb-4 text-sm font-bold text-slate-900">提交凭证</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {selectedOrder.stepData.filter(s => s.submitted).map(step => (
                                    <div key={step.step} className="rounded-[16px] border border-slate-100 p-3 bg-white hover:shadow-sm transition-shadow">
                                        <div className="mb-2 text-xs font-bold text-slate-400">{step.title}</div>
                                        {step.screenshot ? (
                                            <div className="overflow-hidden rounded-[12px]">
                                                <img
                                                    src={step.screenshot.startsWith('http') ? step.screenshot : `${BASE_URL}${step.screenshot}`}
                                                    alt={step.title}
                                                    className="w-full cursor-pointer transition-transform hover:scale-110"
                                                    onClick={() => window.open(step.screenshot, '_blank')}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-20 items-center justify-center rounded-[12px] bg-slate-50 text-xs font-medium text-slate-400">
                                                无截图
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Browse Requirements 浏览要求 */}
                        {(task.needCompare || task.needFavorite || task.needFollow || task.needAddCart || task.needContactCS) && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-slate-900">浏览要求</h3>
                                <div className="rounded-[20px] bg-slate-50 p-5">
                                    {/* 浏览时长 */}
                                    <div className={`grid gap-3 text-center mb-4 ${task.hasSubProduct ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                        <div className="rounded-[12px] bg-white p-3">
                                            <div className="text-lg font-bold text-primary-600">{task.totalBrowseMinutes || 15}</div>
                                            <div className="text-xs text-slate-400">总计/分钟</div>
                                        </div>
                                        <div className="rounded-[12px] bg-white p-3">
                                            <div className="text-lg font-bold text-warning-500">{task.compareBrowseMinutes || 3}</div>
                                            <div className="text-xs text-slate-400">货比/分钟</div>
                                        </div>
                                        <div className="rounded-[12px] bg-white p-3">
                                            <div className="text-lg font-bold text-success-600">{task.mainBrowseMinutes || 8}</div>
                                            <div className="text-xs text-slate-400">主品/分钟</div>
                                        </div>
                                        {task.hasSubProduct && (
                                            <div className="rounded-[12px] bg-white p-3">
                                                <div className="text-lg font-bold text-slate-500">{task.subBrowseMinutes || 2}</div>
                                                <div className="text-xs text-slate-400">副品/分钟</div>
                                            </div>
                                        )}
                                    </div>
                                    {/* 浏览行为 */}
                                    <div className="flex flex-wrap gap-2">
                                        {task.needCompare && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                货比 ({task.compareCount || 3}家)
                                            </span>
                                        )}
                                        {task.needFavorite && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                收藏商品
                                            </span>
                                        )}
                                        {task.needFollow && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                关注店铺
                                            </span>
                                        )}
                                        {task.needAddCart && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                加入购物车
                                            </span>
                                        )}
                                        {task.needContactCS && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                联系客服
                                            </span>
                                        )}
                                    </div>
                                    {task.contactCSContent && (
                                        <div className="mt-3 rounded-[12px] bg-blue-50 p-3 text-xs text-blue-700">
                                            <span className="font-bold">客服内容：</span>{task.contactCSContent}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Value-added Services 增值服务 */}
                        {(task.weight || task.fastRefund || task.extraReward || task.addReward || task.isPasswordEnabled || task.isTimingPublish || task.isTimingPay || task.isRepay || task.isNextDay || task.isCycleTime) && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-slate-900">增值服务</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {task.weight && task.weight > 0 && (
                                        <div className="rounded-[16px] bg-slate-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">包裹重量</div>
                                            <div className="text-sm font-bold text-slate-700">{task.weight}kg</div>
                                        </div>
                                    )}
                                    {task.fastRefund && (
                                        <div className="rounded-[16px] bg-green-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">快速返款</div>
                                            <div className="text-sm font-bold text-green-600">已开通</div>
                                        </div>
                                    )}
                                    {(task.extraReward || task.addReward) && (task.extraReward! > 0 || task.addReward! > 0) && (
                                        <div className="rounded-[16px] bg-warning-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">额外赏金</div>
                                            <div className="text-sm font-bold text-warning-600">+¥{task.extraReward || task.addReward}/单</div>
                                        </div>
                                    )}
                                    {task.isPasswordEnabled && task.checkPassword && (
                                        <div className="rounded-[16px] bg-purple-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">验证口令</div>
                                            <div className="text-sm font-bold text-purple-600">{task.checkPassword}</div>
                                        </div>
                                    )}
                                    <div className="rounded-[16px] bg-slate-50 p-4">
                                        <div className="text-xs text-slate-400 mb-1">运费</div>
                                        <div className={`text-sm font-bold ${task.isFreeShipping ? 'text-green-600' : 'text-amber-600'}`}>
                                            {task.isFreeShipping ? '包邮' : '非包邮'}
                                        </div>
                                    </div>
                                    {task.isTimingPublish && (
                                        <div className="rounded-[16px] bg-blue-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">定时发布</div>
                                            <div className="text-sm font-bold text-blue-600">
                                                {task.publishTime ? new Date(task.publishTime).toLocaleString('zh-CN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '已启用'}
                                            </div>
                                        </div>
                                    )}
                                    {task.isTimingPay && (
                                        <div className="rounded-[16px] bg-indigo-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">定时付款</div>
                                            <div className="text-sm font-bold text-indigo-600">
                                                {task.timingPayTime ? new Date(task.timingPayTime).toLocaleString('zh-CN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '已启用'}
                                            </div>
                                        </div>
                                    )}
                                    {task.isRepay && (
                                        <div className="rounded-[16px] bg-cyan-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">回购任务</div>
                                            <div className="text-sm font-bold text-cyan-600">已启用</div>
                                        </div>
                                    )}
                                    {task.isNextDay && (
                                        <div className="rounded-[16px] bg-teal-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">隔天任务</div>
                                            <div className="text-sm font-bold text-teal-600">已启用</div>
                                        </div>
                                    )}
                                    {task.isCycleTime && (
                                        <div className="rounded-[16px] bg-rose-50 p-4">
                                            <div className="text-xs text-slate-400 mb-1">延长买号周期</div>
                                            <div className="text-sm font-bold text-rose-600">{task.cycleTime || 30}天</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Praise Requirements 好评要求 */}
                        {(task.isPraise || task.isImgPraise || task.isVideoPraise) && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-slate-900">好评要求</h3>
                                <div className="rounded-[20px] bg-slate-50 p-5">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {task.isPraise && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                文字好评 ({praiseTexts.length}条)
                                            </span>
                                        )}
                                        {task.isImgPraise && (
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 font-medium">
                                                图片好评 ({praiseImages.length}张)
                                            </span>
                                        )}
                                        {task.isVideoPraise && (
                                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium">
                                                视频好评 ({praiseVideos.length}个)
                                            </span>
                                        )}
                                    </div>
                                    {task.isPraise && praiseTexts.length > 0 && (
                                        <div className="rounded-[12px] bg-white p-3">
                                            <div className="text-xs text-slate-400 mb-2">好评内容（随机选择一条）：</div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {praiseTexts.slice(0, 3).map((txt, i) => (
                                                    <div key={i} className="text-xs text-slate-600 border-l-2 border-primary-200 pl-2">
                                                        {i + 1}. {txt}
                                                    </div>
                                                ))}
                                                {praiseTexts.length > 3 && (
                                                    <div className="text-xs text-slate-400">...共 {praiseTexts.length} 条</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Merchant Memo 下单提示 */}
                        {task.memo && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-slate-900">下单提示</h3>
                                <div className="rounded-[20px] bg-amber-50 p-5 text-sm text-amber-800 whitespace-pre-wrap">
                                    {task.memo}
                                </div>
                            </div>
                        )}

                        {/* Fee Details 费用明细 */}
                        {(task.baseServiceFee || task.praiseFee || task.margin) && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold text-slate-900">费用明细</h3>
                                <div className="rounded-[20px] bg-slate-50 p-5">
                                    <div className="space-y-2 text-sm">
                                        {task.baseServiceFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">基础服务费</span>
                                                <span className="font-medium">¥{task.baseServiceFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.praiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">文字好评费</span>
                                                <span className="font-medium">¥{task.praiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.imgPraiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">图片好评费</span>
                                                <span className="font-medium">¥{task.imgPraiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.videoPraiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">视频好评费</span>
                                                <span className="font-medium">¥{task.videoPraiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.timingPublishFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">定时发布费</span>
                                                <span className="font-medium">¥{task.timingPublishFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.timingPayFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">定时付款费</span>
                                                <span className="font-medium">¥{task.timingPayFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.nextDayFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">隔天任务费</span>
                                                <span className="font-medium">¥{task.nextDayFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.goodsMoreFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">多商品费用</span>
                                                <span className="font-medium">¥{task.goodsMoreFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.goodsPrice && task.goodsPrice > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">快速返款费 (0.6%)</span>
                                                <span className="font-medium">¥{(task.goodsPrice * 0.006).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.shippingFee && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">邮费</span>
                                                <span className="font-medium">¥{task.shippingFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.margin && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">保证金</span>
                                                <span className="font-medium">¥{task.margin.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {selectedOrder?.userDivided && selectedOrder.userDivided > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">买手分成</span>
                                                <span className="font-medium text-emerald-600">¥{Number(selectedOrder.userDivided).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                            <span className="font-bold text-slate-700">总计</span>
                                            <span className="font-bold text-primary-600">¥{Number(selectedOrder.productPrice).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {selectedOrder.status === 'SUBMITTED' && (
                            <div className="flex justify-end gap-3 border-t border-slate-50 pt-5">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const reason = prompt('请输入驳回原因（可选）：');
                                        handleReview(selectedOrder.id, false, reason || undefined);
                                    }}
                                    disabled={reviewing}
                                    className="rounded-[16px] border-none bg-red-50 font-bold text-danger-500 hover:bg-red-100 shadow-none"
                                >
                                    驳回
                                </Button>
                                <Button
                                    onClick={() => handleReview(selectedOrder.id, true)}
                                    disabled={reviewing}
                                    loading={reviewing}
                                    className="rounded-[16px] bg-primary-600 font-bold text-white shadow-none hover:bg-primary-700"
                                >
                                    通过
                                </Button>
                            </div>
                        )}

                        {selectedOrder.status !== 'SUBMITTED' && (
                            <div className="border-t border-slate-100 pt-5 text-right">
                                <Button variant="secondary" className="rounded-[16px] border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 shadow-none" onClick={() => setSelectedOrder(null)}>
                                    关闭
                                </Button>
                            </div>
                        )}
                    </div>
                    );
                })()}
            </Modal>

            {/* Ship Modal */}
            <Modal
                open={showShipModal}
                onClose={() => setShowShipModal(false)}
                title="填写物流信息"
                className="max-w-md rounded-[32px]"
            >
                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">快递公司</label>
                        <div className="relative">
                            <select
                                value={deliveryCompany}
                                onChange={(e) => setDeliveryCompany(e.target.value)}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            >
                                <option value="">请选择快递公司...</option>
                                {deliveryCompanies.map(company => (
                                    <option key={company} value={company}>{company}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">快递单号</label>
                        <input
                            type="text"
                            value={deliveryNumber}
                            onChange={(e) => setDeliveryNumber(e.target.value)}
                            placeholder="请输入快递单号"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" className="rounded-[16px] border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 shadow-none" onClick={() => setShowShipModal(false)}>
                            取消
                        </Button>
                        <Button className="rounded-[16px] bg-primary-600 font-bold text-white shadow-none hover:bg-primary-700" onClick={handleShip} loading={shipping} disabled={shipping}>
                            确认发货
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Return Modal */}
            <Modal
                open={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="确认返款"
                className="max-w-md rounded-[32px]"
            >
                <div className="space-y-5">
                    <div className="rounded-[20px] bg-slate-50 p-5 text-sm">
                        <p className="font-medium text-slate-500">返款金额包含商品本金和佣金，请确认金额无误后操作。</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">返款金额 (元)</label>
                        <input
                            type="number"
                            value={returnAmount}
                            onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                        <p className="mt-2 text-xs font-bold text-slate-400">可在原金额80%-120%范围内调整</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" className="rounded-[16px] border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 shadow-none" onClick={() => setShowReturnModal(false)}>
                            取消
                        </Button>
                        <Button className="rounded-[16px] bg-primary-600 font-bold text-white shadow-none hover:bg-primary-700" onClick={handleReturn} loading={returning} disabled={returning}>
                            确认返款
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
