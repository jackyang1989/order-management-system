'use client';

import { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { BASE_URL } from '../../../apiConfig';

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
    total: number;
}

const statusConfig: Record<string, { text: string; className: string }> = {
    PENDING: { text: '进行中', className: 'bg-blue-100 text-blue-600' },
    SUBMITTED: { text: '待审核', className: 'bg-amber-100 text-amber-600' },
    APPROVED: { text: '已通过', className: 'bg-green-100 text-green-600' },
    REJECTED: { text: '已驳回', className: 'bg-red-100 text-red-600' },
    COMPLETED: { text: '已完成', className: 'bg-slate-100 text-slate-600' },
};

export default function MerchantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats>({ pendingReview: 0, approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('SUBMITTED');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [reviewing, setReviewing] = useState(false);

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

    const statCards = [
        { label: '待审核', value: stats.pendingReview, colorClass: 'text-amber-500', filterKey: 'SUBMITTED' },
        { label: '已通过', value: stats.approved, colorClass: 'text-green-500', filterKey: 'APPROVED' },
        { label: '已驳回', value: stats.rejected, colorClass: 'text-red-500', filterKey: 'REJECTED' },
        { label: '总订单', value: stats.total, colorClass: 'text-slate-500', filterKey: '' },
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
                            'rounded-xl border p-5 text-left transition-all',
                            filter === stat.filterKey
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 bg-white hover:border-slate-300',
                            !stat.filterKey && 'cursor-default'
                        )}
                    >
                        <div className={cn('text-3xl font-bold', stat.colorClass)}>{stat.value}</div>
                        <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                    </button>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={cn(
                            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                            filter === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        )}
                    >
                        {statusConfig[status]?.text || status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="py-12 text-center text-slate-500">加载中...</div>
                ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">暂无订单</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">任务</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">买号</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">金额</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">提交时间</th>
                                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-slate-900">{order.taskTitle}</div>
                                        <div className="mt-0.5 text-xs text-slate-400">{order.platform}</div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-700">{order.buynoAccount}</td>
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-slate-900">¥{Number(order.productPrice).toFixed(2)}</div>
                                        <div className="mt-0.5 text-xs text-green-600">佣金 ¥{Number(order.commission).toFixed(2)}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={cn('inline-block rounded-full px-2.5 py-1 text-xs font-medium', statusConfig[order.status]?.className)}>
                                            {statusConfig[order.status]?.text || order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-500">
                                        {new Date(order.completedAt || order.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <Button
                                            size="sm"
                                            variant={order.status === 'SUBMITTED' ? 'primary' : 'secondary'}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            {order.status === 'SUBMITTED' ? '审核' : '查看'}
                                        </Button>
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
                        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
                            <div><span className="text-slate-500">任务：</span>{selectedOrder.taskTitle}</div>
                            <div><span className="text-slate-500">平台：</span>{selectedOrder.platform}</div>
                            <div><span className="text-slate-500">买号：</span>{selectedOrder.buynoAccount}</div>
                            <div><span className="text-slate-500">金额：</span>¥{Number(selectedOrder.productPrice).toFixed(2)}</div>
                        </div>

                        {/* Step Screenshots */}
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-slate-800">提交凭证</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {selectedOrder.stepData.filter(s => s.submitted).map(step => (
                                    <div key={step.step} className="rounded-lg border border-slate-200 p-3">
                                        <div className="mb-2 text-xs font-medium text-slate-700">{step.title}</div>
                                        {step.screenshot ? (
                                            <img
                                                src={step.screenshot.startsWith('http') ? step.screenshot : `${BASE_URL}${step.screenshot}`}
                                                alt={step.title}
                                                className="w-full cursor-pointer rounded"
                                                onClick={() => window.open(step.screenshot, '_blank')}
                                            />
                                        ) : (
                                            <div className="flex h-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                                                无截图
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedOrder.status === 'SUBMITTED' && (
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        const reason = prompt('请输入驳回原因（可选）：');
                                        handleReview(selectedOrder.id, false, reason || undefined);
                                    }}
                                    disabled={reviewing}
                                    className="border border-red-500 bg-white text-red-500 hover:bg-red-50"
                                >
                                    驳回
                                </Button>
                                <Button
                                    onClick={() => handleReview(selectedOrder.id, true)}
                                    disabled={reviewing}
                                    loading={reviewing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    通过
                                </Button>
                            </div>
                        )}

                        {selectedOrder.status !== 'SUBMITTED' && (
                            <div className="border-t border-slate-200 pt-5 text-right">
                                <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
                                    关闭
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
