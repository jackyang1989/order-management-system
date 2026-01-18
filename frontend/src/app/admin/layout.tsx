'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
    children: ReactNode;
}

type MenuItem = {
    key: string;
    label: string;
    children?: MenuItem[];
};

const menuItems: MenuItem[] = [
    {
        key: '/admin/dashboard',
        label: '仪表盘',
        icon: '📊',
    },
    {
        key: 'users',
        label: '买手管理',
        icon: '👤',
        children: [
            { key: '/admin/users', label: '买手列表' },
            { key: '/admin/users/balance', label: '余额记录' },
            { key: '/admin/users/accounts', label: '买号列表' },
        ],
    },
    {
        key: 'merchants',
        label: '商家管理',
        icon: '🏪',
        children: [
            { key: '/admin/merchants', label: '商家列表' },
            { key: '/admin/merchants/balance', label: '余额记录' },
            { key: '/admin/shops', label: '店铺管理' },
        ],
    },
    {
        key: 'tasks',
        label: '任务管理',
        icon: '🧾',
        children: [
            { key: '/admin/tasks', label: '任务列表' },
            { key: '/admin/tasks/reviews', label: '追评任务' },
        ],
    },
    {
        key: '/admin/orders',
        label: '订单管理',
        icon: '📦',
    },
    {
        key: 'finance',
        label: '财务管理',
        icon: '💰',
        children: [
            { key: '/admin/withdrawals', label: '提现审核' },
            { key: '/admin/finance/recharge', label: '充值记录' },
            { key: '/admin/finance/bank', label: '账户审核' },
        ],
    },
    {
        key: '/admin/notice',
        label: '公告管理',
        icon: '📣',
    },
    {
        key: '/admin/help',
        label: '帮助中心',
        icon: '❓',
    },
    {
        key: 'system',
        label: '系统设置',
        icon: '⚙️',
        children: [
            { key: '/admin/system/params', label: '基础参数' },
            { key: '/admin/system/commission', label: '费率配置' },
            { key: '/admin/system/platforms', label: '平台管理' },
            { key: '/admin/system/platforms/image-config', label: '截图配置' },
            { key: '/admin/system/entry-types', label: '任务入口' },
            { key: '/admin/system/deliveries', label: '快递管理' },
            { key: '/admin/system/sensitive', label: '敏感词管理' },
            { key: '/admin/system/api', label: 'API配置' },
            { key: '/admin/system/banners', label: '轮播图管理' },
        ],
    },
    {
        key: 'permission',
        label: '权限管理',
        icon: '🔐',
        children: [
            { key: '/admin/permission/menu', label: '菜单管理' },
            { key: '/admin/permission/role', label: '角色管理' },
            { key: '/admin/permission/admin', label: '管理员' },
        ],
    },
    {
        key: 'tools',
        label: '系统工具',
        icon: '🛠️',
        children: [
            { key: '/admin/tools/backup', label: '数据备份' },
            { key: '/admin/tools/logs', label: '操作日志' },
            { key: '/admin/tools/cache', label: '缓存管理' },
        ],
    },
];

// Map path to open keys
const pathToOpenKeys: Record<string, string> = {
    '/admin/users': 'users',
    '/admin/users/balance': 'users',
    '/admin/users/accounts': 'users',
    '/admin/merchants': 'merchants',
    '/admin/merchants/balance': 'merchants',
    '/admin/shops': 'merchants',
    '/admin/tasks': 'tasks',
    '/admin/tasks/reviews': 'tasks',
    '/admin/withdrawals': 'finance',
    '/admin/finance/recharge': 'finance',
    '/admin/finance/bank': 'finance',
    '/admin/system/params': 'system',
    '/admin/system/commission': 'system',
    '/admin/system/platforms': 'system',
    '/admin/system/platforms/image-config': 'system',
    '/admin/system/entry-types': 'system',
    '/admin/system/deliveries': 'system',
    '/admin/system/sensitive': 'system',
    '/admin/system/api': 'system',
    '/admin/system/banners': 'system',
    '/admin/permission/menu': 'permission',
    '/admin/permission/role': 'permission',
    '/admin/permission/admin': 'permission',
    '/admin/tools/backup': 'tools',
    '/admin/tools/logs': 'tools',
    '/admin/tools/cache': 'tools',
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<string[]>(['users', 'merchants', 'finance', 'system']);
    const [admin, setAdmin] = useState<{ username: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // 计算当前路径对应的展开菜单项
    const currentOpenKey = pathname ? pathToOpenKeys[pathname] : undefined;

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken && pathname !== '/admin/login') {
            // router.push('/admin/login');
        }
        setAdmin({ username: 'Admin' });
    }, [router, pathname]);

    // 自动展开当前路径对应的菜单
    useEffect(() => {
        if (currentOpenKey) {
            setOpenSections((prev) => (prev.includes(currentOpenKey) ? prev : [...prev, currentOpenKey]));
        }
    }, [currentOpenKey]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
    };

    const handleMenuClick = (key: string) => {
        if (key.startsWith('/')) {
            router.push(key);
        }
    };

    const toggleSection = (key: string) => {
        setOpenSections((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    // 登录页不使用布局
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
            {/* Sidebar */}
            <aside
                className={cn(
                    'custom-scrollbar fixed left-4 top-4 z-40 h-[calc(100vh-32px)] overflow-y-auto rounded-[24px] border-none bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200',
                    collapsed ? 'w-[72px]' : 'w-[220px]'
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-20 items-center',
                        collapsed ? 'justify-center' : 'px-6'
                    )}
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-xl">
                        🛡️
                    </div>
                    {!collapsed && (
                        <span className="ml-4 text-base font-bold text-slate-800">
                            管理后台
                        </span>
                    )}
                </div>

                {/* Menu */}
                {/* Menu */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openSections.includes(item.key);
                        const isActive = pathname === item.key;

                        return (
                            <div key={item.key}>
                                <button
                                    onClick={() => {
                                        if (hasChildren) {
                                            toggleSection(item.key);
                                        } else {
                                            handleMenuClick(item.key);
                                        }
                                    }}
                                    className={cn(
                                        'flex w-full items-center rounded-[16px] px-3.5 py-3 text-left transition-all',
                                        isActive
                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                        collapsed && 'justify-center px-0'
                                    )}
                                >
                                    <span className={cn("text-lg", collapsed ? "mb-0" : "mr-3")}>{item.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-sm font-bold">{item.label}</span>
                                            {hasChildren && (
                                                <svg
                                                    className={cn(
                                                        'h-3.5 w-3.5 opacity-40 transition-transform',
                                                        isOpen && 'rotate-180'
                                                    )}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={3}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            )}
                                        </>
                                    )}
                                </button>

                                {/* Sub menu */}
                                {hasChildren && isOpen && !collapsed && (
                                    <div className="ml-4 mt-1 border-l-2 border-slate-100 pl-3">
                                        {item.children?.map((child) => (
                                            <button
                                                key={child.key}
                                                onClick={() => handleMenuClick(child.key)}
                                                className={cn(
                                                    'block w-full rounded-[12px] px-3 py-2.5 text-left text-xs font-bold transition-all',
                                                    pathname === child.key
                                                        ? 'bg-primary-50 text-primary-600'
                                                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                                                )}
                                            >
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <div
                className={cn(
                    'flex flex-1 flex-col overflow-hidden transition-all duration-200',
                    collapsed ? 'ml-[72px]' : 'ml-[220px]'
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-[#F8FAFC]/80 px-8 backdrop-blur-md">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-600 hover:shadow-md active:scale-95"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {collapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                            )}
                        </svg>
                    </button>


                    {/* User dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-[#f9fafb]"
                        >
                            <span className="text-[14px] text-[#5a6577]">欢迎, {admin?.username}</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-[13px] font-medium text-primary-600">
                                {admin?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                                <button
                                    onClick={() => {
                                        router.push('/admin/profile');
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#5a6577] transition-colors hover:bg-[#f9fafb] hover:text-[#3b4559]"
                                >
                                    <span>⚙️</span>
                                    <span>个人设置</span>
                                </button>
                                <div className="border-t border-[#e5e7eb]" />
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowDropdown(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#5a6577] transition-colors hover:bg-[#f9fafb] hover:text-[#3b4559]"
                                >
                                    <span>🚪</span>
                                    <span>退出登录</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 min-w-0">
                    <div className="mx-auto w-full max-w-[1440px]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
