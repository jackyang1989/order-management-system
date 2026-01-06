'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

interface Task { id: string; taskNumber: string; title: string; taskType: number; goodsPrice: number; count: number; claimedCount: number; totalCommission: number; status: number; createdAt: string; }

const TaskTypeMap: Record<number, string> = { 1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多' };
const TaskStatusMap: Record<number, { text: string; color: 'amber' | 'green' | 'indigo' | 'red' | 'purple' | 'slate' }> = {
    0: { text: '待支付', color: 'amber' }, 1: { text: '进行中', color: 'green' }, 2: { text: '已完成', color: 'indigo' }, 3: { text: '已取消', color: 'red' }, 4: { text: '待审核', color: 'purple' },
};

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
                <h1 className="text-2xl font-bold text-slate-800">任务管理</h1>
                <Button onClick={() => router.push('/merchant/tasks/new')} className="flex items-center gap-1.5 shadow-sm"><span className="text-lg">+</span>发布任务</Button>
            </div>

            {/* Filter Bar */}
            <Card className="flex items-center gap-4 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">状态:</span>
                    <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="all">全部</option><option value="1">进行中</option><option value="2">已完成</option><option value="3">已取消</option><option value="0">待支付</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">平台:</span>
                    <select value={filter.taskType} onChange={e => setFilter({ ...filter, taskType: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <option value="all">全部</option><option value="1">淘宝</option><option value="2">天猫</option><option value="3">京东</option><option value="4">拼多多</option>
                    </select>
                </div>
                <div className="flex-1" />
                <div className="text-sm text-slate-500">共 <strong className="text-slate-800">{tasks.length}</strong> 条任务</div>
                <button onClick={loadTasks} className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-600 hover:bg-slate-200">刷新</button>
            </Card>

            {/* Task Table */}
            <Card className="overflow-hidden bg-white shadow-sm">
                {loading ? (
                    <div className="py-16 text-center text-slate-500">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="mb-4 text-5xl">📋</div>
                        <div className="mb-5 text-base text-slate-500">暂无任务</div>
                        <Button onClick={() => router.push('/merchant/tasks/new')}>发布第一个任务</Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">任务编号</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">商品信息</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">平台</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">佣金</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">进度</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">状态</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">发布时间</th>
                                    <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-slate-500">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="border-b border-slate-100">
                                        <td className="px-4 py-4 font-mono text-sm text-indigo-600">{task.taskNumber}</td>
                                        <td className="px-4 py-4"><div className="font-medium">{task.title}</div><div className="text-[13px] text-slate-500">¥{task.goodsPrice}</div></td>
                                        <td className="px-4 py-4 text-sm">{TaskTypeMap[task.taskType] || '未知'}</td>
                                        <td className="px-4 py-4 font-semibold text-red-600">¥{task.totalCommission}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-200">
                                                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${task.count > 0 ? (task.claimedCount / task.count) * 100 : 0}%` }} />
                                                </div>
                                                <span className="text-[13px] text-slate-500">{task.claimedCount}/{task.count}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">{getStatusBadge(task.status)}</td>
                                        <td className="px-4 py-4 text-[13px] text-slate-500">{new Date(task.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-4"><button onClick={() => router.push(`/merchant/tasks/${task.id}`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-[13px] text-indigo-600 hover:bg-slate-50">查看</button></td>
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
