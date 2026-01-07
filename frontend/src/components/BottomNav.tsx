'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

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
            { label: '会员VIP', href: '/profile/vip' },
        ],
    },
    {
        key: 'tasks',
        label: '任务大厅',
        icon: '📋',
        highlight: true,
        subItems: [
            { label: '继续任务', href: '/tasks/continue' },
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
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-16 w-full max-w-[515px] border-x border-t border-slate-200 bg-white">
            {navItems.map((item) => (
                <div key={item.key} className="relative flex-1">
                    {/* Popup Menu */}
                    {activeNav === item.key && item.subItems && (
                        <div className="absolute bottom-16 left-1/2 w-32 -translate-x-1/2 rounded-lg border border-slate-200 bg-white text-center">
                            {item.subItems.map((sub, idx) => (
                                <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setActiveNav(null)}
                                    className={cn(
                                        'block px-3 py-3 text-sm no-underline',
                                        pathname.startsWith(sub.href.split('?')[0]) ? 'text-blue-500 font-medium' : 'text-slate-600',
                                        idx < item.subItems!.length - 1 && 'border-b border-slate-100'
                                    )}
                                >
                                    {sub.label}
                                </Link>
                            ))}
                        </div>
                    )}
                    {/* Nav Button */}
                    <div
                        onClick={() => toggleNav(item.key)}
                        className={cn(
                            'flex h-full cursor-pointer flex-col items-center justify-center gap-1',
                            item.highlight
                                ? 'bg-blue-500 text-white'
                                : (activeNav === item.key || isActive(item) ? 'text-blue-500' : 'text-slate-500')
                        )}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
