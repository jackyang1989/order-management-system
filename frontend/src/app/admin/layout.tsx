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
    const [admin, setAdmin] = useState<{ username: string } | null>(null);

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

    // 登录页不使用布局
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const currentOpenKey = pathname ? pathToOpenKeys[pathname] : undefined;
    const openKeys = currentOpenKey ? [currentOpenKey] : ['users', 'merchants', 'finance', 'system'];

    const dropdownItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人设置',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? 0 : '0 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <span style={{ fontSize: 24 }}>🛡️</span>
                    {!collapsed && (
                        <span style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: '#fff',
                            marginLeft: 12,
                        }}>
                            管理后台
                        </span>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={pathname ? [pathname] : []}
                    defaultOpenKeys={openKeys}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16, width: 64, height: 64 }}
                    />
                    <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            padding: '0 12px',
                        }}>
                            <span style={{ color: '#666' }}>欢迎, {admin?.username}</span>
                            <Avatar style={{ backgroundColor: '#1890ff' }}>
                                {admin?.username?.charAt(0).toUpperCase() || 'A'}
                            </Avatar>
                        </div>
                    </Dropdown>
                </Header>
                <Content style={{
                    margin: 24,
                    padding: 24,
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                    minHeight: 280,
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
