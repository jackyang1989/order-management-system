'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMyOrders, cancelOrder } from '../../../services/orderService';
import { MockOrder } from '../../../mocks/orderMock';
import { isAuthenticated } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';

export default function PendingOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<MockOrder[]>([]);
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
            const allOrders = await fetchMyOrders();
            // 只显示进行中的任务
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

    const handleGoStep = (order: MockOrder) => {
        router.push(`/orders/${order.id}`);
    };

    const handleCancel = async (order: MockOrder) => {
        if (!confirm('确定要放弃此任务吗？每人每天前2单任务自行放弃不扣银锭')) {
            return;
        }
        try {
            const result = await cancelOrder(order.id);
            if (result.success) {
                loadOrders();
            } else {
                alert(result.message || '取消失败');
            }
        } catch (error) {
            alert('操作失败，请重试');
        }
    };

    const getTerminalLabel = (terminal: string | number | undefined) => {
        if (terminal === '1' || terminal === 1) return '本佣货返';
        if (terminal === '2' || terminal === 2) return '本立佣货';
        return '-';
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)',
            paddingBottom: '100px'
        }}>
            {/* 毛玻璃顶栏 */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >
                    ←
                </button>
                <h1 style={{ fontSize: '18px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
                    进行中任务
                </h1>
            </div>

            {/* 任务列表 */}
            <div style={{ padding: '20px 16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
                        加载中...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#86868b' }}>
                        暂无进行中的任务
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.04)',
                                    border: '1px solid rgba(0, 0, 0, 0.04)'
                                }}
                            >
                                {/* 任务头部 */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '12px', color: '#86868b' }}>
                                        #{order.taskNumber || order.id?.slice(-6)}
                                    </span>
                                    <span style={{
                                        background: 'rgba(0, 122, 255, 0.1)',
                                        color: '#007aff',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>
                                        进行中
                                    </span>
                                </div>

                                {/* 订单信息 */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        fontSize: '13px'
                                    }}>
                                        <div>
                                            <span style={{ color: '#86868b' }}>商家: </span>
                                            <span style={{ color: '#1d1d1f', fontWeight: '500' }}>{order.shopName || '-'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#86868b' }}>买号: </span>
                                            <span style={{ color: '#1d1d1f', fontWeight: '500' }}>{order.buyerAccount || '-'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#86868b' }}>模式: </span>
                                            <span style={{ color: '#1d1d1f', fontWeight: '500' }}>{getTerminalLabel(order.terminal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 金额信息 */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    background: '#f8f9ff',
                                    padding: '14px 16px',
                                    borderRadius: '14px',
                                    marginBottom: '16px'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>垫付本金</div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>
                                            ¥{Number(order.principal || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>任务佣金</div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff6b35' }}>
                                            ¥{Number(order.commission || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => handleGoStep(order)}
                                        style={{
                                            flex: 2,
                                            padding: '14px',
                                            background: '#1d1d1f',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        去完成
                                    </button>
                                    <button
                                        onClick={() => handleCancel(order)}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            background: '#fff',
                                            color: '#ff3b30',
                                            border: '1px solid #ff3b30',
                                            borderRadius: '14px',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
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
