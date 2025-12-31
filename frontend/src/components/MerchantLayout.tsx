'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BASE_URL } from '../../apiConfig';

interface MerchantLayoutProps {
    children: ReactNode;
}

interface Merchant {
    id: string;
    username: string;
    phone: string;
    companyName: string;
    balance: number;
    frozenBalance: number;
}

const menuItems = [
    { key: 'dashboard', icon: '📊', label: '工作台', path: '/merchant/dashboard' },
    { key: 'shops', icon: '🏬', label: '店铺管理', path: '/merchant/shops' },
    { key: 'tasks', icon: '📋', label: '任务管理', path: '/merchant/tasks' },
    { key: 'orders', icon: '📦', label: '订单审核', path: '/merchant/orders' },
    { key: 'reviews', icon: '⭐', label: '追评管理', path: '/merchant/reviews' },
    { key: 'wallet', icon: '💰', label: '财务中心', path: '/merchant/wallet' },
    { key: 'settings', icon: '⚙️', label: '账户设置', path: '/merchant/settings' },
];

export default function MerchantLayout({ children }: MerchantLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [merchant, setMerchant] = useState<Merchant | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMerchant(data.data);
            }
        } catch (error) {
            console.error('Load profile error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('merchantToken');
        localStorage.removeItem('merchant');
        router.push('/merchant/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
            {/* 左侧导航 */}
            <div style={{
                width: '240px',
                background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                {/* Logo区 */}
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '32px' }}>🏪</div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>商家工作台</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>Merchant Portal</div>
                        </div>
                    </div>
                </div>

                {/* 菜单 */}
                <nav style={{ flex: 1, padding: '16px 12px' }}>
                    {menuItems.map(item => (
                        <div
                            key={item.key}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '4px',
                                background: pathname && pathname.startsWith(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            <span style={{ fontSize: '15px' }}>{item.label}</span>
                        </div>
                    ))}
                </nav>

                {/* 退出登录 */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            opacity: 0.8,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>🚪</span>
                        <span style={{ fontSize: '15px' }}>退出登录</span>
                    </div>
                </div>
            </div>

            {/* 右侧内容区 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* 顶部栏 */}
                <header style={{
                    height: '64px',
                    background: '#fff',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    flexShrink: 0
                }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                        {menuItems.find(item => pathname && pathname.startsWith(item.path))?.label || '管理系统'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            background: '#f3f4f6',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>余额:</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                                ¥{(merchant?.balance || 0).toFixed(2)}
                            </span>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            {merchant?.username?.charAt(0).toUpperCase() || 'M'}
                        </div>
                    </div>
                </header>

                {/* 主内容插槽 */}
                <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
