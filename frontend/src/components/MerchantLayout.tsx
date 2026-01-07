'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
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

type MenuItem = {
    key: string;
    label: string;
    icon: string;
};

const menuItems: MenuItem[] = [
    { key: '/merchant/dashboard', label: '工作台', icon: '📊' },
    { key: '/merchant/shops', label: '店铺管理', icon: '🏪' },
    { key: '/merchant/goods', label: '商品管理', icon: '🛒' },
    { key: '/merchant/keywords', label: '关键词方案', icon: '🔑' },
    { key: '/merchant/tasks', label: '任务管理', icon: '📋' },
    { key: '/merchant/orders', label: '订单审核', icon: '📦' },
    { key: '/merchant/reviews', label: '追评管理', icon: '⭐' },
    { key: '/merchant/blacklist', label: '黑名单', icon: '🚫' },
    { key: '/merchant/wallet', label: '财务中心', icon: '💰' },
    { key: '/merchant/bank', label: '银行卡', icon: '💳' },
    { key: '/merchant/vip', label: 'VIP会员', icon: '👑' },
    { key: '/merchant/recommend', label: '推荐奖励', icon: '🎁' },
    { key: '/merchant/setting', label: '账户设置', icon: '⚙️' },
    { key: '/merchant/help', label: '帮助中心', icon: '❓' },
];

export default function MerchantLayout({ children }: MerchantLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

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
            if (data.success) setMerchant(data.data);
        } catch (error) {
            console.error('Load profile error:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('merchantToken');
        localStorage.removeItem('merchant');
        router.push('/merchant/login');
    };

    const handleMenuClick = (key: string) => {
        router.push(key);
    };

    // 登录页不使用布局
    if (pathname === '/merchant/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-slate-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen overflow-y-auto bg-gradient-to-b from-indigo-950 to-indigo-900 transition-all duration-200',
                    collapsed ? 'w-20' : 'w-64'
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 items-center border-b border-white/10',
                        collapsed ? 'justify-center' : 'px-5'
                    )}
                >
                    <span className="text-3xl">🏪</span>
                    {!collapsed && (
                        <div className="ml-3">
                            <div className="text-base font-semibold text-white">商家工作台</div>
                            <div className="text-xs text-white/60">Merchant Portal</div>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <nav className="py-4">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.key;

                        return (
                            <button
                                key={item.key}
                                onClick={() => handleMenuClick(item.key)}
                                className={cn(
                                    'flex w-full items-center px-5 py-3 text-left text-sm transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-indigo-200 hover:bg-white/5 hover:text-white',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {!collapsed && (
                                    <span className="ml-3">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <div
                className={cn(
                    'flex flex-1 flex-col transition-all duration-200',
                    collapsed ? 'ml-20' : 'ml-64'
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {collapsed ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                                )}
                            </svg>
                        </button>

                        {/* Balance card */}
                        {merchant && (
                            <div className="flex items-center gap-6 rounded-lg bg-blue-50 px-4 py-2">
                                <div>
                                    <div className="text-xs text-slate-500">可用余额</div>
                                    <div className="text-base font-medium text-primary">
                                        ¥{Number(merchant.balance).toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500">冻结余额</div>
                                    <div className="text-base font-medium text-amber-500">
                                        ¥{Number(merchant.frozenBalance || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100"
                        >
                            <span className="text-sm text-slate-600">{merchant?.username || '商家'}</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white">
                                {merchant?.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1">
                                <button
                                    onClick={() => {
                                        router.push('/merchant/setting');
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <span>⚙️</span>
                                    <span>账户设置</span>
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <span>🚪</span>
                                    <span>退出登录</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6">
                    <div className="mx-auto w-full max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
