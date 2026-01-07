'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchUserReviewTasks, ReviewTask, ReviewTaskStatus, ReviewTaskStatusLabels } from '../../../services/reviewTaskService';

function ReviewsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'pending' | 'submitted' | 'completed' | null;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'completed'>(initialTab || 'pending');
    const [tasks, setTasks] = useState<ReviewTask[]>([]);

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadTasks(); }, [activeTab]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const result = await fetchUserReviewTasks();
            const list = result.list || [];

            const filtered = list.filter((t: ReviewTask) => {
                if (activeTab === 'pending') return t.state === ReviewTaskStatus.APPROVED;
                if (activeTab === 'submitted') return t.state === ReviewTaskStatus.UPLOADED || t.state === ReviewTaskStatus.REJECTED || t.state === ReviewTaskStatus.PAID;
                if (activeTab === 'completed') return t.state === ReviewTaskStatus.COMPLETED;
                return true;
            });
            setTasks(filtered);
        } catch (error) { console.error('Load review tasks error:', error); }
        finally { setLoading(false); }
    };

    const getStatusConfig = (state: ReviewTaskStatus) => {
        const label = ReviewTaskStatusLabels[state] || { text: '未知' };
        const configs: Record<string, { bg: string; textCol: string }> = {
            [ReviewTaskStatus.APPROVED]: { bg: 'bg-emerald-50', textCol: 'text-emerald-600' },
            [ReviewTaskStatus.UPLOADED]: { bg: 'bg-blue-50', textCol: 'text-blue-600' },
            [ReviewTaskStatus.REJECTED]: { bg: 'bg-rose-50', textCol: 'text-rose-600' },
            [ReviewTaskStatus.COMPLETED]: { bg: 'bg-slate-50', textCol: 'text-slate-400' },
            [ReviewTaskStatus.PAID]: { bg: 'bg-indigo-50', textCol: 'text-indigo-600' },
        };
        const conf = configs[state] || { bg: 'bg-slate-50', textCol: 'text-slate-500' };
        return { text: label.text, ...conf };
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">评价任务</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Tabs */}
                <div className="sticky top-20 z-10 flex w-full gap-2 rounded-[20px] bg-slate-100/50 backdrop-blur-sm p-1.5">
                    {[
                        { key: 'pending', label: '待处理' },
                        { key: 'submitted', label: '进行中' },
                        { key: 'completed', label: '已完成' }
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-[16px] py-3 text-xs font-black uppercase tracking-wider transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex py-20 items-center justify-center">
                            <Spinner size="lg" className="text-blue-600" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-3xl shadow-inner opacity-50">📝</div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">暂无评价任务</h3>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">目前没有任何符合条件的评价任务</p>
                            </div>
                        </div>
                    ) : (
                        tasks.map(task => {
                            const status = getStatusConfig(task.state);
                            return (
                                <div key={task.id} className="group relative rounded-[32px] bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
                                    <div className="flex gap-4 p-6">
                                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[20px] bg-slate-50 shadow-inner">
                                            {task.img ? (
                                                <img src={task.img} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="truncate text-sm font-black text-slate-900">ID: {task.taskNumber}</h3>
                                                <div className={cn('rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest', status.bg, status.textCol)}>
                                                    {status.text}
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <div className="text-[10px] font-bold text-slate-400 tracking-tight">订单号: {task.taobaoOrderNumber}</div>
                                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                                    奖励金额: <span className="text-sm">+{task.userMoney}</span> 银锭
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-50/50 px-6 py-4 border-t border-slate-50">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                                            {new Date(task.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        {task.state === ReviewTaskStatus.APPROVED && (
                                            <button
                                                onClick={() => router.push(`/orders/reviews/${task.id}`)}
                                                className="rounded-full bg-blue-600 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-50 transition active:scale-95"
                                            >
                                                立即去评价
                                            </button>
                                        )}
                                        {task.state === ReviewTaskStatus.REJECTED && (
                                            <button
                                                onClick={() => router.push(`/orders/reviews/${task.id}`)}
                                                className="rounded-full bg-rose-50 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 transition active:scale-95"
                                            >
                                                查看原因
                                            </button>
                                        )}
                                        {(task.state === ReviewTaskStatus.UPLOADED || task.state === ReviewTaskStatus.COMPLETED || task.state === ReviewTaskStatus.PAID) && (
                                            <button
                                                onClick={() => router.push(`/orders/reviews/${task.id}`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                                            >
                                                查看详细详情 →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Guidelines */}
                <div className="rounded-[24px] bg-blue-50/50 p-6 border border-blue-50">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-blue-900">
                        <span>📋</span> 任务指引
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold leading-relaxed text-blue-700/80">
                        <li className="flex gap-2"><span>•</span>请在规定时间内完成评价任务以获得奖励</li>
                        <li className="flex gap-2"><span>•</span>评价内容需真实有效，带图评价更易通过</li>
                        <li className="flex gap-2"><span>•</span>禁止发布违规内容或与产品不符的虚假评价</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function ReviewsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" /></div>}>
            <ReviewsContent />
        </Suspense>
    );
}
