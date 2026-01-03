'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
    label: string;
    href: string;
    icon?: string;
}

const menuItems: MenuItem[] = [
    { label: '个人中心', href: '/profile', icon: '👤' },
    { label: '我的订单', href: '/orders', icon: '📦' },
    { label: '我的任务', href: '/tasks', icon: '📋' },
    { label: '提现', href: '/profile/withdraw', icon: '💰' },
    { label: '绑定账号', href: '/profile/bind', icon: '🔗' },
    { label: '收款设置', href: '/profile/payment', icon: '💳' },
    { label: '账户设置', href: '/profile/settings', icon: '⚙️' },
];

export default function SideMenu() {
    const pathname = usePathname();

    return (
        <div style={{
            width: '200px',
            backgroundColor: '#fff',
            borderRight: '1px solid #eee',
            minHeight: '100vh',
            padding: '20px 0'
        }}>
            <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>用户中心</h3>
            </div>
            <nav style={{ marginTop: '10px' }}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 20px',
                                color: isActive ? '#1890ff' : '#666',
                                backgroundColor: isActive ? '#e6f7ff' : 'transparent',
                                textDecoration: 'none',
                                fontSize: '14px',
                                borderRight: isActive ? '3px solid #1890ff' : 'none'
                            }}
                        >
                            {item.icon && <span style={{ marginRight: '8px' }}>{item.icon}</span>}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
