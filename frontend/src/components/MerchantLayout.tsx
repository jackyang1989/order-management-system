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
        <div className="flex min-h-screen overflow-x-hidden bg-[#f6f8fb]">
            {/* Sidebar */}
            <aside
                className={cn(
                    'custom-scrollbar fixed left-0 top-0 z-40 h-screen overflow-y-auto border-r border-[#e5eaef] bg-white transition-all duration-200',
                    collapsed ? 'w-[72px]' : 'w-[240px]'
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 items-center border-b border-[#e5eaef]',
                        collapsed ? 'justify-center' : 'px-5'
                    )}
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                        <span className="text-lg">🏪</span>
                    </div>
                    {!collapsed && (
                        <div className="ml-3">
                            <div className="text-[15px] font-semibold text-[#3b4559]">商家工作台</div>
                            <div className="text-[11px] text-[#94a3b8]">Merchant Portal</div>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <nav className="p-3">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.key;

                        return (
                            <button
                                key={item.key}
                                onClick={() => handleMenuClick(item.key)}
                                className={cn(
                                    'mb-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[14px] transition-all',
                                    isActive
                                        ? 'bg-primary-50 font-medium text-primary-600'
                                        : 'text-[#5a6577] hover:bg-[#f6f8fb] hover:text-[#3b4559]',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <span className="text-[17px]">{item.icon}</span>
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
                    collapsed ? 'ml-[72px]' : 'ml-[240px]'
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5eaef] bg-white px-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7c889a] transition-colors hover:bg-[#f6f8fb] hover:text-[#3b4559]"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {collapsed ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
                                )}
                            </svg>
                        </button>

                        {/* Balance card */}
                        {merchant && (
                            <div className="flex items-center gap-6 rounded-xl border border-[#e5eaef] bg-[#f6f8fb] px-5 py-2">
                                <div>
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">可用余额</div>
                                    <div className="text-[15px] font-semibold text-primary-600">
                                        ¥{Number(merchant.balance).toFixed(2)}
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-[#e5eaef]" />
                                <div>
                                    <div className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">冻结余额</div>
                                    <div className="text-[15px] font-semibold text-warning-500">
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
                            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[#f6f8fb]"
                        >
                            <span className="text-[14px] text-[#5a6577]">{merchant?.username || '商家'}</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-[13px] font-medium text-primary-600">
                                {merchant?.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-[#e5eaef] bg-white shadow-soft">
                                <button
                                    onClick={() => {
                                        router.push('/merchant/setting');
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#5a6577] transition-colors hover:bg-[#f6f8fb] hover:text-[#3b4559]"
                                >
                                    <span>⚙️</span>
                                    <span>账户设置</span>
                                </button>
                                <div className="border-t border-[#e5eaef]" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#5a6577] transition-colors hover:bg-[#f6f8fb] hover:text-[#3b4559]"
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
