'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getToken, logout } from '../../services/authService';
import { ProfileContainer } from '../../components/ProfileContainer';
import { Button } from '../../components/ui/button';
import BottomNav from '../../components/BottomNav';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface UserProfile {
    id: string;
    username: string;
    mobile: string;
    balance: number;
    vip: number;
    vip_time: number;
    reward: number;
    tj_award: number;
    tj_award_day: number;
    all_num_task: number;
    all_obtain_reward: number;
    wait_shop_issue: number;
    all_user_principal: number;
    freeze_reward: number;
    discounting: number;
    all_invite: number;
    day_invite: number;
    unread_msg_count: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tagShow, setTagShow] = useState(false);
    const [tagNum, setTagNum] = useState(0);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/index`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.code === 1) {
                setProfile(data.data);
                if (data.data.unread_msg_count > 0) {
                    setTagShow(true);
                    setTagNum(data.data.unread_msg_count);
                }
            } else {
                alertError(data.msg || '获取用户信息失败');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (confirm('确定要退出登录吗？')) {
            logout();
            router.push('/login');
        }
    };

    const formatVipTime = (timestamp: number) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const menuItems = [
        { icon: '💳', label: '买号管理', path: '/profile/buyno' },
        { icon: '🏦', label: '银行卡管理', path: '/profile/payment' },
        { icon: '📊', label: '资金记录', path: '/profile/records' },
        { icon: '💰', label: '提现中心', path: '/profile/withdraw' },
        { icon: '👥', label: '邀请好友', path: '/invite' },
        { icon: '⚙️', label: '账户设置', path: '/profile/settings' },
    ];

    const historyButtons = [
        { label: '本金记录', path: '/profile/records?type=principal' },
        { label: '银锭记录', path: '/profile/records?type=silver' },
        { label: '提现记录', path: '/profile/records?type=withdraw' },
        { label: '会员记录', path: '/profile/vip-record' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
                <h1 className="text-base font-medium text-slate-800">个人中心</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push('/tasks/continue')}
                        className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-medium text-white"
                    >
                        继续任务
                    </button>
                    <button
                        onClick={() => router.push('/profile/messages')}
                        className="relative rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                        通知
                        {tagShow && (
                            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] text-white">
                                {tagNum}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <ProfileContainer className="flex flex-col gap-4 py-4">
                {/* User Info Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            👤
                        </div>
                        <div className="flex-1">
                            <div className="text-base font-semibold text-slate-800">{profile?.username || '-'}</div>
                            <div className="mt-0.5 text-sm text-slate-500">{profile?.mobile || '-'}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className={cn(
                                    'rounded px-2 py-0.5 text-xs font-medium',
                                    profile?.vip === 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                )}>
                                    {profile?.vip === 1 ? 'VIP会员' : '普通用户'}
                                </span>
                                <span className="text-xs text-slate-400">经验值: {profile?.all_num_task || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* VIP Info */}
                    {profile?.vip === 1 && (
                        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">
                            <div className="text-slate-600">到期时间：<span className="font-medium text-slate-800">{formatVipTime(profile?.vip_time || 0)}</span></div>
                        </div>
                    )}
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {/* 本金 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">本金余额</div>
                        <div className="mt-1 text-xl font-bold text-slate-800">¥{profile?.balance || 0}</div>
                        <div className="mt-1 text-xs text-slate-400">累计垫付: ¥{profile?.all_user_principal || 0}</div>
                        <Button
                            onClick={() => router.push('/profile/withdraw')}
                            className="mt-3 w-full bg-blue-500 text-xs hover:bg-blue-600"
                            size="sm"
                        >
                            提现
                        </Button>
                    </div>

                    {/* 银锭 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">银锭余额</div>
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-bold text-slate-800">{profile?.reward || 0}</span>
                            <span className="text-xs text-slate-400">≈¥{profile?.discounting || 0}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">冻结: {profile?.freeze_reward || 0}</div>
                        <Button
                            onClick={() => router.push('/profile/withdraw?ydtx=1')}
                            className="mt-3 w-full bg-blue-500 text-xs hover:bg-blue-600"
                            size="sm"
                        >
                            提现
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-blue-500">{profile?.all_obtain_reward || 0}</div>
                            <div className="mt-0.5 text-xs text-slate-500">累计赚取银锭</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-blue-500">{profile?.all_invite || 0}</div>
                            <div className="mt-0.5 text-xs text-slate-500">邀请人数</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-blue-500">{profile?.tj_award || 0}</div>
                            <div className="mt-0.5 text-xs text-slate-500">邀请奖励</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 text-sm font-medium text-slate-700">快捷入口</div>
                    <div className="flex flex-wrap gap-2">
                        {historyButtons.map((btn) => (
                            <button
                                key={btn.path}
                                onClick={() => router.push(btn.path)}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {menuItems.map((item, index) => (
                        <div
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                'flex cursor-pointer items-center px-4 py-3.5',
                                index < menuItems.length - 1 && 'border-b border-slate-100'
                            )}
                        >
                            <span className="mr-3 text-lg">{item.icon}</span>
                            <span className="flex-1 text-sm text-slate-700">{item.label}</span>
                            <span className="text-slate-400">›</span>
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-red-200 bg-white py-3 text-sm text-red-500"
                >
                    退出登录
                </button>
            </ProfileContainer>

            <BottomNav />
        </div>
    );
}
