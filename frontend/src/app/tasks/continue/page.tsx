'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';
import { fetchContinueTasks, ContinueTaskItem } from '../../../services/taskService';
import BottomNav from '../../../components/BottomNav';
import { cn } from '../../../lib/utils';

const stateLabel = (status?: string) => {
    if (!status) return '待处理';
    const upper = status.toString().toUpperCase();
    if (upper === 'PENDING' || upper === '1') return '进行中';
    if (upper === 'SUBMITTED' || upper === '3') return '待审核';
    if (upper === 'COMPLETED' || upper === '5') return '已完成';
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Premium Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:scale-95 transition-transform"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-[17px] font-bold text-slate-800">
                        待完成任务
                    </h1>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        任务大厅
                    </button>
                </div>
            </div>

            <div className="px-4 py-2">
                {/* Status Indicator Bar */}
                <div className="mb-6 flex justify-center">
                    <div className="inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-[13px] font-medium text-blue-600">
                        当前有 {tasks.length} 个任务待处理
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                        <p className="mt-4 text-sm text-slate-400 font-medium">全力加载中...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="mb-6 text-sm text-slate-500">{error}</p>
                        <button
                            onClick={loadData}
                            className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-bold text-white active:scale-95 transition-transform"
                        >
                            重新加载
                        </button>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-16 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-20" />
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">暂无任务</h3>
                        <p className="mt-2 text-sm text-slate-400">目前没有正在进行的任务，去大厅看看吧</p>
                        <button
                            onClick={() => router.push('/tasks')}
                            className="mt-8 rounded-2xl bg-blue-600 px-10 py-3.5 text-sm font-bold text-white active:scale-95 transition-transform"
                        >
                            立即接单
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="group relative overflow-hidden rounded-[24px] bg-white p-5 transition-all"
                            >
                                {/* Platform Badge */}
                                <div className="absolute top-0 right-0 overflow-hidden rounded-bl-2xl">
                                    <div className="bg-blue-600 px-4 py-1.5 text-[11px] font-bold text-white">
                                        {task.platform}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="mr-16 line-clamp-1 text-[15px] font-bold text-slate-800">
                                        {task.title}
                                    </h4>
                                    <p className="mt-1 text-[12px] text-slate-400 font-medium">{task.shopName}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">垫付金额</p>
                                        <p className="text-[15px] font-black text-slate-800">¥{task.price}</p>
                                    </div>
                                    <div className="rounded-2xl bg-blue-50 p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">任务佣金</p>
                                        <p className="text-[15px] font-black text-blue-600">¥{task.commission}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[13px] font-bold text-slate-600">{stateLabel(task.status)}</span>
                                        <span className="text-[11px] font-medium text-slate-300">
                                            {task.currentStep || '0'}/{task.totalSteps || '4'} 步
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/orders/${task.id}/execute`)}
                                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-[13px] font-bold text-white active:scale-95 transition-transform"
                                        >
                                            继续任务
                                        </button>
                                        <button
                                            onClick={loadData}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 active:scale-95 transition-transform"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
