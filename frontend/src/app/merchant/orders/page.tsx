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
}

interface Stats {
    pendingReview: number;
    approved: number;
    rejected: number;
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
    const [stats, setStats] = useState<Stats>({ pendingReview: 0, approved: 0, rejected: 0, pendingShip: 0, pendingReceive: 0, pendingReturn: 0, total: 0 });
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
                body: JSON.stringify({ deliveryCompany, deliveryNumber })
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
        { label: '已完成', value: stats.approved, colorClass: 'text-success-600', filterKey: 'COMPLETED' },
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
                            'rounded-md border p-5 text-left transition-all',
                            filter === stat.filterKey
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]',
                            !stat.filterKey && 'cursor-default'
                        )}
                    >
                        <div className={cn('text-3xl font-bold', stat.colorClass)}>{stat.value}</div>
                        <div className="mt-1 text-sm text-[#6b7280]">{stat.label}</div>
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {['SUBMITTED', 'PENDING_SHIP', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={cn(
                            'h-[36px] rounded-md px-4 text-sm font-medium transition-colors',
                            filter === status
                                ? 'bg-primary-500 text-white'
                                : 'border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#eff6ff]'
                        )}
                    >
                        {statusConfig[status]?.text || status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                {loading ? (
                    <div className="flex min-h-[200px] items-center justify-center text-[#6b7280]">加载中...</div>
                ) : orders.length === 0 ? (
                    <div className="flex min-h-[200px] items-center justify-center text-[#6b7280]">暂无订单</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">任务</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">买号</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">金额</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">状态</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">提交时间</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6b7280]">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b border-[#e5e7eb] last:border-0 hover:bg-[#f9fafb]">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#3b4559]">{order.taskTitle}</div>
                                        <div className="mt-0.5 text-xs text-[#9ca3af]">{order.platform}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#6b7280]">{order.buynoAccount}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-[#3b4559]">¥{Number(order.productPrice).toFixed(2)}</div>
                                        <div className="mt-0.5 text-xs text-success-600">佣金 ¥{Number(order.commission).toFixed(2)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn('inline-block rounded-md px-2.5 py-1 text-xs font-medium', statusConfig[order.status]?.className)}>
                                            {statusConfig[order.status]?.text || order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#6b7280]">
                                        {new Date(order.completedAt || order.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {order.status === 'SUBMITTED' && (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    审核
                                                </Button>
                                            )}
                                            {order.status === 'PENDING_SHIP' && (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => openShipModal(order.id)}
                                                >
                                                    发货
                                                </Button>
                                            )}
                                            {order.status === 'RECEIVED' && (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => openReturnModal(order)}
                                                >
                                                    返款
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="secondary"
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
                )}
            </div>

            {/* Review Modal */}
            <Modal
                open={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`订单详情 - ${selectedOrder?.status === 'SUBMITTED' ? '待审核' : statusConfig[selectedOrder?.status || '']?.text || ''}`}
                className="max-w-2xl"
            >
                {selectedOrder && (
                    <div className="space-y-5">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-3 rounded-md bg-[#f9fafb] p-4 text-sm">
                            <div><span className="text-[#6b7280]">任务：</span>{selectedOrder.taskTitle}</div>
                            <div><span className="text-[#6b7280]">平台：</span>{selectedOrder.platform}</div>
                            <div><span className="text-[#6b7280]">买号：</span>{selectedOrder.buynoAccount}</div>
                            <div><span className="text-[#6b7280]">金额：</span>¥{Number(selectedOrder.productPrice).toFixed(2)}</div>
                        </div>

                        {/* Step Screenshots */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-[#3b4559]">提交凭证</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {selectedOrder.stepData.filter(s => s.submitted).map(step => (
                                    <div key={step.step} className="rounded-md border border-[#e5e7eb] p-3">
                                        <div className="mb-2 text-xs font-medium text-[#6b7280]">{step.title}</div>
                                        {step.screenshot ? (
                                            <img
                                                src={step.screenshot.startsWith('http') ? step.screenshot : `${BASE_URL}${step.screenshot}`}
                                                alt={step.title}
                                                className="w-full cursor-pointer rounded"
                                                onClick={() => window.open(step.screenshot, '_blank')}
                                            />
                                        ) : (
                                            <div className="flex h-20 items-center justify-center rounded bg-[#f9fafb] text-xs text-[#9ca3af]">
                                                无截图
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedOrder.status === 'SUBMITTED' && (
                            <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-5">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const reason = prompt('请输入驳回原因（可选）：');
                                        handleReview(selectedOrder.id, false, reason || undefined);
                                    }}
                                    disabled={reviewing}
                                    className="border-danger-400 text-danger-500 hover:bg-danger-50"
                                >
                                    驳回
                                </Button>
                                <Button
                                    onClick={() => handleReview(selectedOrder.id, true)}
                                    disabled={reviewing}
                                    loading={reviewing}
                                >
                                    通过
                                </Button>
                            </div>
                        )}

                        {selectedOrder.status !== 'SUBMITTED' && (
                            <div className="border-t border-[#e5e7eb] pt-5 text-right">
                                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                                    关闭
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Ship Modal */}
            <Modal
                open={showShipModal}
                onClose={() => setShowShipModal(false)}
                title="填写物流信息"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">快递公司</label>
                        <select
                            value={deliveryCompany}
                            onChange={(e) => setDeliveryCompany(e.target.value)}
                            className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            <option value="">请选择快递公司...</option>
                            {deliveryCompanies.map(company => (
                                <option key={company} value={company}>{company}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">快递单号</label>
                        <input
                            type="text"
                            value={deliveryNumber}
                            onChange={(e) => setDeliveryNumber(e.target.value)}
                            placeholder="请输入快递单号"
                            className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowShipModal(false)}>
                            取消
                        </Button>
                        <Button onClick={handleShip} loading={shipping} disabled={shipping}>
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
                className="max-w-md"
            >
                <div className="space-y-4">
                    <div className="rounded-md bg-[#f9fafb] p-4 text-sm">
                        <p className="text-[#6b7280]">返款金额包含商品本金和佣金，请确认金额无误后操作。</p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">返款金额 (元)</label>
                        <input
                            type="number"
                            value={returnAmount}
                            onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            className="h-10 w-full rounded-md border border-[#d1d5db] px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <p className="mt-1.5 text-xs text-[#6b7280]">可在原金额80%-120%范围内调整</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowReturnModal(false)}>
                            取消
                        </Button>
                        <Button onClick={handleReturn} loading={returning} disabled={returning}>
                            确认返款
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
