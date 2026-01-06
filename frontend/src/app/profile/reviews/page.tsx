'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { isAuthenticated } from '../../../services/authService';
import {
    fetchUserReviewTasks,
    ReviewTask,
    ReviewTaskStatus,
    ReviewTaskStatusLabels
} from '../../../services/reviewTaskService';

function ReviewTasksContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialState = searchParams.get('state');

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<number | undefined>(
        initialState !== null ? parseInt(initialState) : undefined
    );

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadTasks();
    }, [router, activeTab]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const result = await fetchUserReviewTasks(activeTab, 1, 50);
            setTasks(result.list);
            setTotal(result.total);
        } catch (error) { console.error('Load tasks error:', error); }
        finally { setLoading(false); }
    };

    const tabs = [
        { key: undefined, label: '全部' },
        { key: ReviewTaskStatus.APPROVED, label: '待追评' },
        { key: ReviewTaskStatus.UPLOADED, label: '待确认' },
        { key: ReviewTaskStatus.COMPLETED, label: '已完成' },
    ];

    const getStatusStyle = (color: string) => {
        if (color === '#22c55e' || color === '#10b981') return 'bg-green-50 text-green-500';
        if (color === '#f59e0b' || color === '#eab308') return 'bg-amber-50 text-amber-500';
        if (color === '#3b82f6' || color === '#6366f1') return 'bg-blue-50 text-blue-500';
        return 'bg-slate-100 text-slate-500';
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">追评任务</h1>
            </header>

            {/* Tabs */}
            <div className="sticky top-14 z-10 flex border-b border-slate-200 bg-white">
                {tabs.map(tab => (
                    <button
                        key={tab.key ?? 'all'}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex-1 py-3 text-center text-sm font-medium transition-colors',
                            activeTab === tab.key ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-500'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <ProfileContainer className="py-4">
                {tasks.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
                        <div className="mb-3 text-4xl">📝</div>
                        <div className="text-sm text-slate-400">暂无追评任务</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => {
                            const statusInfo = ReviewTaskStatusLabels[task.state];
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => router.push(`/profile/reviews/${task.id}`)}
                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800">追评任务</div>
                                            <div className="mt-0.5 text-xs text-slate-400">{task.taskNumber}</div>
                                        </div>
                                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getStatusStyle(statusInfo.color))}>
                                            {statusInfo.text}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-slate-400">佣金：</span>
                                            <span className="font-medium text-green-500">¥{Number(task.userMoney).toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">任务金额：</span>
                                            <span className="text-slate-700">¥{Number(task.money).toFixed(2)}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-slate-400">创建时间：</span>
                                            <span className="text-slate-700">{new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {task.state === ReviewTaskStatus.APPROVED && (
                                        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
                                            <span>📢</span>
                                            请尽快完成追评并上传截图
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {total > tasks.length && (
                    <div className="py-4 text-center text-sm text-slate-400">共 {total} 条记录</div>
                )}
            </ProfileContainer>
        </div>
    );
}

export default function ReviewTasksPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        }>
            <ReviewTasksContent />
        </Suspense>
    );
}
