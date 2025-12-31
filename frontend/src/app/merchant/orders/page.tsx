'use client';

import { useState, useEffect } from 'react';
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
                alert(approved ? '审核通过' : '已驳回');
                setSelectedOrder(null);
                loadData();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setReviewing(false);
        }
    };

    const statusLabels: Record<string, { text: string; color: string }> = {
        PENDING: { text: '进行中', color: '#3b82f6' },
        SUBMITTED: { text: '待审核', color: '#f59e0b' },
        APPROVED: { text: '已通过', color: '#10b981' },
        REJECTED: { text: '已驳回', color: '#ef4444' },
        COMPLETED: { text: '已完成', color: '#6b7280' },
    };

    return (
        <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: '待审核', value: stats.pendingReview, color: '#f59e0b', filter: 'SUBMITTED' },
                    { label: '已通过', value: stats.approved, color: '#10b981', filter: 'APPROVED' },
                    { label: '已驳回', value: stats.rejected, color: '#ef4444', filter: 'REJECTED' },
                    { label: '总订单', value: stats.total, color: '#6b7280', filter: '' },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => stat.filter && setFilter(stat.filter)}
                        style={{
                            background: filter === stat.filter ? '#eef2ff' : '#fff',
                            border: `1px solid ${filter === stat.filter ? '#4f46e5' : '#e5e7eb'}`,
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: stat.filter ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: filter === status ? '#4f46e5' : '#f3f4f6',
                            color: filter === status ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontWeight: filter === status ? '600' : '400'
                        }}
                    >
                        {statusLabels[status]?.text || status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>加载中...</div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>暂无订单</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>任务</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>买号</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>金额</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>状态</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>提交时间</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>{order.taskTitle}</div>
                                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{order.platform}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#374151', fontSize: '14px' }}>{order.buynoAccount}</td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '500', color: '#1f2937' }}>¥{Number(order.productPrice).toFixed(2)}</div>
                                        <div style={{ fontSize: '12px', color: '#10b981' }}>佣金 ¥{Number(order.commission).toFixed(2)}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: statusLabels[order.status]?.color + '20',
                                            color: statusLabels[order.status]?.color
                                        }}>
                                            {statusLabels[order.status]?.text || order.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                                        {new Date(order.completedAt || order.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        {order.status === 'SUBMITTED' ? (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: '#4f46e5',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                审核
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    background: '#fff',
                                                    color: '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                查看
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setSelectedOrder(null)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        width: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '24px'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
                            订单详情 - {selectedOrder.status === 'SUBMITTED' ? '待审核' : statusLabels[selectedOrder.status]?.text}
                        </h2>

                        {/* Order Info */}
                        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                                <div><span style={{ color: '#6b7280' }}>任务：</span>{selectedOrder.taskTitle}</div>
                                <div><span style={{ color: '#6b7280' }}>平台：</span>{selectedOrder.platform}</div>
                                <div><span style={{ color: '#6b7280' }}>买号：</span>{selectedOrder.buynoAccount}</div>
                                <div><span style={{ color: '#6b7280' }}>金额：</span>¥{Number(selectedOrder.productPrice).toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Step Screenshots */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>提交凭证</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {selectedOrder.stepData.filter(s => s.submitted).map(step => (
                                    <div key={step.step} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>{step.title}</div>
                                        {step.screenshot ? (
                                            <img
                                                src={step.screenshot.startsWith('http') ? step.screenshot : `${BASE_URL}${step.screenshot}`}
                                                alt={step.title}
                                                style={{ width: '100%', borderRadius: '4px', cursor: 'pointer' }}
                                                onClick={() => window.open(step.screenshot, '_blank')}
                                            />
                                        ) : (
                                            <div style={{ height: '80px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
                                                无截图
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {selectedOrder.status === 'SUBMITTED' && (
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        const reason = prompt('请输入驳回原因（可选）：');
                                        handleReview(selectedOrder.id, false, reason || undefined);
                                    }}
                                    disabled={reviewing}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: '1px solid #ef4444',
                                        background: '#fff',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    驳回
                                </button>
                                <button
                                    onClick={() => handleReview(selectedOrder.id, true)}
                                    disabled={reviewing}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    {reviewing ? '处理中...' : '通过'}
                                </button>
                            </div>
                        )}

                        {selectedOrder.status !== 'SUBMITTED' && (
                            <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: '#fff',
                                        color: '#374151',
                                        cursor: 'pointer'
                                    }}
                                >
                                    关闭
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
