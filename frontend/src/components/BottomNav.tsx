'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    key: string;
    label: string;
    icon: string;
    highlight?: boolean;
    subItems?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
    {
        key: 'account',
        label: '账号信息',
        icon: '👤',
        subItems: [
            { label: '基本信息', href: '/profile/settings' },
            { label: '收款账户', href: '/profile/payment' },
            { label: '买号管理', href: '/profile/bind' },
            { label: '会员VIP', href: '/vip' },
        ],
    },
    {
        key: 'tasks',
        label: '任务大厅',
        icon: '📋',
        highlight: true,
        subItems: [
            { label: '继续任务', href: '/orders?status=PENDING' },
            { label: '任务领取', href: '/tasks' },
            { label: '任务管理', href: '/orders' },
        ],
    },
    {
        key: 'funds',
        label: '资金管理',
        icon: '💰',
        subItems: [
            { label: '本佣提现', href: '/profile/withdraw' },
            { label: '提现记录', href: '/profile/withdraw?tab=records' },
            { label: '本金记录', href: '/profile/records?type=principal' },
            { label: '银锭记录', href: '/profile/records?type=silver' },
        ],
    },
    {
        key: 'invite',
        label: '好友邀请',
        icon: '🤝',
        subItems: [
            { label: '邀请好友', href: '/invite' },
            { label: '邀请记录', href: '/invite?tab=records' },
        ],
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const [activeNav, setActiveNav] = useState<string | null>(null);

    const toggleNav = (key: string) => {
        setActiveNav(activeNav === key ? null : key);
    };

    const isActive = (item: NavItem) => {
        if (!item.subItems) return false;
        return item.subItems.some(sub => pathname.startsWith(sub.href.split('?')[0]));
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: '540px',
                margin: '0 auto',
                background: '#fff',
                borderTop: '1px solid #ddd',
                display: 'flex',
                height: '60px',
                zIndex: 1000,
            }}
        >
            {navItems.map((item) => (
                <div key={item.key} style={{ flex: 1, position: 'relative' }}>
                    {/* 弹出菜单 */}
                    {activeNav === item.key && item.subItems && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '60px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                width: '120px',
                                textAlign: 'center',
                                boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                            }}
                        >
                            {item.subItems.map((sub, idx) => (
                                <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setActiveNav(null)}
                                    style={{
                                        display: 'block',
                                        padding: '10px',
                                        fontSize: '13px',
                                        color: pathname.startsWith(sub.href.split('?')[0]) ? '#409eff' : '#666',
                                        borderBottom: idx < item.subItems!.length - 1 ? '1px solid #e5e5e5' : 'none',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {sub.label}
                                </Link>
                            ))}
                        </div>
                    )}
                    {/* 导航按钮 */}
                    <div
                        onClick={() => toggleNav(item.key)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            cursor: 'pointer',
                            background: item.highlight ? '#ff976a' : 'transparent',
                            color: item.highlight ? 'white' : (activeNav === item.key || isActive(item) ? '#409eff' : '#606266'),
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>{item.icon}</span>
                        <span style={{ fontSize: '11px', marginTop: '2px' }}>{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
