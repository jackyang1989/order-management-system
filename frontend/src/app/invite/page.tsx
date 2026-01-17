'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getCurrentUser } from '../../services/authService';
import {
    fetchInviteStats,
    fetchInviteRecords,
    fetchInviteConfig,
    checkMerchantInviteEligibility,
    checkInviteEligibility,
    InviteStats,
    InviteRecord,
    InviteConfig,
    MerchantInviteEligibility,
    InviteEligibility
} from '../../services/userService';

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
    const [copiedMerchant, setCopiedMerchant] = useState(false);
    const [inviteCode, setInviteCode] = useState('ADMIN');
    const [config, setConfig] = useState<InviteConfig | null>(null);
    const [merchantEligibility, setMerchantEligibility] = useState<MerchantInviteEligibility | null>(null);
    const [inviteEligibility, setInviteEligibility] = useState<InviteEligibility | null>(null);
    const [canRefer, setCanRefer] = useState<boolean>(true); // 推荐权限

    // 日期筛选
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (user?.invitationCode) setInviteCode(user.invitationCode);

            // 检查推荐权限
            const token = localStorage.getItem('token');
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';
            try {
                const referPermissionRes = await fetch(`${BASE_URL}/buyer-accounts/refer-permission/check`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (referPermissionRes.ok) {
                    const referPermissionData = await referPermissionRes.json();
                    if (referPermissionData.success) {
                        setCanRefer(referPermissionData.data.canRefer);
                    }
                }
            } catch (e) {
                console.error('Check refer permission error:', e);
            }

            const [statsData, recordsData, configData, eligibilityData, inviteEligibilityData] = await Promise.all([
                fetchInviteStats(),
                fetchInviteRecords(),
                fetchInviteConfig(),
                checkMerchantInviteEligibility(),
                checkInviteEligibility()
            ]);
            setStats(statsData);
            setRecords(recordsData);
            setConfig(configData);
            setMerchantEligibility(eligibilityData);
            setInviteEligibility(inviteEligibilityData);

            // Load recommended tasks
            try {
                const response = await fetch(`${BASE_URL}/invite/tasks`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data?.list) setRecommendedTasks(result.data.list);
                }
            } catch (e) { console.error('Load recommended tasks error:', e); }
        } catch (error) { console.error('Load invite data error:', error); }
        finally { setLoading(false); }
    };

    const handleFilterRecords = async () => {
        try {
            const filteredRecords = await fetchInviteRecords({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            setRecords(filteredRecords);
        } catch (error) {
            console.error('Filter records error:', error);
        }
    };

    const handleClearFilter = async () => {
        setStartDate('');
        setEndDate('');
        const allRecords = await fetchInviteRecords();
        setRecords(allRecords);
    };

    const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${inviteCode}` : `https://example.com/register?invite=${inviteCode}`;
    const merchantInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/merchant/register?invite=${inviteCode}` : `https://example.com/merchant/register?invite=${inviteCode}`;

    const handleCopyLink = async (isMerchant: boolean = false) => {
        const link = isMerchant ? merchantInviteLink : inviteLink;
        try {
            await navigator.clipboard.writeText(link);
            if (isMerchant) {
                setCopiedMerchant(true);
                setTimeout(() => setCopiedMerchant(false), 2000);
            } else {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            if (isMerchant) {
                setCopiedMerchant(true);
                setTimeout(() => setCopiedMerchant(false), 2000);
            } else {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
        );
    }

    const tabs = [
        { key: 'invite', label: '邀请链接' },
        { key: 'records', label: '邀请记录' },
        { key: 'tasks', label: '推荐任务' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">邀请好友</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 pt-4">
                {/* Stats Card */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-slate-900">{stats.totalInvited}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">累计邀请(人)</div>
                    </div>
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-warning-500">{stats.totalReward}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">累计奖励(银锭)</div>
                    </div>
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-slate-900">{stats.todayInvited}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">今日邀请(人)</div>
                    </div>
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-warning-500">{stats.todayReward}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">今日奖励(银锭)</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="rounded-[20px] bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'invite' | 'records' | 'tasks')}
                            className={cn('flex-1 rounded-[16px] py-2.5 text-center text-sm font-bold transition-all', activeTab === tab.key ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-500 hover:text-slate-700')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {activeTab === 'invite' && (
                        <div className="space-y-6">
                            {/* 权限关闭提示 */}
                            {!canRefer && (
                                <div className="rounded-[20px] bg-red-50 border border-red-200 p-6 text-center">
                                    <div className="text-5xl mb-4">🚫</div>
                                    <div className="text-lg font-bold text-red-700 mb-2">
                                        抱歉，邀请功能暂时关闭
                                    </div>
                                    <div className="text-sm text-red-600 mb-4">
                                        您的买号推荐权限已被管理员关闭
                                    </div>
                                    <div className="text-xs text-red-500">
                                        如需帮助，请联系管理员
                                    </div>
                                </div>
                            )}

                            {canRefer && (
                                <>
                            <div className="text-sm font-medium text-slate-600 leading-relaxed">
                                复制您的 <span className="font-black text-primary-600">专属邀请链接</span>，邀请好友成功注册后，好友完成任务您即可获得邀请奖励！
                            </div>

                            {/* 买手邀请链接 */}
                            <div>
                                <div className="mb-2 text-sm font-bold text-slate-900 flex items-center gap-2">
                                    买手邀请链接
                                    {!inviteEligibility?.canInvite && (
                                        <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                                            {inviteEligibility?.reason || '未解锁'}
                                        </span>
                                    )}
                                </div>
                                {inviteEligibility?.canInvite ? (
                                    <>
                                        <div className="flex gap-3">
                                            <input type="text" value={inviteLink} readOnly className="flex-1 rounded-xl border-none bg-slate-100 px-4 py-3 text-xs font-medium text-slate-600" />
                                            <button onClick={() => handleCopyLink(false)} className={cn('whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-95', copied ? 'bg-green-500' : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20')}>
                                                {copied ? '已复制' : '复制链接'}
                                            </button>
                                        </div>
                                        <div className="mt-2 text-xs font-medium text-slate-400">邀請碼：<span className="font-bold text-primary-600">{inviteCode}</span></div>
                                    </>
                                ) : (
                                    <div className="rounded-[20px] bg-slate-50 p-4 text-xs font-medium text-slate-500 border border-slate-100">
                                        <p>完成 <span className="font-bold text-primary-600">{inviteEligibility?.requiredTasks || 10}</span> 单任务后解锁买手邀请功能</p>
                                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, ((inviteEligibility?.completedTasks || 0) / (inviteEligibility?.requiredTasks || 10)) * 100)}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-right">当前进度：<span className="font-bold text-slate-900">{inviteEligibility?.completedTasks || 0}</span> / {inviteEligibility?.requiredTasks || 10}</p>
                                    </div>
                                )}
                            </div>

                            {/* 商家邀请链接 - 仅当启用时显示 */}
                            {config?.merchantInviteEnabled && (
                                <div>
                                    <div className="mb-2 text-sm font-bold text-slate-900 flex items-center gap-2">
                                        商家邀请链接
                                        {!merchantEligibility?.canInvite && (
                                            <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                                                {merchantEligibility?.reason || '未解锁'}
                                            </span>
                                        )}
                                    </div>
                                    {merchantEligibility?.canInvite ? (
                                        <>
                                            <div className="flex gap-3">
                                                <input type="text" value={merchantInviteLink} readOnly className="flex-1 rounded-xl border-none bg-slate-100 px-4 py-3 text-xs font-medium text-slate-600" />
                                                <button onClick={() => handleCopyLink(true)} className={cn('whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-95', copiedMerchant ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20')}>
                                                    {copiedMerchant ? '已复制' : '复制链接'}
                                                </button>
                                            </div>
                                            <div className="mt-2 text-xs font-medium text-slate-400">邀请商家注册可获得 <span className="font-bold text-purple-600">{config.merchantReferralReward}</span> 银锭奖励</div>
                                        </>
                                    ) : (
                                        <div className="rounded-[20px] bg-slate-50 p-4 text-xs font-medium text-slate-500 border border-slate-100">
                                            <p>完成 <span className="font-bold text-primary-600">{merchantEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</span> 单任务后解锁商家邀请功能</p>
                                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, ((merchantEligibility?.completedTasks || 0) / (merchantEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10)) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="mt-2 text-right">当前进度：<span className="font-bold text-slate-900">{merchantEligibility?.completedTasks || 0}</span> / {merchantEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rounded-[20px] bg-amber-50 p-5">
                                <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-700">
                                    <span>⚠️</span>
                                    <span>请注意</span>
                                </div>
                                <div className="space-y-1.5 text-xs font-medium text-amber-900/70 leading-relaxed">
                                    <p className="flex gap-2"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />邀请链接只能发布于聊天工具中（微信、QQ等），禁止推广于外部网站。</p>
                                    <p className="flex gap-2"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />邀请好友只能是朋友、亲戚、同事等熟人，不可向陌生人发送链接。</p>
                                    <p className="flex gap-2"><span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />严禁自己邀请自己获取奖励，一经发现将永久封号。</p>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-sm font-bold text-slate-900">邀请奖励</div>
                                <div className="rounded-[20px] bg-slate-50 p-5 text-xs font-medium text-slate-600 leading-relaxed border border-slate-100">
                                    <p className="mb-1">• 邀请好友每完成一单任务（完结后），您可获得 <span className="font-bold text-danger-500">{config?.referralRewardPerOrder || 1}</span> 银锭奖励</p>
                                    <p>• 每邀请一个好友可获得奖励上限 <span className="font-bold text-danger-500">{config?.referralLifetimeMaxAmount || 1000}</span> 银锭</p>
                                </div>
                                <div className="mt-2 text-xs font-medium text-slate-400">注：奖励由平台承担，不会扣除好友的任务佣金</div>
                            </div>
                            </>
                            )}
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div>
                            {/* 日期筛选 */}
                            <div className="mb-6 flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">开始日期</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-xl border-none bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">结束日期</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-xl border-none bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFilterRecords}
                                        className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                                    >
                                        筛选
                                    </button>
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={handleClearFilter}
                                            className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                                        >
                                            清除
                                        </button>
                                    )}
                                </div>
                            </div>

                            {records.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="mb-4 text-5xl opacity-50">👥</div>
                                    <div className="text-sm font-bold text-slate-300">暂无邀请记录</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {records.map(record => (
                                        <div key={record.id} className="relative overflow-hidden rounded-[20px] bg-slate-50 p-5 transition-all hover:bg-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">👤</div>
                                                    <span className="font-bold text-slate-900">{record.username}</span>
                                                </div>
                                                <span className="font-black text-primary-600">+{record.reward} 银锭</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400 bg-white/50 p-3 rounded-xl border border-slate-100/50">
                                                <div>注册时间：{record.registerTime}</div>
                                                <div>已完成任务：<span className="font-bold text-slate-700">{record.completedTasks}</span> 单</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            {recommendedTasks.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="mb-4 text-5xl opacity-50">📋</div>
                                    <div className="text-sm font-bold text-slate-300">暂无推荐任务记录</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recommendedTasks.map(task => (
                                        <div key={task.id} className="relative overflow-hidden rounded-[20px] bg-slate-50 p-5 transition-all hover:bg-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-500">✅</div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{task.username}</div>
                                                        <div className="text-xs font-medium text-slate-500 mt-0.5">{task.taskTitle}</div>
                                                    </div>
                                                </div>
                                                <span className="font-black text-success-500">+{task.commissionAmount} 银锭</span>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-400 bg-white/50 p-3 rounded-xl border border-slate-100/50">
                                                <div>完成时间：{task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}</div>
                                                <div>所属月份：{task.month}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
