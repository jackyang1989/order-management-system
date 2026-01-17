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
    merchantNo: string;
    phone: string;
    avatar?: string;
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
    { key: '/merchant/keywords', label: '关键词库', icon: '🔑' },
    { key: '/merchant/questions', label: '问题模板', icon: '💬' },
    { key: '/merchant/tasks', label: '任务管理', icon: '📋' },
    { key: '/merchant/orders', label: '订单审核', icon: '📦' },
    { key: '/merchant/reviews', label: '追评管理', icon: '⭐' },
    { key: '/merchant/wallet', label: '财务中心', icon: '💰' },
    { key: '/merchant/bank', label: '收款账户', icon: '💳' },
    { key: '/merchant/blacklist', label: '黑名单库', icon: '🚫' },
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
        <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside
                className={cn(
                    'custom-scrollbar fixed left-0 top-0 z-40 h-screen overflow-y-auto border-r border-slate-100 bg-white transition-all duration-200',
                    collapsed ? 'w-[72px]' : 'w-[240px]'
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 items-center border-b border-slate-50',
                        collapsed ? 'justify-center' : 'px-5'
                    )}
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-blue-50">
                        <span className="text-lg">🏪</span>
                    </div>
                    {!collapsed && (
                        <div className="ml-3">
                            <div className="text-[15px] font-bold text-slate-900">商家工作台</div>
                            <div className="text-[11px] font-medium text-slate-400">Merchant Portal</div>
                        </div>
                    )}
                </div>

                {/* Menu */}
                <nav className="space-y-1 p-3">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.key;

                        return (
                            <button
                                key={item.key}
                                onClick={() => handleMenuClick(item.key)}
                                className={cn(
                                    'flex w-full items-center rounded-[16px] px-3 py-3 text-left transition-all',
                                    isActive
                                        ? 'bg-primary-600 font-bold text-white shadow-md shadow-primary-600/20'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <span className="text-[18px]">{item.icon}</span>
                                {!collapsed && (
                                    <span className="ml-3 text-[14px]">{item.label}</span>
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
                {/* Header - Sticky Frosted */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100/50 bg-[#F8FAFC]/80 px-6 backdrop-blur-md">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="flex h-9 w-9 items-center justify-center rounded-[12px] text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
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
                            <div className="flex items-center gap-5 rounded-[16px] bg-white px-4 py-2 shadow-sm">
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-slate-400">可用余额</div>
                                    <div className="text-[14px] font-black text-slate-900">
                                        ¥{Number(merchant.balance).toFixed(2)}
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-slate-100" />
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-slate-400">冻结余额</div>
                                    <div className="text-[14px] font-black text-warning-500">
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
                            className="flex items-center gap-3 rounded-[16px] px-3 py-2 transition-colors hover:bg-white/50"
                        >
                            <span className="text-[14px] font-bold text-slate-700">{merchant?.merchantNo || '商家'}</span>
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-50">
                                {merchant?.avatar ? (
                                    <img src={merchant.avatar} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-[13px] font-bold text-primary-600">
                                        {merchant?.merchantNo?.charAt(0).toUpperCase() || 'M'}
                                    </span>
                                )}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
                                <button
                                    onClick={() => {
                                        router.push('/merchant/setting');
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    <span>⚙️</span>
                                    <span>账户设置</span>
                                </button>
                                <div className="border-t border-slate-50" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-medium text-danger-500 transition-colors hover:bg-red-50"
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
