'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { isAuthenticated } from '../../../services/authService';
import { fetchUserReviewTasks, ReviewTask, ReviewTaskStatus, ReviewTaskStatusLabels } from '../../../services/reviewTaskService';
import { Spinner } from '../../../components/ui/spinner';

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
            // Mapping UI tabs to backend states
            // pending: 审核通过待追评 (APPROVED)
            // submitted: 已上传待确认 (UPLOADED) or 已拒绝 (REJECTED) / 买手拒接 (BUYER_REJECTED)
            // completed: 已完成 (COMPLETED)

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

    const getStatusBadge = (state: ReviewTaskStatus) => {
        const label = ReviewTaskStatusLabels[state] || { text: '未知', color: '#6b7280' };
        const configs: Record<string, string> = {
            [ReviewTaskStatus.APPROVED]: 'bg-emerald-50 text-emerald-500',
            [ReviewTaskStatus.UPLOADED]: 'bg-blue-50 text-blue-500',
            [ReviewTaskStatus.REJECTED]: 'bg-rose-50 text-rose-500',
            [ReviewTaskStatus.COMPLETED]: 'bg-slate-100 text-slate-400',
            [ReviewTaskStatus.PAID]: 'bg-emerald-50 text-emerald-500',
        };
        return <div className={cn('rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest', configs[state] || 'bg-slate-50 text-slate-400')}>{label.text}</div>;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">评价任务</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Tabs */}
                <div className="mb-6 flex w-full gap-2 rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                    {[{ key: 'pending', label: '待处理' }, { key: 'submitted', label: '进行中' }, { key: 'completed', label: '已完成' }].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-full py-2.5 text-center text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex justify-center"><Spinner size="lg" className="text-blue-600" /></div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-[24px] bg-white p-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                            <div className="mb-6 text-5xl">📝</div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No review tasks found</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <Card key={task.id} className="overflow-hidden border-none bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[24px]">
                                <div className="flex gap-4 p-6">
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[18px] bg-slate-50 shadow-inner">
                                        {task.img ? <img src={task.img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">TASK ID</div>
                                                <h3 className="truncate text-sm font-black text-slate-900 tabular-nums">{task.taskNumber}</h3>
                                            </div>
                                            {getStatusBadge(task.state)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">ORDER NUMBER</div>
                                                <div className="text-[11px] font-bold text-slate-500 tabular-nums">{task.taobaoOrderNumber}</div>
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">REWARD</div>
                                                <div className="text-sm font-black text-amber-500 tabular-nums">{task.userMoney} 💎</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50/30 px-6 py-4 border-t border-slate-50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">PUBLISHED: {new Date(task.createdAt).toLocaleDateString()}</span>
                                    <button onClick={() => router.push(`/profile/reviews/${task.id}`)}
                                        className={cn('rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95',
                                            task.state === ReviewTaskStatus.REJECTED ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800')}>
                                        {task.state === ReviewTaskStatus.APPROVED ? 'SUBMIT NOW' : (task.state === ReviewTaskStatus.REJECTED ? 'VIEW REASON' : 'VIEW DETAILS')}
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <div className="mt-8 rounded-[24px] bg-blue-50/50 p-6 border border-blue-100/50">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-blue-700 uppercase tracking-widest leading-none">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        任务指引 • GUIDELINES
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold text-blue-800/60 leading-relaxed uppercase tracking-wide">
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">01</span> 请在规定时间内完成评价任务。</li>
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">02</span> 评价内容必须真实有效，禁止刷好评。</li>
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">03</span> 带图/视频评价请确保拍摄清晰，符合产品特征。</li>
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">04</span> 商家审核通过后，奖励将自动发放至您的银锭余额。</li>
                    </ul>
                </div>
            </ProfileContainer>
        </div>
    );
}

export default function ReviewsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>}>
            <ReviewsContent />
        </Suspense>
    );
}
