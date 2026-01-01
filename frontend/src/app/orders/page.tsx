'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchMyOrders } from '../../services/orderService';
import { MockOrder } from '../../mocks/orderMock';
import { isAuthenticated } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<MockOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadOrders();
    }, [activeTab, router]);

    const loadOrders = async () => {
        setLoading(true);
        const result = await fetchMyOrders(activeTab || undefined);
        setOrders(result);
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5'
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>我的订单</div>
                <div style={{ fontSize: '18px', cursor: 'pointer' }}>☰</div>
            </div>

            {/* Tab 切换 */}
            <div style={{
                background: '#fff',
                display: 'flex',
                borderBottom: '1px solid #e5e5e5',
                marginBottom: '10px'
            }}>
                {[
                    { key: '', label: '全部' },
                    { key: 'PENDING', label: '进行中' },
                    { key: 'COMPLETED', label: '已完成' },
                    { key: 'CANCELLED', label: '已取消' }
                ].map((tab) => (
                    <div
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px 0',
                            fontSize: '14px',
                            color: activeTab === tab.key ? '#409eff' : '#666',
                            borderBottom: activeTab === tab.key ? '2px solid #409eff' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* 订单列表 */}
            <div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        暂无订单
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} style={{
                            background: '#fff',
                            margin: '0 0 10px 0',
                            padding: '12px 15px',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#333' }}>任务单号：{order.taskNumber}</span>
                                    <span style={{ color: '#409eff' }}>{order.statusLabel}</span>
                                </div>
                                <div>店铺：{order.shopName}</div>
                                <div>买号：{order.buyerAccount}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                    <span>本金：<span style={{ color: '#409eff', fontWeight: 'bold' }}>¥{order.principal}</span></span>
                                    <span>佣金：<span style={{ color: '#07c160', fontWeight: 'bold' }}>¥{(order.commission + order.userDivided).toFixed(2)}</span></span>
                                </div>
                            </div>
                            <div style={{ marginTop: '10px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <Link href={`/orders/${order.id}`}>
                                    <button style={{
                                        background: '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: '3px',
                                        padding: '5px 15px',
                                        color: '#666',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}>
                                        查看详情
                                    </button>
                                </Link>
                                {order.status === 'PENDING' && (
                                    <Link href={`/orders/${order.id}`}>
                                        <button style={{
                                            background: '#409eff',
                                            border: 'none',
                                            borderRadius: '3px',
                                            padding: '5px 15px',
                                            color: 'white',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}>
                                            继续任务
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 底部导航 */}
            <BottomNav />
        </div>
    );
}
