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
    icon?: string;
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
            { key: '/admin/users/accounts', label: '买号审核' },
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
            { key: '/admin/finance/bank', label: '银行卡审核' },
            { key: '/admin/finance/vip', label: '会员记录' },
        ],
    },
    {
        key: '/admin/notice',
        label: '公告管理',
        icon: '📣',
    },
    {
        key: 'system',
        label: '系统设置',
        icon: '⚙️',
        children: [
            { key: '/admin/system/params', label: '基础参数' },
            { key: '/admin/system/commission', label: '费率配置' },
            { key: '/admin/system/vip', label: 'VIP等级' },
            { key: '/admin/system/platforms', label: '平台管理' },
            { key: '/admin/system/deliveries', label: '快递管理' },
            { key: '/admin/system/sensitive', label: '敏感词管理' },
            { key: '/admin/system/api', label: 'API配置' },
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
    '/admin/finance/vip': 'finance',
    '/admin/system/params': 'system',
    '/admin/system/commission': 'system',
    '/admin/system/vip': 'system',
    '/admin/system/platforms': 'system',
    '/admin/system/deliveries': 'system',
    '/admin/system/sensitive': 'system',
    '/admin/system/api': 'system',
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

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken && pathname !== '/admin/login') {
            // router.push('/admin/login');
        }
        setAdmin({ username: 'Admin' });
    }, [router, pathname]);

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

    const currentOpenKey = pathname ? pathToOpenKeys[pathname] : undefined;

    useEffect(() => {
        if (currentOpenKey) {
            setOpenSections((prev) => (prev.includes(currentOpenKey) ? prev : [...prev, currentOpenKey]));
        }
    }, [currentOpenKey]);

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-slate-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen overflow-y-auto bg-slate-900 transition-all duration-200',
                    collapsed ? 'w-20' : 'w-64'
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 items-center border-b border-white/10',
                        collapsed ? 'justify-center' : 'px-6'
                    )}
                >
                    <span className="text-2xl">🛡️</span>
                    {!collapsed && (
                        <span className="ml-3 text-lg font-semibold text-white">
                            管理后台
                        </span>
                    )}
                </div>

                {/* Menu */}
                <nav className="py-4">
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
                                        'flex w-full items-center px-6 py-3 text-left text-sm transition-colors',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                                        collapsed && 'justify-center px-0'
                                    )}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span className="ml-3 flex-1">{item.label}</span>
                                            {hasChildren && (
                                                <svg
                                                    className={cn(
                                                        'h-4 w-4 transition-transform',
                                                        isOpen && 'rotate-180'
                                                    )}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            )}
                                        </>
                                    )}
                                </button>

                                {/* Sub menu */}
                                {hasChildren && isOpen && !collapsed && (
                                    <div className="bg-slate-950/50">
                                        {item.children?.map((child) => (
                                            <button
                                                key={child.key}
                                                onClick={() => handleMenuClick(child.key)}
                                                className={cn(
                                                    'block w-full py-2.5 pl-14 pr-6 text-left text-sm transition-colors',
                                                    pathname === child.key
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
                    'flex flex-1 flex-col transition-all duration-200',
                    collapsed ? 'ml-20' : 'ml-64'
                )}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
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

                    {/* User dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100"
                        >
                            <span className="text-sm text-slate-600">欢迎, {admin?.username}</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                                {admin?.username?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1">
                                <button
                                    onClick={() => {
                                        router.push('/admin/profile');
                                        setShowDropdown(false);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    个人设置
                                </button>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowDropdown(false);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    退出登录
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
