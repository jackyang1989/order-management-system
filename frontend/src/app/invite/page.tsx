'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { toastSuccess, toastError } from '../../lib/toast';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { isAuthenticated } from '../../services/authService';
import { fetchInviteStats, fetchInviteRecords, InviteStats, InviteRecord } from '../../services/userService';

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
                    <h1 className="flex-1 text-xl font-bold text-slate-900">邀请好友</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-4">
                {/* Hero Stats Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-blue-600 p-8 text-white shadow-2xl shadow-blue-100">
                    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">累计邀请奖励 (银锭)</div>
                        <div className="mt-2 text-5xl font-black tracking-tighter">{Number(stats?.totalRewards || 0).toFixed(0)}</div>
                        <div className="mt-8 flex w-full divide-x divide-white/10 border-t border-white/10 pt-6">
                            <div className="flex-1 text-center">
                                <div className="text-base font-black">{stats?.totalInvites || 0}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">累计人数</div>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="text-base font-black">{stats?.todayInvites || 0}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">今日新增</div>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="text-base font-black">{stats?.todayRewards || 0}</div>
                                <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">今日奖励</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Action Section */}
                <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">您的邀请链接</label>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">专属福利</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 overflow-hidden rounded-[20px] bg-slate-50 px-5 py-4 text-[11px] font-bold text-slate-600 break-all shadow-inner border border-slate-50 flex items-center">
                                {inviteLink}
                            </div>
                            <button onClick={() => copyToClipboard(inviteLink)}
                                className="shrink-0 h-14 w-14 flex items-center justify-center rounded-[20px] bg-blue-600 text-white shadow-lg shadow-blue-50 transition active:scale-90">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-[24px] bg-slate-50/50 p-5 ring-1 ring-slate-100">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">您的邀请码</div>
                            <div className="text-xl font-black text-slate-900 tracking-tight">{inviteCode}</div>
                        </div>
                        <button onClick={() => copyToClipboard(inviteCode)} className="h-10 rounded-full bg-white px-6 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm transition active:scale-95 border border-slate-100">一键拷贝</button>
                    </div>
                </Card>

                {/* Tabs for extra details */}
                <div className="space-y-5">
                    <div className="flex w-full gap-2 rounded-[24px] bg-slate-100/50 p-1.5 ring-1 ring-slate-200/50">
                        {['link', 'records'].map((t) => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={cn('flex-1 rounded-[20px] py-3 text-[10px] font-black uppercase tracking-widest transition-all',
                                    activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400')}>
                                {t === 'link' ? '赚钱攻略' : '邀请记录'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'link' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                            <div className="rounded-[32px] bg-indigo-50/50 p-8 border border-indigo-100/50">
                                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    如何获得更多奖励?
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600 italic">01</div>
                                        <div>
                                            <div className="text-xs font-black text-indigo-900">发送邀请链接</div>
                                            <div className="mt-1 text-[10px] font-medium text-slate-500 leading-relaxed italic">通过微信、QQ等社交工具发送给您的亲朋好友</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600 italic">02</div>
                                        <div>
                                            <div className="text-xs font-black text-indigo-900">好友成功注册</div>
                                            <div className="mt-1 text-[10px] font-medium text-slate-500 leading-relaxed italic">好友点击链接注册并绑定买号，开始接取平台任务</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-600 italic">03</div>
                                        <div>
                                            <div className="text-xs font-black text-indigo-900">持续获得收益</div>
                                            <div className="mt-1 text-[10px] font-medium text-slate-500 leading-relaxed italic">好友每完成一笔任务，您都将获得由平台额外发放的奖励金</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[24px] bg-amber-50/50 p-6 border border-amber-100/50 flex items-center gap-4">
                                <div className="text-2xl opacity-50">🛡️</div>
                                <p className="text-[10px] font-bold text-amber-900/60 leading-relaxed italic">
                                    严禁套号、刷号骗取奖励。系统会自动通过多维度审计识别异常行为，违规将永久封停。
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                            {records.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="text-4xl opacity-20 mb-4">🌑</div>
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">目前还没有邀请记录</div>
                                </div>
                            ) : (
                                records.map((r, i) => (
                                    <div key={i} className="rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-100 flex items-center justify-between group transition-all hover:bg-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 italic shadow-inner">👤</div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-black text-slate-900 leading-none">{r.username}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()} 加入</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-emerald-500 tracking-tight">+{r.reward}</div>
                                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">银锭奖励</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
