'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

interface MerchantStats {
    balance: number;
    frozenBalance: number;
    totalTasks: number;
    activeTasks: number;
    completedOrders: number;
}

interface Merchant {
    id: string;
    username: string;
    phone: string;
    companyName: string;
    balance: number;
    frozenBalance: number;
}

export default function MerchantDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [stats, setStats] = useState<MerchantStats | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('merchantToken');

            const [profileRes, statsRes] = await Promise.all([
                fetch(`${BASE_URL}/merchant/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${BASE_URL}/merchant/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const profileData = await profileRes.json();
            const statsData = await statsRes.json();

            if (profileData.success) setMerchant(profileData.data);
            if (statsData.success) setStats(statsData.data);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏪</div>
                    <div style={{ color: '#666' }}>加载数据中...</div>
                </div>
            </div>
        );
    }

    // 统计卡片组件
    const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) => (
        <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{title}</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
                </div>
                <div style={{
                    width: '56px',
                    height: '56px',
                    background: color,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* 欢迎栏 */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '30px 40px',
                color: '#fff',
                marginBottom: '32px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                        欢迎回来，{merchant?.username || merchant?.companyName || '商家'} 👋
                    </h2>
                    <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                        今天是 {new Date().toLocaleDateString('zh-CN')}，准备好处理新订单了吗？
                    </p>
                </div>
                <button style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    background: '#fff',
                    color: '#667eea',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} onClick={() => router.push('/merchant/tasks/new')}>
                    <span>+</span> 发布新任务
                </button>
            </div>

            {/* 统计卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <StatCard
                    title="账户余额"
                    value={`¥${(stats?.balance || 0).toFixed(2)}`}
                    icon="💰"
                    color="#dcfce7"
                />
                <StatCard
                    title="冻结金额"
                    value={`¥${(stats?.frozenBalance || 0).toFixed(2)}`}
                    icon="🔒"
                    color="#fef3c7"
                />
                <StatCard
                    title="发布任务"
                    value={stats?.totalTasks || 0}
                    icon="📋"
                    color="#dbeafe"
                />
                <StatCard
                    title="待审核订单"
                    value={stats?.completedOrders || 0}
                    icon="⏳"
                    color="#fce7f3"
                />
            </div>

            {/* 快捷操作 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* 最近任务 */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>最近任务</h3>
                        <span
                            onClick={() => router.push('/merchant/tasks')}
                            style={{ fontSize: '14px', color: '#4f46e5', cursor: 'pointer' }}
                        >
                            查看全部 →
                        </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                        暂无任务，点击上方按钮发布新任务
                    </div>
                </div>

                {/* 待审核订单 */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>待审核订单</h3>
                        <span
                            onClick={() => router.push('/merchant/orders')}
                            style={{ fontSize: '14px', color: '#4f46e5', cursor: 'pointer' }}
                        >
                            查看全部 →
                        </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                        暂无待审核订单
                    </div>
                </div>
            </div>
        </div>
    );
}
