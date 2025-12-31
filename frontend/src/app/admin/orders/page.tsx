'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    buynoAccount: string;
    platform: string;
    productPrice: number;
    commission: number;
    status: string;
    createdAt: string;
}

const statusLabels: Record<string, { text: string; color: string }> = {
    PENDING: { text: '进行中', color: '#1890ff' },
    SUBMITTED: { text: '待审核', color: '#faad14' },
    APPROVED: { text: '已通过', color: '#52c41a' },
    REJECTED: { text: '已驳回', color: '#ff4d4f' },
    COMPLETED: { text: '已完成', color: '#8c8c8c' },
    CANCELLED: { text: '已取消', color: '#d9d9d9' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        loadOrders();
    }, [page, filter]);

    const loadOrders = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        setLoading(true);
        try {
            // 使用现有的 orders API (管理员可查看所有)
            let url = `${BASE_URL}/orders?page=${page}&limit=20`;
            if (filter) url += `&status=${filter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success || Array.isArray(json.data)) {
                setOrders(json.data || []);
                setTotal(json.total || json.data?.length || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <span style={{ color: '#666' }}>状态筛选：</span>
                {[
                    { label: '全部', value: '' },
                    { label: '进行中', value: 'PENDING' },
                    { label: '待审核', value: 'SUBMITTED' },
                    { label: '已通过', value: 'APPROVED' },
                    { label: '已驳回', value: 'REJECTED' },
                ].map(item => (
                    <button
                        key={item.value}
                        onClick={() => { setFilter(item.value); setPage(1); }}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '4px',
                            border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9',
                            background: filter === item.value ? '#e6f7ff' : '#fff',
                            color: filter === item.value ? '#1890ff' : '#666',
                            cursor: 'pointer'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 订单表格 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无订单数据</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>订单ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>任务标题</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>买号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>佣金</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#000', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {order.taskTitle}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{order.buynoAccount}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{order.platform}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000', fontWeight: '500' }}>¥{Number(order.productPrice).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(order.commission).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: (statusLabels[order.status]?.color || '#999') + '20',
                                                color: statusLabels[order.status]?.color || '#999'
                                            }}>
                                                {statusLabels[order.status]?.text || order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>
                                            {new Date(order.createdAt).toLocaleString('zh-CN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 分页 */}
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d9d9d9',
                                    background: '#fff',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    opacity: page === 1 ? 0.5 : 1
                                }}
                            >
                                上一页
                            </button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={orders.length < 20}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d9d9d9',
                                    background: '#fff',
                                    cursor: orders.length < 20 ? 'not-allowed' : 'pointer',
                                    opacity: orders.length < 20 ? 0.5 : 1
                                }}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
