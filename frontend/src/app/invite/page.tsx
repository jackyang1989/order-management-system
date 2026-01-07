'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getCurrentUser } from '../../services/authService';
import { fetchInviteStats, fetchInviteRecords, InviteStats, InviteRecord } from '../../services/userService';

interface RecommendedTask {
    id: string;
    orderId: string;
    taskTitle: string;
    username: string;
    completedAt: string;
    commissionAmount: number;
    month: string;
}

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invite' | 'records' | 'tasks'>('invite');
    const [stats, setStats] = useState<InviteStats>({ totalInvited: 0, todayInvited: 0, totalReward: 0, todayReward: 0 });
    const [records, setRecords] = useState<InviteRecord[]>([]);
    const [recommendedTasks, setRecommendedTasks] = useState<RecommendedTask[]>([]);
    const [copied, setCopied] = useState(false);
    const [inviteCode, setInviteCode] = useState('ADMIN');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (user?.invitationCode) setInviteCode(user.invitationCode);
            const [statsData, recordsData] = await Promise.all([fetchInviteStats(), fetchInviteRecords()]);
            setStats(statsData);
            setRecords(recordsData);
            try {
                const token = localStorage.getItem('token');
                const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';
                const response = await fetch(`${BASE_URL}/invite/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data?.list) setRecommendedTasks(result.data.list);
                }
            } catch (e) { console.error('Load recommended tasks error:', e); }
        } catch (error) { console.error('Load invite data error:', error); }
        finally { setLoading(false); }
    };

    const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${inviteCode}` : `https://example.com/register?invite=${inviteCode}`;

    const handleCopyLink = async () => {
        try { await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }
        catch { const textArea = document.createElement('textarea'); textArea.value = inviteLink; document.body.appendChild(textArea); textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    const tabs = [
        { key: 'invite', label: '邀请链接' },
        { key: 'records', label: '邀请记录' },
        { key: 'tasks', label: '推荐任务' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">邀请好友</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-4">
                {/* Stats Card */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="text-2xl font-black text-slate-900">{stats.totalInvited}</div>
                        <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">累计邀请(人)</div>
                    </div>
                    <div className="rounded-[24px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="text-2xl font-black text-amber-500">{stats.totalReward}</div>
                        <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">累计奖励(银锭)</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full gap-2 rounded-[24px] bg-white p-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-slate-100/50">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-[20px] py-4 text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'invite' && (
                        <div className="space-y-6">
                            <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
                                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wide">
                                    复制您的 <span className="font-black text-blue-600">专属邀请链接</span>，成功注册后，好友完成任务您即可获得邀请奖励！
                                </p>

                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input type="text" value={inviteLink} readOnly className="flex-1 rounded-[16px] bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500 shadow-inner border-none placeholder:text-slate-300" />
                                        <button onClick={handleCopyLink} className={cn('whitespace-nowrap rounded-[16px] px-6 py-4 text-[10px] font-black text-white uppercase tracking-widest transition-all active:scale-95 shadow-lg', copied ? 'bg-emerald-500 shadow-emerald-100' : 'bg-slate-900 shadow-slate-100')}>
                                            {copied ? 'COPIED' : 'COPY LINK'}
                                        </button>
                                    </div>
                                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        邀请码：<span className="text-blue-600 font-black">{inviteCode}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[32px] bg-amber-50/50 p-8 border border-amber-100/50">
                                <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    重要推广准则
                                </h3>
                                <ul className="space-y-3 text-[10px] font-bold text-amber-800/60 leading-relaxed uppercase tracking-wide">
                                    <li className="flex gap-4"><span className="opacity-40 font-black italic">01</span>邀请链接仅限聊天工具（微信/QQ等）传播，禁止公网发帖。</li>
                                    <li className="flex gap-4"><span className="opacity-40 font-black italic">02</span>邀请对象建议为熟人社交圈，严禁骚扰陌生人。</li>
                                    <li className="flex gap-4"><span className="opacity-40 font-black italic">03</span>严禁注册马甲号自刷奖励，一经核实将永久锁定资产并封号。</li>
                                </ul>
                            </div>

                            <div className="rounded-[32px] bg-indigo-50/50 p-8 border border-indigo-100/50">
                                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4">🎁 平台奖励机制</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-indigo-200/20">
                                        <span className="text-[10px] font-bold text-indigo-700/60 uppercase">单笔任务奖励</span>
                                        <span className="text-xs font-black text-indigo-900 italic">+1.00 银锭</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-indigo-200/20">
                                        <span className="text-[10px] font-bold text-indigo-700/60 uppercase">单人累计上限</span>
                                        <span className="text-xs font-black text-indigo-900 italic">1000.00 银锭</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase italic">注：所有奖励由平台专项资金拨付，不影响被邀请人佣金。</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="space-y-4">
                            {records.length === 0 ? (
                                <div className="py-32 text-center opacity-20 italic">
                                    <div className="text-4xl mb-4 text-slate-300">👥</div>
                                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">NO INVITED RECORDS</h3>
                                </div>
                            ) : (
                                records.map(record => (
                                    <div key={record.id} className="flex items-center justify-between rounded-[24px] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ring-1 ring-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 text-xl shadow-inner border border-white">👤</div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-black text-slate-900 tracking-tight">{record.username}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已完成 {record.completedTasks} 单</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-blue-600 tracking-tight">+{record.reward} 银锭</div>
                                            <div className="mt-0.5 text-[8px] font-black text-slate-200 uppercase tracking-widest italic">REGISTERED</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            {recommendedTasks.length === 0 ? (
                                <div className="py-32 text-center opacity-20 italic">
                                    <div className="text-4xl mb-4 text-slate-300">📋</div>
                                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">NO TASK ACTIVITY</h3>
                                </div>
                            ) : (
                                recommendedTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between rounded-[24px] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ring-1 ring-slate-100/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-50 text-xl shadow-inner border border-white">✅</div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-black text-slate-900 tracking-tight">{task.username}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{task.taskTitle}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-500 tracking-tight">+{task.commissionAmount} 银锭</div>
                                            <div className="mt-0.5 text-[8px] font-black text-slate-200 uppercase tracking-widest italic">
                                                {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '-'}
                                            </div>
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
