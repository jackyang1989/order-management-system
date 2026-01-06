'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getToken, logout } from '../../services/authService';
import { ProfileContainer } from '../../components/ProfileContainer';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0A0A0B] to-[#12121A]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
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
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#0A0A0B] to-[#12121A] pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a1a1d] to-[#2c2c2e] px-4 pb-5 pt-12">
                <ProfileContainer className="flex items-center justify-between">
                    <Button
                        onClick={() => router.push('/tasks/continue')}
                        className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                        ✓ 继续任务
                    </Button>

                    <button
                        onClick={() => router.push('/profile/messages')}
                        className="relative rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                    >
                        ✓ 个人通知
                        {tagShow && (
                            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] text-white">
                                {tagNum}
                            </span>
                        )}
                    </button>
                </ProfileContainer>
            </div>

            <ProfileContainer className="space-y-4 py-4">
                {/* User Info Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-2xl">
                    <div className="mb-5 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-2xl shadow-lg">
                            👤
                        </div>
                        <div>
                            <div className="mb-1 text-sm font-medium text-slate-300">
                                用户名：<span className="text-emerald-400">{profile?.username || '-'}</span>
                            </div>
                            <div className="mb-1 text-xs text-slate-400">
                                绑定手机号：{profile?.mobile || '-'}
                            </div>
                            <div className="text-xs text-slate-400">
                                经验值：<span className="font-semibold text-amber-400">{profile?.all_num_task || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* VIP Status */}
                    <div className={cn(
                        'rounded-xl p-3',
                        profile?.vip === 1
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30'
                            : 'bg-white/5 border border-white/10'
                    )}>
                        <div className="mb-1 text-sm text-slate-200">
                            会员状态：
                            <span className={cn('font-semibold', profile?.vip === 1 ? 'text-amber-400' : 'text-slate-500')}>
                                {profile?.vip === 1 ? 'VIP会员' : '不是会员'}
                            </span>
                        </div>
                        <div className="mb-1 text-xs text-slate-400">
                            到期时间：{formatVipTime(profile?.vip_time || 0)}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>累积赚取银锭：<span className="font-semibold text-amber-400">{profile?.all_obtain_reward || 0}</span></span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                            待商家发放银锭：<span className="font-semibold text-amber-500">{profile?.wait_shop_issue || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Section Title */}
                <div className="px-1 text-sm font-semibold text-slate-200">提现入口</div>

                {/* Principal Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl">
                    <div className="mb-3 text-sm font-semibold text-slate-200">我的本金</div>
                    <div className="mb-2 flex items-center">
                        <span className="mr-2 text-xl">💰</span>
                        <span className="text-xl font-bold text-emerald-400">{profile?.balance || 0}元</span>
                        <span className="ml-2 text-xs text-slate-500">(可提现本金)</span>
                    </div>
                    <div className="mb-3 flex items-center">
                        <span className="mr-2 text-xl">💰</span>
                        <span className="text-base font-semibold text-slate-400">{profile?.all_user_principal || 0}元</span>
                        <span className="ml-2 text-xs text-slate-500">(总计垫付本金)</span>
                    </div>
                    <Button
                        onClick={() => router.push('/profile/withdraw')}
                        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        提现
                    </Button>
                </div>

                {/* Silver Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl">
                    <div className="mb-3 text-sm font-semibold text-slate-200">我的银锭</div>
                    <div className="mb-2 flex items-center">
                        <span className="mr-2 text-xl">🥇</span>
                        <span className="text-lg font-bold text-amber-400">
                            {profile?.reward || 0}银锭 = {profile?.discounting || 0}元
                        </span>
                        <span className="ml-2 text-xs text-slate-500">(总银锭)</span>
                    </div>
                    <div className="mb-3 flex items-center">
                        <span className="mr-2 text-xl">🥇</span>
                        <span className="text-base font-semibold text-amber-500">{profile?.freeze_reward || 0}银锭</span>
                        <span className="ml-2 text-xs text-slate-500">(冻结银锭)</span>
                    </div>
                    <Button
                        onClick={() => router.push('/profile/withdraw?ydtx=1')}
                        className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        提现
                    </Button>
                </div>

                {/* Invite Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl">
                    <div className="mb-3 text-sm font-semibold text-slate-200">我的邀请</div>
                    <div className="mb-2 flex items-center text-sm text-slate-300">
                        <span className="mr-2 text-xl">🏅</span>
                        总计获得奖励：<span className="font-semibold text-amber-400">{profile?.tj_award || 0}银锭</span>
                    </div>
                    <div className="mb-2 flex items-center text-sm text-slate-300">
                        <span className="mr-2 text-xl">👥</span>
                        总计邀请人数：<span className="font-semibold text-emerald-400">{profile?.all_invite || 0}人</span>
                    </div>
                    <div className="mb-1 text-xs text-slate-400">
                        今日获得奖励：<span className="text-amber-500">{profile?.tj_award_day || 0}银锭</span>
                    </div>
                    <div className="mb-3 text-xs text-slate-400">
                        今日邀请人数：<span className="text-emerald-500">{profile?.day_invite || 0}人</span>
                    </div>
                    <Button
                        onClick={() => router.push('/invite')}
                        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                        邀请
                    </Button>
                </div>

                {/* History Buttons */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-2xl">
                    <div className="mb-3 text-sm font-semibold text-slate-200">历史记录</div>
                    <div className="flex flex-wrap gap-2">
                        {historyButtons.map((btn) => (
                            <button
                                key={btn.path}
                                onClick={() => router.push(btn.path)}
                                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-emerald-400 transition hover:bg-white/20"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-2xl">
                    {menuItems.map((item, index) => (
                        <div
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                'flex cursor-pointer items-center px-5 py-4 transition hover:bg-white/5',
                                index < menuItems.length - 1 && 'border-b border-white/5'
                            )}
                        >
                            <span className="mr-4 text-xl">{item.icon}</span>
                            <span className="flex-1 text-sm font-medium text-slate-200">{item.label}</span>
                            <span className="text-lg text-slate-500">›</span>
                        </div>
                    ))}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-red-500/30 bg-white/5 py-4 text-sm font-medium text-red-400 shadow-xl backdrop-blur-2xl transition hover:bg-red-500/10"
                >
                    退出登录
                </button>
            </ProfileContainer>

            <BottomNav />
        </div>
    );
}
