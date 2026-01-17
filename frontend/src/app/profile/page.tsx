'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatDate } from '../../lib/utils';
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

        const onFocus = () => loadProfile();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [router]);

    const loadProfile = async () => {
        try {
            const data = await fetchUserProfile();
            if (!data && !isAuthenticated()) {
                router.push('/login');
                return;
            }
            setProfile(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    const menuItems = [
        { icon: '📁', label: '买号管理', href: '/profile/bind', desc: '管理绑定的买号' },
        { icon: '🏦', label: '收款账户', href: '/profile/payment', desc: '管理收款账号' },
        { icon: '📊', label: '资金记录', href: '/profile/records', desc: '每一笔钱都有迹可循' },
        { icon: '💰', label: '提现中心', href: '/profile/withdraw', desc: '快速提取收益' },
        { icon: '👥', label: '邀请好友', href: '/invite', desc: '邀请返现赚不停' },
        { icon: '⚙️', label: '个人设置', href: '/profile/settings', desc: '基本信息与安全' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Minimal Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-6">
                    <h1 className="text-xl font-bold text-slate-900">个人中心</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/tasks/continue')}
                            className="flex h-9 items-center rounded-full bg-primary-600 px-4 text-xs font-bold text-white transition-transform active:scale-95"
                        >
                            继续任务
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4">
                {/* Profile Section */}
                <div className="relative overflow-hidden rounded-[24px] bg-white p-6">
                    <div className="flex items-center gap-5">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-blue-100">
                            {profile?.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profile.username || '用户头像'}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        // 如果图片加载失败，显示默认头像
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling;
                                        if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className="flex h-full w-full items-center justify-center bg-blue-50 text-4xl"
                                style={{ display: profile?.avatar ? 'none' : 'flex' }}
                            >
                                👤
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-slate-900">{profile?.username || '用户'}</h2>
                            <p className="mt-0.5 text-sm font-medium text-slate-400">{profile?.phone}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                                    profile?.vip ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                )}>
                                    {profile?.vip ? 'VIP会员' : '普通用户'}
                                </span>
                                {profile?.vip && profile?.vipExpireAt && (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-medium text-warning-500">
                                        到期: {formatDate(profile.vipExpireAt)}
                                    </span>
                                )}
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-primary-600">
                                    累计完成: {profile?.experience || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Assets - Clean Flat Blocks */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col rounded-[24px] bg-primary-600 p-5 text-white">
                        <span className="text-xs font-bold opacity-80 uppercase">本金余额</span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-sm font-bold opacity-80">¥</span>
                            <span className="text-2xl font-black tracking-tight">{Number(profile?.balance || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-auto pt-4 flex items-center justify-between">
                            <span className="text-[10px] font-medium opacity-70">冻结: ¥{Number(profile?.frozenBalance || 0).toFixed(2)}</span>
                            <button
                                onClick={() => router.push('/profile/withdraw')}
                                className="h-7 rounded-lg bg-white/20 px-3 text-[10px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                            >
                                提现
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col rounded-[24px] bg-emerald-500 p-5 text-white">
                        <span className="text-xs font-bold opacity-80 uppercase">银锭余额</span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-2xl font-black tracking-tight">{Number(profile?.silver || 0).toFixed(2)}</span>
                            <span className="text-xs font-medium opacity-70">≈¥{Number(profile?.stats?.silverToYuan || profile?.silver || 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-auto pt-4 flex items-center justify-between">
                            <span className="text-[10px] font-medium opacity-70">冻结: {Number(profile?.frozenSilver || 0).toFixed(2)}</span>
                            <button
                                onClick={() => router.push('/profile/withdraw')}
                                className="h-7 rounded-lg bg-white/20 px-3 text-[10px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                            >
                                提现
                            </button>
                        </div>
                    </div>
                </div>

                {/* Earnings Summary */}
                <Card noPadding className="rounded-[24px] border-none bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-center divide-x divide-slate-50 py-10 px-5 min-h-[120px]">
                        <div className="flex-1 text-center" style={{ paddingLeft: '12px', paddingRight: '28px' }}>
                            <div className="text-lg font-black text-slate-900">{Number(profile?.totalEarned || profile?.stats?.totalEarnedSilver || 0).toFixed(2)}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">累计赚取银锭</div>
                        </div>
                        <div className="flex-1 px-7 text-center">
                            <div className="text-lg font-black text-warning-400">{Number(profile?.pendingReward || profile?.stats?.pendingMerchantSilver || 0).toFixed(2)}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">待商家发放</div>
                        </div>
                        <div className="flex-1 text-center" style={{ paddingLeft: '28px', paddingRight: '12px' }}>
                            <div className="text-lg font-black text-indigo-500">{Number(profile?.frozenSilver || 0).toFixed(2)}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">冻结银锭</div>
                        </div>
                    </div>
                </Card>

                {/* Additional Stats */}
                <Card noPadding className="rounded-[24px] border-none bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-center divide-x divide-slate-50 py-10 px-5 min-h-[120px]">
                        <div className="flex-1 px-3 text-center">
                            <div className="text-lg font-black text-primary-600">¥{Number(profile?.stats?.totalPaidPrincipal || 0).toFixed(0)}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">累计垫付</div>
                        </div>
                        <div className="flex-1 px-3 text-center">
                            <div className="text-lg font-black text-emerald-500">{profile?.stats?.totalInvited || 0}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">总邀请</div>
                        </div>
                        <div className="flex-1 px-3 text-center">
                            <div className="text-lg font-black text-orange-500">{profile?.stats?.todayInvited || 0}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">今日邀请</div>
                        </div>
                        <div className="flex-1 px-3 text-center">
                            <div className="text-lg font-black text-purple-500">{profile?.stats?.monthlyRemainingTasks || 220}</div>
                            <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">本月剩余</div>
                        </div>
                    </div>
                </Card>

                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => router.push(item.href)}
                            className="group flex flex-col items-start rounded-[24px] bg-white p-5 text-left transition-all active:scale-[0.98]"
                        >
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl transition-colors group-hover:bg-blue-50">
                                {item.icon}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{item.label}</span>
                            <span className="mt-1 text-[10px] font-medium text-slate-400">{item.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Danger Zone */}
                <div className="pt-4">
                    <button
                        onClick={() => { logout(); router.push('/login'); }}
                        className="flex w-full items-center justify-center rounded-[20px] bg-red-50 py-4 text-sm font-bold text-danger-400 transition-colors hover:bg-red-100"
                    >
                        退出登录
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
