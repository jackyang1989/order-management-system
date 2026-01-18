'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listOrders, cancelOrder, OrderSummary } from '../../../services/orderService';
import { isAuthenticated } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';

export default function PendingOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadOrders();
    }, [router]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const allOrders = await listOrders();
            const pendingOrders = allOrders.filter(
                o => o.status === 'PENDING' || o.status === 'SUBMITTED'
            );
            setOrders(pendingOrders);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoStep = (order: OrderSummary) => {
        router.push(`/orders/${order.id}`);
    };

    const handleCancel = async (order: OrderSummary) => {
        if (!confirm('确定要放弃此任务吗？')) {
            return;
        }
        try {
            await cancelOrder(order.id);
            loadOrders();
        } catch (error) {
            alert((error as Error).message || '操作失败，请重试');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
            {/* Glassmorphism Header */}
            <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-100 bg-white/85 px-5 py-4 backdrop-blur-xl">
                <button
                    onClick={() => router.back()}
                    className="cursor-pointer border-none bg-transparent p-0 text-xl"
                >
                    ←
                </button>
                <h1 className="m-0 text-lg font-semibold text-slate-800">
                    进行中任务
                </h1>
            </header>

            {/* Task List */}
            <div className="px-4 py-5">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">
                        加载中...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        暂无进行中的任务
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-2xl border border-slate-100 bg-white p-5"
                            >
                                {/* Task Header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        #{order.orderNo || '暂无编号'}
                                    </span>
                                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-primary-500">
                                        进行中
                                    </span>
                                </div>

                                {/* Order Info */}
                                <div className="mb-4">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-400">商家: </span>
                                            <span className="font-medium text-slate-800">{order.shopName || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">平台: </span>
                                            <span className="font-medium text-slate-800">{order.platform || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Info */}
                                <div className="mb-4 flex justify-between rounded-xl bg-slate-50 px-4 py-3.5">
                                    <div>
                                        <div className="mb-1 text-xs text-slate-400">商品价格</div>
                                        <div className="text-lg font-bold text-slate-800">
                                            ¥{Number(order.productPrice || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="mb-1 text-xs text-slate-400">任务佣金</div>
                                        <div className="text-lg font-bold text-orange-500">
                                            ¥{Number(order.commission || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleGoStep(order)}
                                        className="flex-[2] cursor-pointer rounded-xl border-none bg-slate-800 py-3.5 text-sm font-semibold text-white"
                                    >
                                        去完成
                                    </button>
                                    <button
                                        onClick={() => handleCancel(order)}
                                        className="flex-1 cursor-pointer rounded-xl border border-red-500 bg-white py-3.5 text-sm font-semibold text-danger-400"
                                    >
                                        放弃
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
