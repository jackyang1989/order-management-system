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

    const getStatusBadge = (status: number) => { const style = TaskStatusMap[status] || { text: '未知', color: 'slate' as const }; return <Badge variant="soft" color={style.color}>{style.text}</Badge>; };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-[#3b4559]">任务管理</h1>
                <Button onClick={() => router.push('/merchant/tasks/new')} className="flex items-center gap-1.5"><span className="text-lg">+</span>发布任务</Button>
            </div>

            {/* Filter Bar */}
            <Card noPadding className="bg-white">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#6b7280]">状态:</span>
                        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="h-9 w-[120px] rounded-md border border-[#e5e7eb] bg-white px-3 text-[14px] text-[#3b4559] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                            <option value="all">全部</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已取消</option><option value="0">待支付</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] text-[#6b7280]">平台:</span>
                        <select value={filter.taskType} onChange={e => setFilter({ ...filter, taskType: e.target.value })} className="h-9 w-[120px] rounded-md border border-[#e5e7eb] bg-white px-3 text-[14px] text-[#3b4559] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                            <option value="all">全部</option>
                            {TASK_PLATFORMS.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1" />
                    <div className="text-[13px] text-[#6b7280]">共 <strong className="text-[#3b4559]">{tasks.length}</strong> 条任务</div>
                    <button onClick={loadTasks} className="h-9 rounded-md border border-[#e5e7eb] bg-white px-4 text-[13px] text-primary-500 transition-colors hover:bg-[#eff6ff]">刷新</button>
                </div>
            </Card>

            {/* Task Table */}
            <Card className="overflow-hidden bg-white">
                {loading ? (
                    <div className="flex min-h-[220px] items-center justify-center text-[#6b7280]">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                        <div className="mb-4 text-5xl">📋</div>
                        <div className="mb-5 text-[14px] text-[#6b7280]">暂无任务</div>
                        <Button onClick={() => router.push('/merchant/tasks/new')}>发布第一个任务</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">任务编号</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">商品信息</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">平台</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">佣金</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">进度</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">状态</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">发布时间</th>
                                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#6b7280]">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="border-b border-[#e5e7eb] transition-colors hover:bg-[#f9fafb]">
                                        <td className="px-4 py-3.5 font-mono text-[13px] text-primary-600">{task.taskNumber}</td>
                                        <td className="px-4 py-3.5"><div className="font-medium text-[#3b4559]">{task.title}</div><div className="text-[13px] text-[#6b7280]">¥{task.goodsPrice}</div></td>
                                        <td className="px-4 py-3.5 text-[14px] text-[#6b7280]">{TASK_TYPE_NAMES[task.taskType] || '未知'}</td>
                                        <td className="px-4 py-3.5 font-semibold text-danger-400">¥{task.totalCommission}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-[#e5e7eb]">
                                                    <span className={cn('block h-full rounded-full bg-primary-500 transition-all', progressWidthClass[getPct(task.claimedCount, task.count)])} />
                                                </div>
                                                <span className="text-[13px] text-[#6b7280]">{task.claimedCount}/{task.count}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">{getStatusBadge(task.status)}</td>
                                        <td className="px-4 py-3.5 text-[13px] text-[#6b7280]">{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3.5"><button onClick={() => router.push(`/merchant/tasks/${task.id}`)} className="h-9 rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] text-primary-500 transition-colors hover:bg-[#eff6ff]">查看</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
