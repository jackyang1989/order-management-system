'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

interface Stats {
    totalUsers: number;
    totalMerchants: number;
    totalTasks: number;
    totalOrders: number;
    pendingMerchants: number;
    pendingWithdrawals: number;
    todayUsers: number;
    todayOrders: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    const statCards = [
        { label: '总用户数', value: stats?.totalUsers || 0, icon: '👥', color: '#1890ff', bg: '#e6f7ff' },
        { label: '总商家数', value: stats?.totalMerchants || 0, icon: '🏪', color: '#52c41a', bg: '#f6ffed' },
        { label: '总任务数', value: stats?.totalTasks || 0, icon: '📋', color: '#722ed1', bg: '#f9f0ff' },
        { label: '总订单数', value: stats?.totalOrders || 0, icon: '📦', color: '#fa8c16', bg: '#fff7e6' },
    ];

    const quickActions = [
        { label: '审核商家', count: stats?.pendingMerchants || 0, path: '/admin/merchants', color: '#1890ff' },
        { label: '审核提现', count: stats?.pendingWithdrawals || 0, path: '/admin/withdrawals', color: '#faad14' },
    ];

    return (
        <div>
            {/* 欢迎卡片 */}
            <div style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                borderRadius: '8px',
                padding: '24px 32px',
                color: '#fff',
                marginBottom: '24px'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>欢迎回来，管理员</h1>
                <p style={{ opacity: 0.85 }}>今日新增用户 <strong>{stats?.todayUsers || 0}</strong> 人，新增订单 <strong>{stats?.todayOrders || 0}</strong> 单</p>
            </div>

            {/* 统计卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
                {statCards.map((item, idx) => (
                    <div key={idx} style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '24px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{item.label}</div>
                                <div style={{ fontSize: '32px', fontWeight: '600', color: '#000' }}>
                                    {item.value.toLocaleString()}
                                </div>
                            </div>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: item.bg,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                {item.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 快捷操作区 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* 待处理事项 */}
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px 24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#000' }}>待处理事项</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {quickActions.map((action, idx) => (
                            <div
                                key={idx}
                                onClick={() => router.push(action.path)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: '#fafafa',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: '1px solid #f0f0f0',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ color: '#000', fontWeight: '500' }}>{action.label}</span>
                                <span style={{
                                    background: action.count > 0 ? action.color : '#d9d9d9',
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}>
                                    {action.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 今日数据 */}
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px 24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#000' }}>今日数据</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ padding: '20px', background: '#e6f7ff', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1890ff' }}>{stats?.todayUsers || 0}</div>
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>新增用户</div>
                        </div>
                        <div style={{ padding: '20px', background: '#f6ffed', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#52c41a' }}>{stats?.todayOrders || 0}</div>
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>新增订单</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快捷入口 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '20px 24px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#000' }}>快捷入口</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                    {[
                        { icon: '👥', label: '买手列表', path: '/admin/users' },
                        { icon: '🏪', label: '商家列表', path: '/admin/merchants' },
                        { icon: '📋', label: '任务列表', path: '/admin/tasks' },
                        { icon: '📦', label: '订单列表', path: '/admin/orders' },
                        { icon: '💸', label: '提现审核', path: '/admin/withdrawals' },
                        { icon: '⚙️', label: '系统设置', path: '/admin/system' },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '20px 16px',
                                background: '#fafafa',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <span style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</span>
                            <span style={{ fontSize: '13px', color: '#000' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
