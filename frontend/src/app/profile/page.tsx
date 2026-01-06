'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { isAuthenticated, logout } from '../../services/authService';
import { fetchUserProfile, UserProfile } from '../../services/userService';
import BottomNav from '../../components/BottomNav';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const data = await fetchUserProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
    }

    const menuItems = [
        { icon: '📁', label: '买号管理', href: '/profile/bind' },
        { icon: '🏦', label: '银行卡管理', href: '/profile/payment' },
        { icon: '📊', label: '资金记录', href: '/profile/records' },
        { icon: '💰', label: '提现中心', href: '/profile/withdraw' },
        { icon: '👥', label: '邀请好友', href: '/invite' },
        { icon: '⚙️', label: '个人设置', href: '/profile/settings' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center justify-between px-4">
                    <h1 className="text-base font-medium text-slate-800">个人中心</h1>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50" onClick={() => router.push('/tasks')}>继续任务</Button>
                        <Button variant="ghost" size="sm" className="text-slate-500">通知</Button>
                    </div>
                </div>
            </header>

            <div>
                {/* User Info Card */}
                <div className="px-4 pt-4">
                    <Card className="flex items-center gap-4 border-slate-200 p-5 shadow-sm">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">👤</div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-slate-800">{profile?.username || '用户'}</h2>
                            <p className="text-xs text-slate-400">{profile?.phone}</p>
                            <div className="mt-1 flex gap-2">
                                <Badge variant="solid" className={cn('px-2 py-0', profile?.vip ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500')}>
                                    {profile?.vip ? 'VIP会员' : '普通用户'}
                                </Badge>
                                <span className="text-xs text-slate-400">经验值: {profile?.experience || 0}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3 p-4">
                    <Card className="border-slate-200 p-4 shadow-sm">
                        <div className="text-xs text-slate-500">本金余额</div>
                        <div className="mt-1 text-xl font-bold text-slate-800">¥{Number(profile?.balance || 0).toFixed(2)}</div>
                        <div className="mt-1 text-[10px] text-slate-400">冻结: ¥{Number(profile?.frozenBalance || 0).toFixed(2)}</div>
                        <Button className="mt-3 h-8 w-full bg-blue-500 text-xs hover:bg-blue-600" onClick={() => router.push('/profile/withdraw')}>提现</Button>
                    </Card>
                    <Card className="border-slate-200 p-4 shadow-sm">
                        <div className="text-xs text-slate-500">银锭余额</div>
                        <div className="mt-1 text-xl font-bold text-slate-800">{Number(profile?.silver || 0).toFixed(2)}</div>
                        <div className="mt-1 text-[10px] text-slate-400">冻结: {Number(profile?.frozenSilver || 0).toFixed(2)}</div>
                        <Button className="mt-3 h-8 w-full bg-blue-500 text-xs hover:bg-blue-600" onClick={() => router.push('/profile/withdraw')}>提现</Button>
                    </Card>
                </div>

                {/* Stats */}
                <div className="mx-4 flex justify-between rounded-xl border border-slate-200 bg-white py-4 shadow-sm">
                    <div className="flex-1 text-center">
                        <div className="text-base font-bold text-blue-500">{profile?.totalEarned || 0}</div>
                        <div className="text-[10px] text-slate-400">累计赚取银锭</div>
                    </div>
                    <div className="flex-1 border-x border-slate-100 text-center">
                        <div className="text-base font-bold text-blue-500">0</div>
                        <div className="text-[10px] text-slate-400">邀请人数</div>
                    </div>
                    <div className="flex-1 text-center">
                        <div className="text-base font-bold text-blue-500">0</div>
                        <div className="text-[10px] text-slate-400">邀请奖励</div>
                    </div>
                </div>

                {/* Quick Access */}
                <div className="p-4">
                    <Card className="border-slate-200 p-4 shadow-sm">
                        <div className="mb-3 text-sm font-medium text-slate-700">快捷入口</div>
                        <div className="flex gap-2">
                            {['本金记录', '银锭记录', '提现记录', '会员记录'].map((tab, i) => (
                                <button key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 active:bg-slate-100" onClick={() => {
                                    if (i === 0) router.push('/profile/records?tab=balance');
                                    if (i === 1) router.push('/profile/records?tab=silver');
                                    if (i === 2) router.push('/profile/records?tab=withdraw');
                                    if (i === 3) router.push('/profile/vip-record');
                                }}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Menu List */}
                <div className="px-4 pb-4">
                    <Card className="divide-y divide-slate-100 border-slate-200 shadow-sm">
                        {menuItems.map((item, i) => (
                            <div key={i} className="flex cursor-pointer items-center justify-between p-4 active:bg-slate-50" onClick={() => router.push(item.href)}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-sm text-slate-700">{item.label}</span>
                                </div>
                                <span className="text-slate-300">›</span>
                            </div>
                        ))}
                    </Card>

                    <Button variant="ghost" className="mt-6 w-full text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => { logout(); router.push('/login'); }}>
                        退出登录
                    </Button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
