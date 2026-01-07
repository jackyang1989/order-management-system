'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { toastSuccess, toastError } from '../../lib/toast';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { isAuthenticated } from '../../services/authService';
import { fetchInviteStats, fetchInviteRecords, InviteStats, InviteRecord } from '../../services/userService';
import BottomNav from '../../components/BottomNav';

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<InviteStats | null>(null);
    const [records, setRecords] = useState<InviteRecord[]>([]);
    const [activeTab, setActiveTab] = useState<string>('link');
    const [inviteCode, setInviteCode] = useState<string>('');
    const [inviteLink, setInviteLink] = useState<string>('');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            const statsData = await fetchInviteStats();
            setStats(statsData);
            setInviteCode(statsData.inviteCode);
            setInviteLink(statsData.inviteLink || `${window.location.origin}/register?invite=${statsData.inviteCode}`);
            const recordsData = await fetchInviteRecords();
            setRecords(recordsData);
        } catch (error) { console.error('Load data error:', error); } finally { setLoading(false); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toastSuccess('复制成功');
    };

    const tabs = [
        { key: 'link', label: '邀请链接' },
        { key: 'records', label: '邀请记录' },
        { key: 'tasks', label: '推荐任务' },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">邀请好友</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Stats Grid - More organized 2x2 layout */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">累计邀请</div>
                        <div className="text-3xl font-black text-slate-900 leading-none">{stats?.totalInvites || 0}</div>
                        <div className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">人</div>
                    </div>
                    <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">累计奖励</div>
                        <div className="text-3xl font-black text-emerald-500 leading-none">{stats?.totalRewards || 0}</div>
                        <div className="mt-2 text-[9px] font-bold text-emerald-300/60 uppercase tracking-widest">银锭</div>
                    </div>
                    <div className="rounded-[28px] bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">今日邀请</div>
                        <div className="text-2xl font-black text-slate-900 leading-none">{stats?.todayInvites || 0}</div>
                        <div className="mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">人</div>
                    </div>
                    <div className="rounded-[28px] bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">今日奖励</div>
                        <div className="text-2xl font-black text-emerald-500 leading-none">{stats?.todayRewards || 0}</div>
                        <div className="mt-2 text-[9px] font-bold text-emerald-300/60 uppercase tracking-widest">银锭</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full gap-2 rounded-[20px] bg-slate-100/50 p-1.5 shadow-inner">
                    {tabs.map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                            className={cn('flex-1 rounded-[16px] py-3 text-xs font-black uppercase tracking-wider transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'link' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Card */}
                        <div className="rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                            <div className="relative z-10 text-center">
                                <h2 className="text-lg font-black tracking-tight leading-relaxed">复制专专属链接，分享给朋友<br />好友完成任务即可获得奖励！</h2>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8">
                            <div className="space-y-3">
                                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">推广链接</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 rounded-[24px] bg-slate-50 px-6 py-4 text-[11px] font-bold text-slate-600 break-all shadow-inner border border-slate-50">
                                        {inviteLink}
                                    </div>
                                    <button onClick={() => copyToClipboard(inviteLink)}
                                        className="rounded-[24px] bg-blue-600 px-6 py-4 text-xs font-black text-white shadow-lg shadow-blue-50 transition active:scale-95">
                                        复制
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">邀请码: <span className="text-slate-900 font-black tracking-normal ml-2">{inviteCode}</span></div>
                                <button onClick={() => copyToClipboard(inviteCode)} className="text-[10px] font-black uppercase text-blue-600 tracking-widest hover:text-blue-700">复制邀请码</button>
                            </div>
                        </Card>

                        {/* Precautions */}
                        <div className="rounded-[32px] bg-amber-50/50 p-8 border border-amber-100/50 space-y-6">
                            <div className="flex items-center gap-2 text-xs font-black text-amber-900 uppercase tracking-wider">
                                <span>⚠️</span> 请注意
                            </div>
                            <ul className="space-y-4 text-[10px] font-bold leading-relaxed text-amber-700/80">
                                <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600 font-black italic">1</span>链接仅限聊天工具（微信/QQ等）发布，禁止外部网站推广</li>
                                <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600 font-black italic">2</span>仅限邀请熟人（亲戚/朋友圈等），严禁向陌生人发送链接</li>
                                <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-600 font-black italic">3</span>严禁刷号/套取奖励，一经发现将永久封号并清空余额</li>
                            </ul>
                        </div>

                        {/* Rewards - More visually interesting */}
                        <div className="rounded-[32px] bg-indigo-50/50 p-8 border border-indigo-100/50 space-y-6">
                            <div className="flex items-center gap-2 text-xs font-black text-indigo-900 uppercase tracking-wider">
                                <span>🎁</span> 邀请奖励
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 rounded-[20px] bg-white/60 p-4 shadow-sm">
                                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                    <div className="text-[10px] font-black text-indigo-900/80">好友每完成一笔任务，您可获得 <span className="text-indigo-600 text-sm">1</span> 银锭奖励</div>
                                </div>
                                <div className="flex items-center gap-4 rounded-[20px] bg-white/60 p-4 shadow-sm">
                                    <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                    <div className="text-[10px] font-black text-indigo-900/80">单个好友最高累计奖励 <span className="text-indigo-600 text-sm">1000</span> 银锭</div>
                                </div>
                            </div>
                            <p className="text-[9px] font-bold text-indigo-300 text-center uppercase tracking-widest italic pt-2">注：奖励由平台承担，不影响好友的任务佣金收益</p>
                        </div>
                    </div>
                )}

                {activeTab === 'records' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="text-4xl mb-4 opacity-30 italic">📭</div>
                                <h3 className="text-base font-black text-slate-900">暂无邀请记录</h3>
                                <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">快去邀请好友一起赚钱吧</p>
                            </div>
                        ) : (
                            records.map((r, i) => (
                                <div key={i} className="rounded-[24px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-sm font-black text-slate-900">{r.username}</div>
                                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()} 加入</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-emerald-500">+{r.reward} 银锭</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">累计贡献奖励</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center justify-center text-center">
                            <div className="text-4xl mb-6">🚀</div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">敬请期待</h3>
                            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">更多有趣的推荐任务正在开发中<br />敬请关注我们的最新动态</p>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
