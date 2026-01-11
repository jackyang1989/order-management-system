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
    InviteStats,
    InviteRecord,
    InviteConfig,
    InviteConfig,
    MerchantInviteEligibility,
    checkInviteEligibility
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
    const [inviteEligibility, setInviteEligibility] = useState<MerchantInviteEligibility | null>(null);

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

            const [statsData, recordsData, configData, eligibilityData, inviteEligData] = await Promise.all([
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
            setInviteEligibility(inviteEligData);

            // Load recommended tasks
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
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const tabs = [
        { key: 'invite', label: '邀请链接' },
        { key: 'records', label: '邀请记录' },
        { key: 'tasks', label: '推荐任务' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-20 mx-auto max-w-[515px] border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">邀请好友</h1>
                </div>
            </header>

            <div className="px-4 pb-24 pt-4">
                {/* Stats Card */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.totalInvited}</div>
                        <div className="mt-1 text-xs text-slate-400">累计邀请(人)</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-2xl font-bold text-warning-400">{stats.totalReward}</div>
                        <div className="mt-1 text-xs text-slate-400">累计奖励(银锭)</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.todayInvited}</div>
                        <div className="mt-1 text-xs text-slate-400">今日邀请(人)</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-2xl font-bold text-warning-400">{stats.todayReward}</div>
                        <div className="mt-1 text-xs text-slate-400">今日奖励(银锭)</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'invite' | 'records' | 'tasks')}
                            className={cn('flex-1 py-3 text-center text-sm font-medium', activeTab === tab.key ? 'border-b-2 border-blue-500 text-primary-500' : 'text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-4">
                    {activeTab === 'invite' && (
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600 leading-relaxed">
                                复制您的 <span className="font-bold text-primary-500">专属邀请链接</span>，邀请好友成功注册后，好友完成任务您即可获得邀请奖励！
                            </div>

                            {/* 买手邀请链接 */}
                            <div>
                                <div className="mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
                                    买手邀请链接
                                    {!inviteEligibility?.canInvite && (
                                        <span className="text-xs bg-amber-100 text-warning-500 px-2 py-0.5 rounded">
                                            {inviteEligibility?.reason || '未解锁'}
                                        </span>
                                    )}
                                </div>
                                {inviteEligibility?.canInvite ? (
                                    <>
                                        <div className="flex gap-2">
                                            <input type="text" value={inviteLink} readOnly className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" />
                                            <button onClick={() => handleCopyLink(false)} className={cn('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white', copied ? 'bg-green-500' : 'bg-primary-500')}>
                                                {copied ? '已复制' : '复制链接'}
                                            </button>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">邀请码：<span className="font-medium text-primary-500">{inviteCode}</span></div>
                                    </>
                                ) : (
                                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                                        <p>完成 <span className="font-bold text-primary-500">{inviteEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</span> 单任务后解锁买手邀请功能</p>
                                        <p className="mt-1">当前进度：<span className="font-bold">{inviteEligibility?.completedTasks || 0}</span> / {inviteEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</p>
                                    </div>
                                )}
                            </div>

                            {/* 商家邀请链接 - 仅当启用时显示 */}
                            {config?.merchantInviteEnabled && (
                                <div>
                                    <div className="mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
                                        商家邀请链接
                                        {!merchantEligibility?.canInvite && (
                                            <span className="text-xs bg-amber-100 text-warning-500 px-2 py-0.5 rounded">
                                                {merchantEligibility?.reason || '未解锁'}
                                            </span>
                                        )}
                                    </div>
                                    {merchantEligibility?.canInvite ? (
                                        <>
                                            <div className="flex gap-2">
                                                <input type="text" value={merchantInviteLink} readOnly className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" />
                                                <button onClick={() => handleCopyLink(true)} className={cn('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white', copiedMerchant ? 'bg-green-500' : 'bg-purple-500')}>
                                                    {copiedMerchant ? '已复制' : '复制链接'}
                                                </button>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400">邀请商家注册可获得 <span className="font-bold text-purple-500">{config.merchantReferralReward}</span> 银锭奖励</div>
                                        </>
                                    ) : (
                                        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                                            <p>完成 <span className="font-bold text-primary-500">{merchantEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</span> 单任务后解锁商家邀请功能</p>
                                            <p className="mt-1">当前进度：<span className="font-bold">{merchantEligibility?.completedTasks || 0}</span> / {merchantEligibility?.requiredTasks || config?.inviteUnlockThreshold || 10}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rounded-lg bg-amber-50 p-3">
                                <div className="mb-2 flex items-center gap-1 text-sm font-medium text-warning-500">请注意</div>
                                <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                                    <p>1. 邀请链接只能发布于聊天工具中（微信、QQ等），禁止推广于外部网站。</p>
                                    <p>2. 邀请好友只能是朋友、亲戚、同事等熟人，不可向陌生人发送链接。</p>
                                    <p>3. 严禁自己邀请自己获取奖励，一经发现将永久封号。</p>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-sm font-medium text-slate-700">邀请奖励</div>
                                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
                                    <p>• 邀请好友每完成一单任务（完结后），您可获得 <span className="font-bold text-danger-400">{config?.referralRewardPerOrder || 1}</span> 银锭奖励</p>
                                    <p>• 每邀请一个好友可获得奖励上限 <span className="font-bold text-danger-400">{config?.referralLifetimeMaxAmount || 1000}</span> 银锭</p>
                                </div>
                                <div className="mt-2 text-xs text-slate-400">注：奖励由平台承担，不会扣除好友的任务佣金</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div>
                            {/* 日期筛选 */}
                            <div className="mb-4 flex flex-wrap gap-2 items-end">
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs text-slate-500 mb-1 block">开始日期</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="text-xs text-slate-500 mb-1 block">结束日期</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleFilterRecords}
                                    className="px-4 py-1.5 bg-primary-500 text-white text-sm rounded-lg"
                                >
                                    筛选
                                </button>
                                {(startDate || endDate) && (
                                    <button
                                        onClick={handleClearFilter}
                                        className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                                    >
                                        清除
                                    </button>
                                )}
                            </div>

                            {records.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="mb-3 text-4xl">👥</div>
                                    <div className="text-sm text-slate-400">暂无邀请记录</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {records.map(record => (
                                        <div key={record.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-base">👤</div>
                                                    <span className="font-medium text-slate-800">{record.username}</span>
                                                </div>
                                                <span className="font-medium text-primary-500">+{record.reward} 银锭</span>
                                            </div>
                                            <div className="mt-1 ml-12 text-xs text-slate-400">
                                                <div>注册时间：{record.registerTime}</div>
                                                <div>已完成任务：{record.completedTasks} 单</div>
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
                                <div className="py-12 text-center">
                                    <div className="mb-3 text-4xl">📋</div>
                                    <div className="text-sm text-slate-400">暂无推荐任务记录</div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recommendedTasks.map(task => (
                                        <div key={task.id} className="py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-base">✅</div>
                                                    <div>
                                                        <div className="font-medium text-slate-800">{task.username}</div>
                                                        <div className="text-xs text-slate-400">{task.taskTitle}</div>
                                                    </div>
                                                </div>
                                                <span className="font-medium text-success-400">+{task.commissionAmount} 银锭</span>
                                            </div>
                                            <div className="mt-1 ml-12 text-xs text-slate-400">
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
