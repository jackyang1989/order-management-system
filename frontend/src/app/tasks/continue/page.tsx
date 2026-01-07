'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';
import { fetchContinueTasks, ContinueTaskItem } from '../../../services/taskService';
import BottomNav from '../../../components/BottomNav';

const stateLabel = (status?: string) => {
    if (!status) return '待处理';
    const upper = status.toUpperCase();
    if (upper === 'PENDING') return '待完成';
    if (upper === 'ACTIVE') return '进行中';
    if (upper === 'SUBMITTED') return '待审核';
    if (upper === 'COMPLETED' || upper === 'CLOSED') return '已完成';
    return status;
};

export default function ContinueTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<ContinueTaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await fetchContinueTasks();
            setTasks(list);
        } catch (err: any) {
            setError(err?.message || '获取待完成任务失败');
        } finally {
            setLoading(false);
        }
    };

    const emptyState = useMemo(() => !loading && !error && tasks.length === 0, [loading, error, tasks.length]);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-5 pt-12 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="cursor-pointer text-2xl">‹</button>
                    <span className="text-lg font-semibold">待完成任务</span>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="cursor-pointer text-sm text-amber-300"
                    >
                        任务大厅
                    </button>
                </div>
            </div>

            {/* Title Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-blue-500">
                待完成任务
            </div>

            <div className="p-3">
                {loading && (
                    <div className="rounded-xl bg-white py-10 text-center text-slate-400">加载中...</div>
                )}

                {error && !loading && (
                    <div className="rounded-xl bg-white py-10 text-center text-slate-500">
                        <div className="mb-3 text-sm">{error}</div>
                        <button
                            onClick={loadData}
                            className="cursor-pointer rounded-full bg-blue-500 px-5 py-2 text-xs font-semibold text-white"
                        >
                            重新加载
                        </button>
                    </div>
                )}

                {emptyState && (
                    <div className="rounded-xl bg-white py-10 text-center text-slate-400">
                        <div className="mb-4 text-5xl">📋</div>
                        <div className="text-sm">暂无待完成任务</div>
                        <button
                            onClick={() => router.push('/tasks')}
                            className="mt-5 cursor-pointer rounded-full bg-blue-500 px-6 py-2.5 text-sm text-white"
                        >
                            去接单
                        </button>
                    </div>
                )}

                {!loading && !error && tasks.length > 0 && (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                                    <span>{task.shopName}</span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">{stateLabel(task.status)}</span>
                                </div>

                                <div className="space-y-2.5 px-4 py-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">任务标题：</span>
                                        <span className="text-slate-800">{task.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">平台：</span>
                                        <span className="text-slate-800">{task.platform}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">垫付：</span>
                                        <span className="font-semibold text-blue-600">¥{task.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">佣金：</span>
                                        <span className="font-semibold text-amber-500">¥{task.commission}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">当前进度：</span>
                                        <span className="text-slate-800">{task.currentStep ?? '-'} / {task.totalSteps ?? '-'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                    <span className="text-xs text-slate-500">操作：</span>
                                    <div className="flex gap-2.5">
                                        <button
                                            onClick={() => router.push(`/orders/${task.id}`)}
                                            className="cursor-pointer rounded-md bg-green-500 px-5 py-2 text-xs font-semibold text-white"
                                        >
                                            去完成
                                        </button>
                                        <button
                                            onClick={loadData}
                                            className="cursor-pointer rounded-md bg-slate-200 px-5 py-2 text-xs font-semibold text-slate-700"
                                        >
                                            刷新
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!loading && !error && tasks.length > 0 && (
                <div className="py-5 text-center text-xs text-slate-400">共 {tasks.length} 条待完成任务</div>
            )}

            <BottomNav />
        </div>
    );
}
