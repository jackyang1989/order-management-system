'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BASE_URL } from '../../../apiConfig';

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    {
        key: 'dashboard',
        icon: '📊',
        label: '仪表盘',
        path: '/admin/dashboard'
    },
    {
        key: 'users',
        icon: '👥',
        label: '买手管理',
        path: '/admin/users',
        children: [
            { key: 'users-list', label: '买手列表', path: '/admin/users' },
            { key: 'users-balance', label: '余额记录', path: '/admin/users/balance' },
            { key: 'users-accounts', label: '买号审核', path: '/admin/users/accounts' },
        ]
    },
    {
        key: 'merchants',
        icon: '🏪',
        label: '商家管理',
        path: '/admin/merchants',
        children: [
            { key: 'merchants-list', label: '商家列表', path: '/admin/merchants' },
            { key: 'merchants-balance', label: '余额记录', path: '/admin/merchants/balance' },
        ]
    },
    {
        key: 'tasks',
        icon: '📋',
        label: '任务管理',
        path: '/admin/tasks',
        children: [
            { key: 'tasks-list', label: '任务列表', path: '/admin/tasks' },
            { key: 'tasks-review', label: '追评任务', path: '/admin/tasks/reviews' },
        ]
    },
    {
        key: 'orders',
        icon: '📦',
        label: '订单管理',
        path: '/admin/orders'
    },
    {
        key: 'finance',
        icon: '💰',
        label: '财务管理',
        path: '/admin/finance',
        children: [
            { key: 'finance-withdrawals', label: '提现审核', path: '/admin/withdrawals' },
            { key: 'finance-recharge', label: '充值记录', path: '/admin/finance/recharge' },
            { key: 'finance-bank', label: '银行卡审核', path: '/admin/finance/bank' },
            { key: 'finance-vip', label: '会员记录', path: '/admin/finance/vip' },
        ]
    },
    {
        key: 'notice',
        icon: '📢',
        label: '公告管理',
        path: '/admin/notice'
    },
    {
        key: 'system',
        icon: '⚙️',
        label: '系统设置',
        path: '/admin/system',
        children: [
            { key: 'system-params', label: '基础参数', path: '/admin/system/params' },
            { key: 'system-menu', label: '菜单管理', path: '/admin/system/menu' },
        ]
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [admin, setAdmin] = useState<{ username: string } | null>(null);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['users', 'merchants', 'finance']);

    useEffect(() => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        if (!token && pathname !== '/admin/login') {
            // router.push('/admin/login');
        }
        setAdmin({ username: 'Admin' });
    }, [router, pathname]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    const toggleMenu = (key: string) => {
        setExpandedMenus(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    // 登录页不使用布局
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#f0f2f5',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
        }}>
            {/* 左侧导航 - 固定宽度 */}
            <aside style={{
                width: '240px',
                background: '#001529',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                position: 'fixed',
                height: '100vh',
                left: 0,
                top: 0,
                zIndex: 100,
                overflowY: 'auto'
            }}>
                {/* Logo区 */}
                <div style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <span style={{ fontSize: '24px', marginRight: '12px' }}>🛡️</span>
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>管理后台</span>
                </div>

                {/* 菜单 */}
                <nav style={{ flex: 1, padding: '8px 0' }}>
                    {menuItems.map(item => (
                        <div key={item.key}>
                            <div
                                onClick={() => item.children ? toggleMenu(item.key) : router.push(item.path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 24px',
                                    cursor: 'pointer',
                                    background: pathname === item.path ? '#1890ff' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                                {item.children && (
                                    <span style={{
                                        fontSize: '12px',
                                        transform: expandedMenus.includes(item.key) ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}>▶</span>
                                )}
                            </div>
                            {item.children && expandedMenus.includes(item.key) && (
                                <div style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    {item.children.map(child => (
                                        <div
                                            key={child.key}
                                            onClick={() => router.push(child.path)}
                                            style={{
                                                padding: '10px 24px 10px 52px',
                                                cursor: 'pointer',
                                                background: pathname === child.path ? '#1890ff' : 'transparent',
                                                color: pathname === child.path ? '#fff' : 'rgba(255,255,255,0.65)',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {child.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* 退出登录 */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            opacity: 0.8
                        }}
                    >
                        <span>🚪</span>
                        <span>退出登录</span>
                    </div>
                </div>
            </aside>

            {/* 右侧内容区 - 全屏宽度 */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '240px',
                minWidth: 0
            }}>
                {/* 顶部栏 */}
                <header style={{
                    height: '64px',
                    background: '#fff',
                    borderBottom: '1px solid #e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 99,
                    boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#000' }}>
                        {menuItems.find(item => pathname && pathname.startsWith(item.path))?.label || '控制台'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ color: '#666' }}>欢迎, {admin?.username}</span>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: '#1890ff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            {admin?.username?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* 主内容插槽 */}
                <main style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f0f2f5' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
