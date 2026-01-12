'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TASK_TYPE_NAMES, TASK_PLATFORMS } from '@/constants/platformConfig';

interface Task { id: string; taskNumber: string; title: string; taskType: number; goodsPrice: number; count: number; claimedCount: number; totalCommission: number; status: number; createdAt: string; }

const TaskStatusMap: Record<number, { text: string; color: 'amber' | 'green' | 'blue' | 'red' | 'slate' }> = {
    0: { text: '待支付', color: 'amber' }, 1: { text: '进行中', color: 'green' }, 2: { text: '已完成', color: 'blue' }, 3: { text: '已取消', color: 'red' }, 4: { text: '待审核', color: 'slate' },
};
const progressWidthClass = { 0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]', 25: 'w-[25%]', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]', 50: 'w-[50%]', 55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]', 75: 'w-[75%]', 80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full' } as const;
type PctKey = keyof typeof progressWidthClass;
const getPct = (claimed: number, total: number): PctKey => Math.max(0, Math.min(100, Math.round((total > 0 ? (claimed / total) * 100 : 0) / 5) * 5)) as PctKey;

export default function MerchantTasksPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState({ status: 'all', taskType: 'all' });

    useEffect(() => { const token = localStorage.getItem('merchantToken'); if (!token) { router.push('/merchant/login'); return; } loadTasks(); }, [router]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('merchantToken'); const query = new URLSearchParams();
            if (filter.status !== 'all') query.append('status', filter.status); if (filter.taskType !== 'all') query.append('taskType', filter.taskType);
            const response = await fetch(`${BASE_URL}/tasks?${query.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const resData = await response.json(); if (resData.success && Array.isArray(resData.data)) setTasks(resData.data);
        } catch (error) { console.error('Load tasks error:', error); } finally { setLoading(false); }
    };

    const getStatusBadge = (status: number) => { const style = TaskStatusMap[status] || { text: '未知', color: 'slate' as const }; return <Badge variant="soft" color={style.color} className="rounded-full px-2.5 font-bold">{style.text}</Badge>; };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">任务管理</h1>
                <Button
                    onClick={() => router.push('/merchant/tasks/new')}
                    className="flex items-center gap-1.5 rounded-[16px] bg-primary-600 px-5 text-base font-bold text-white shadow-none transition-all active:scale-95 hover:bg-primary-700"
                >
                    <span className="text-lg">+</span>发布任务
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-400">状态:</span>
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="h-10 w-[120px] rounded-[12px] border-none bg-slate-50 px-3 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        >
                            <option value="all">全部</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已取消</option><option value="0">待支付</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-400">平台:</span>
                        <select
                            value={filter.taskType}
                            onChange={e => setFilter({ ...filter, taskType: e.target.value })}
                            className="h-10 w-[120px] rounded-[12px] border-none bg-slate-50 px-3 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        >
                            <option value="all">全部</option>
                            {TASK_PLATFORMS.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1" />
                    <div className="text-[13px] font-medium text-slate-400">共 <strong className="text-slate-900">{tasks.length}</strong> 条任务</div>
                    <button
                        onClick={loadTasks}
                        className="h-9 rounded-[12px] bg-slate-50 px-4 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        刷新
                    </button>
                </div>
            </div>

            {/* Task Table */}
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center font-medium text-slate-400">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                        <div className="mb-4 text-5xl opacity-50">📋</div>
                        <div className="mb-5 text-[14px] font-medium text-slate-400">暂无任务</div>
                        <Button
                            onClick={() => router.push('/merchant/tasks/new')}
                            className="rounded-[16px] bg-primary-600 font-bold text-white shadow-none hover:bg-primary-700"
                        >
                            发布第一个任务
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">任务编号</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">商品信息</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">平台</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">佣金</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">进度</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">发布时间</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => (
                                    <tr
                                        key={task.id}
                                        className={cn(
                                            "group border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                                            index === tasks.length - 1 && "border-0"
                                        )}
                                    >
                                        <td className="px-6 py-5 font-mono text-[13px] font-bold text-slate-900">{task.taskNumber}</td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-900">{task.title}</div>
                                            <div className="mt-1 text-xs font-medium text-slate-400">¥{task.goodsPrice}</div>
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-medium text-slate-500">{TASK_TYPE_NAMES[task.taskType] || '未知'}</td>
                                        <td className="px-6 py-5 font-black text-danger-500">¥{task.totalCommission}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-100">
                                                    <span className={cn('block h-full rounded-full bg-primary-500 transition-all', progressWidthClass[getPct(task.claimedCount, task.count)])} />
                                                </div>
                                                <span className="text-[12px] font-bold text-slate-500">{task.claimedCount}/{task.count}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">{getStatusBadge(task.status)}</td>
                                        <td className="px-6 py-5 text-[13px] font-medium text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => router.push(`/merchant/tasks/${task.id}`)}
                                                className="h-8 rounded-[12px] bg-slate-50 px-4 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
                                            >
                                                查看
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
