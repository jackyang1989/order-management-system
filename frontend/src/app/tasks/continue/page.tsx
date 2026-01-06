'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface TaskItem {
    id: string;
    terminal: number;
    task_type: string;
    seller: string;
    principal: number;
    commission: number;
    user_divided: number;
    user_buyno_wangwang: string;
    task_step: number;
    is_ys: number;
}

export default function ContinueTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);

    const alertSuccess = useCallback((msg: string) => { alert(msg); }, []);
    const alertError = useCallback((msg: string) => { alert(msg); }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTasks();
    }, [router]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/maketask`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.code === 1) {
                setTasks(data.data?.list || []);
            } else {
                alertError(data.msg || '获取任务失败');
            }
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
        }
    };

    const gostep = (index: number) => {
        const task = tasks[index];
        const id = task.id;
        const taskStep = task.task_step;
        const ys = task.is_ys;

        if (ys === 1 && taskStep === 4) {
            router.push(`/task/${id}/wk`);
        } else {
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('active', String(taskStep));
            }
            router.push(`/task/${id}/step`);
        }
    };

    const cancelActive = async (index: number) => {
        const confirmMsg = '是否放弃此条订单，每人每天前2单任务自行放弃不扣银锭，超出订单冻结的银锭将不会返还';

        if (confirm(confirmMsg)) {
            try {
                const task = tasks[index];
                const token = getToken();
                const response = await fetch(`${BASE_URL}/mobile/task/del_task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ id: task.id }),
                });
                const data = await response.json();

                if (data.code === 1) {
                    alertSuccess(data.msg || '放弃成功');
                    setTimeout(() => {
                        if (data.url) {
                            router.push(data.url);
                        } else {
                            loadTasks();
                        }
                    }, 2000);
                } else {
                    alertError(data.msg || '操作失败');
                }
            } catch (error) {
                alertError('网络错误');
            }
        }
    };

    const filterPhone = (val: string) => {
        if (!val || val.length < 11) return val;
        return val.substring(0, 3) + '****' + val.substring(7);
    };

    const getTerminalText = (terminal: number) => {
        return terminal === 1 ? '本佣货返' : terminal === 2 ? '本立佣货' : '-';
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-100 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-5 pt-12 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="cursor-pointer text-2xl">‹</button>
                    <span className="text-lg font-semibold">做任务</span>
                    <button
                        onClick={() => router.push('/tasks')}
                        className="cursor-pointer text-sm text-amber-400"
                    >
                        任务大厅
                    </button>
                </div>
            </div>

            {/* Title Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-blue-500">
                做任务
            </div>

            {/* Task List */}
            <div className="p-3">
                {loading ? (
                    <div className="py-10 text-center text-sm text-slate-400">
                        加载中...
                    </div>
                ) : tasks.length === 0 ? (
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
                ) : (
                    tasks.map((task, index) => (
                        <div key={task.id} className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
                            {/* Task Details */}
                            <div className="space-y-2.5 p-4 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">商家账号：</span>
                                    <span className="text-slate-800">{filterPhone(task.seller)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">任务类型：</span>
                                    <span className="text-slate-800">{task.task_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">接手买号：</span>
                                    <span className="text-slate-800">{task.user_buyno_wangwang}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">垫付本金：</span>
                                    <span className="font-semibold text-blue-500">¥{task.principal}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">任务佣金：</span>
                                    <span className="font-semibold text-blue-600">
                                        {task.commission}<span className="text-amber-400">+{task.user_divided}银锭</span>
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">返款方式：</span>
                                    <span className="text-slate-800">{getTerminalText(task.terminal)}</span>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3">
                                <span className="text-xs text-slate-500">操作：</span>
                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => gostep(index)}
                                        className="cursor-pointer rounded-md bg-green-500 px-5 py-2 text-xs font-semibold text-white"
                                    >
                                        去完成
                                    </button>
                                    <button
                                        onClick={() => cancelActive(index)}
                                        className="cursor-pointer rounded-md bg-amber-500 px-5 py-2 text-xs font-semibold text-white"
                                    >
                                        放弃
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Info */}
            {!loading && tasks.length > 0 && (
                <div className="py-5 text-center text-xs text-slate-400">
                    共 {tasks.length} 条待完成任务
                </div>
            )}

            <BottomNav />
        </div>
    );
}
