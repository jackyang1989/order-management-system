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
    getItem('仪表盘', '/admin/dashboard', <DashboardOutlined />),
    getItem('买手管理', 'users', <UserOutlined />, [
        getItem('买手列表', '/admin/users'),
        getItem('余额记录', '/admin/users/balance'),
        getItem('买号审核', '/admin/users/accounts'),
    ]),
    getItem('商家管理', 'merchants', <ShopOutlined />, [
        getItem('商家列表', '/admin/merchants'),
        getItem('余额记录', '/admin/merchants/balance'),
        getItem('店铺管理', '/admin/shops'),
    ]),
    getItem('任务管理', 'tasks', <FileTextOutlined />, [
        getItem('任务列表', '/admin/tasks'),
        getItem('追评任务', '/admin/tasks/reviews'),
    ]),
    getItem('订单管理', '/admin/orders', <ShoppingOutlined />),
    getItem('财务管理', 'finance', <DollarOutlined />, [
        getItem('提现审核', '/admin/withdrawals'),
        getItem('充值记录', '/admin/finance/recharge'),
        getItem('银行卡审核', '/admin/finance/bank'),
        getItem('会员记录', '/admin/finance/vip'),
    ]),
    getItem('公告管理', '/admin/notice', <NotificationOutlined />),
    getItem('系统设置', 'system', <SettingOutlined />, [
        getItem('基础参数', '/admin/system/params'),
        getItem('费率配置', '/admin/system/commission'),
        getItem('VIP等级', '/admin/system/vip'),
        getItem('平台管理', '/admin/system/platforms'),
        getItem('快递管理', '/admin/system/deliveries'),
        getItem('敏感词管理', '/admin/system/sensitive'),
        getItem('API配置', '/admin/system/api'),
    ]),
    getItem('权限管理', 'permission', <LockOutlined />, [
        getItem('菜单管理', '/admin/permission/menu'),
        getItem('角色管理', '/admin/permission/role'),
        getItem('管理员', '/admin/permission/admin'),
    ]),
    getItem('系统工具', 'tools', <ToolOutlined />, [
        getItem('数据备份', '/admin/tools/backup'),
        getItem('操作日志', '/admin/tools/logs'),
        getItem('缓存管理', '/admin/tools/cache'),
    ]),
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
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

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

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        if (e.key.startsWith('/')) {
            router.push(e.key);
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
