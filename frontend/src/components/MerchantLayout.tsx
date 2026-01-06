'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { BASE_URL } from '../apiConfig';

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
    icon?: string;
    children?: MenuItem[];
};

const menuItems: MenuItem[] = [
    getItem('工作台', '/merchant/dashboard', <DashboardOutlined />),
    getItem('店铺管理', '/merchant/shops', <ShopOutlined />),
    getItem('商品管理', '/merchant/goods', <ShoppingOutlined />),
    getItem('关键词方案', '/merchant/keywords', <KeyOutlined />),
    getItem('任务管理', '/merchant/tasks', <FileTextOutlined />),
    getItem('订单审核', '/merchant/orders', <AuditOutlined />),
    getItem('追评管理', '/merchant/reviews', <StarOutlined />),
    getItem('黑名单', '/merchant/blacklist', <StopOutlined />),
    getItem('财务中心', '/merchant/wallet', <WalletOutlined />),
    getItem('银行卡', '/merchant/bank', <CreditCardOutlined />),
    getItem('VIP会员', '/merchant/vip', <CrownOutlined />),
    getItem('推荐奖励', '/merchant/recommend', <GiftOutlined />),
    getItem('账户设置', '/merchant/setting', <SettingOutlined />),
    getItem('帮助中心', '/merchant/help', <QuestionCircleOutlined />),
];

export default function MerchantLayout({ children }: MerchantLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

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

    const handleMenuClick: MenuProps['onClick'] = (e) => {
        router.push(e.key);
    };

    const dropdownItems: MenuProps['items'] = [
        { key: 'settings', icon: <SettingOutlined />, label: '账户设置', onClick: () => router.push('/merchant/setting') },
        { type: 'divider' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={240}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
                }}
                theme="dark"
            >
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? 0 : '0 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <span style={{ fontSize: 28 }}>🏪</span>
                    {!collapsed && (
                        <div style={{ marginLeft: 12 }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>商家工作台</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Merchant Portal</div>
                        </div>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={pathname ? [pathname] : []}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ background: 'transparent', borderRight: 0 }}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                    <Space>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: 16, width: 48, height: 48 }}
                        />
                        {merchant && (
                            <Card size="small" style={{ background: '#f0f5ff', border: 'none' }}>
                                <Space size="large">
                                    <Statistic title="可用余额" value={merchant.balance} precision={2} prefix="¥" valueStyle={{ fontSize: 16, color: '#1890ff' }} />
                                    <Statistic title="冻结余额" value={merchant.frozenBalance || 0} precision={2} prefix="¥" valueStyle={{ fontSize: 16, color: '#faad14' }} />
                                </Space>
                            </Card>
                        )}
                    </Space>
                    <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0 12px' }}>
                            <span style={{ color: '#666' }}>{merchant?.username || '商家'}</span>
                            <Avatar style={{ backgroundColor: '#722ed1' }}>{merchant?.username?.charAt(0).toUpperCase() || 'M'}</Avatar>
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
