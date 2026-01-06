'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
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
        // Map hex to tailwind colors or use style
        return <Badge variant="soft" style={{ backgroundColor: `${label.color}20`, color: label.color }}>{label.text}</Badge>;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-md items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">评价任务</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Tabs */}
                <div className="mb-4 grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-200 p-1 shadow-sm">
                    {[{ key: 'pending', label: '待处理' }, { key: 'submitted', label: '进行中' }, { key: 'completed', label: '已完成' }].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('w-full rounded-md py-2 text-center text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400">加载中...</div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
                            <div className="mb-3 text-4xl">📝</div>
                            <p className="text-sm">暂无评价任务</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <Card key={task.id} className="overflow-hidden border-slate-200 shadow-sm">
                                <div className="flex gap-3 p-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                        {task.img ? <img src={task.img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="truncate text-sm font-medium text-slate-800">任务 ID: {task.taskNumber}</h3>
                                            {getStatusBadge(task.state)}
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                            <span>订单号: {task.taobaoOrderNumber}</span>
                                            <span className="font-bold text-amber-500">奖励: {task.userMoney} 银锭</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                                    <span className="text-[10px] text-slate-400">发布日期: {new Date(task.createdAt).toLocaleDateString()}</span>
                                    {task.state === ReviewTaskStatus.APPROVED && <Button size="sm" className="bg-blue-500 hover:bg-blue-600 h-8" onClick={() => router.push(`/orders/reviews/${task.id}`)}>去评价</Button>}
                                    {task.state === ReviewTaskStatus.REJECTED && <Button size="sm" variant="ghost" className="h-8 border border-red-200 text-red-500 hover:bg-red-50" onClick={() => router.push(`/orders/reviews/${task.id}`)}>查看原因</Button>}
                                    {(task.state === ReviewTaskStatus.UPLOADED || task.state === ReviewTaskStatus.COMPLETED) && <button className="text-xs text-blue-500" onClick={() => router.push(`/orders/reviews/${task.id}`)}>查看详情</button>}
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-xs text-blue-700 leading-relaxed shadow-sm">
                    <div className="mb-2 font-bold flex items-center gap-1">📋 任务指引</div>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>请在规定时间内完成评价任务。</li>
                        <li>评价内容必须真实有效，禁止刷好评。</li>
                        <li>带图/视频评价请确保拍摄清晰，符合产品特征。</li>
                        <li>商家审核通过后，奖励将自动发放至您的银锭余额。</li>
                    </ul>
                </div>
            </ProfileContainer>
        </div>
    );
}

export default function ReviewsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
            <ReviewsContent />
        </Suspense>
    );
}
