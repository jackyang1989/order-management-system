'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';

enum ReviewTaskStatus {
    UNPAID = 0, PAID = 1, APPROVED = 2, UPLOADED = 3, COMPLETED = 4, CANCELLED = 5, BUYER_REJECTED = 6, REJECTED = 7
}

interface ReviewTask {
    id: string;
    merchantId: string;
    userId: string;
    buynoId: string;
    shopId: string;
    platformOrderNumber: string;
    taskNumber: string;
    userTaskId: string;
    sellerTaskId: string;
    payPrice: number;
    money: number;
    userMoney: number;
    yjprice: number;
    ydprice: number;
    state: ReviewTaskStatus;
    img: string;
    uploadTime: string;
    confirmTime: string;
    payTime: string;
    examineTime: string;
    remarks: string;
    createdAt: string;
    updatedAt: string;
}

interface Stats { unpaid: number; paid: number; approved: number; uploaded: number; completed: number; cancelled: number; rejected: number; }

const statusLabels: Record<ReviewTaskStatus, { text: string; color: 'amber' | 'blue' | 'green' | 'slate' | 'red' }> = {
    [ReviewTaskStatus.UNPAID]: { text: '待支付', color: 'amber' },
    [ReviewTaskStatus.PAID]: { text: '待审核', color: 'blue' },
    [ReviewTaskStatus.APPROVED]: { text: '待追评', color: 'blue' },
    [ReviewTaskStatus.UPLOADED]: { text: '待确认', color: 'blue' },
    [ReviewTaskStatus.COMPLETED]: { text: '已完成', color: 'green' },
    [ReviewTaskStatus.CANCELLED]: { text: '已取消', color: 'slate' },
    [ReviewTaskStatus.BUYER_REJECTED]: { text: '买手拒接', color: 'red' },
    [ReviewTaskStatus.REJECTED]: { text: '已拒绝', color: 'red' },
};

export default function MerchantReviewsPage() {
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [stats, setStats] = useState<Stats>({ unpaid: 0, paid: 0, approved: 0, uploaded: 0, completed: 0, cancelled: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(ReviewTaskStatus.UPLOADED);
    const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => { loadData(); }, [filter]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: '1', limit: '50' });
            if (filter !== undefined) params.append('state', filter.toString());
            const url = `${BASE_URL}/review-tasks/merchant/list?${params}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success && json.data) setTasks(json.data.list || []);

            const statsRes = await fetch(`${BASE_URL}/review-tasks/merchant/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            const statsJson = await statsRes.json();
            if (statsJson.success) setStats(statsJson.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleConfirm = async (taskId: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        if (!confirm('确认追评已完成？佣金将发放给买手')) return;
        setProcessing(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reviewTaskId: taskId }) });
            const json = await res.json();
            if (json.success) { alert('确认成功，佣金已发放给买手'); setSelectedTask(null); loadData(); }
            else alert(json.message || '操作失败');
        } catch { alert('网络错误'); }
        finally { setProcessing(false); }
    };

    const handleCancel = async (taskId: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        const reason = prompt('请输入取消原因（可选）：');
        if (!confirm('确认取消此追评任务？费用将退还')) return;
        setProcessing(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reviewTaskId: taskId, reason: reason || undefined }) });
            const json = await res.json();
            if (json.success) { alert('取消成功，费用已退还'); setSelectedTask(null); loadData(); }
            else alert(json.message || '操作失败');
        } catch { alert('网络错误'); }
        finally { setProcessing(false); }
    };

    const parseImages = (imgStr: string): string[] => {
        if (!imgStr) return [];
        try { return JSON.parse(imgStr); }
        catch { return imgStr.split(',').filter(Boolean); }
    };

    const statsCards = [
        { label: '待支付', value: stats.unpaid, color: 'text-amber-500', bg: 'bg-amber-50', icon: '💰', statusFilter: ReviewTaskStatus.UNPAID },
        { label: '待确认', value: stats.uploaded, color: 'text-indigo-500', bg: 'bg-indigo-50', icon: '📸', statusFilter: ReviewTaskStatus.UPLOADED },
        { label: '已完成', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-50', icon: '✅', statusFilter: ReviewTaskStatus.COMPLETED },
        { label: '已取消', value: stats.cancelled + stats.rejected, color: 'text-slate-500', bg: 'bg-slate-50', icon: '🚫', statusFilter: undefined },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-black text-slate-900">追评管理</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {statsCards.map((stat, idx) => (
                    <div key={idx} onClick={() => setFilter(stat.statusFilter)}>
                        <Card
                            className={cn(
                                'group cursor-pointer overflow-hidden border-0 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-[24px]',
                                filter === stat.statusFilter
                                    ? 'bg-white ring-2 ring-primary-500 shadow-xl shadow-primary-500/10'
                                    : 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-primary-500/10'
                            )}
                            noPadding
                        >
                            <div className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-slate-400">{stat.label}</div>
                                        <div className={cn('mt-2 text-4xl font-black tracking-tight', stat.color)}>{stat.value}</div>
                                    </div>
                                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-[16px] text-2xl transition-transform group-hover:scale-110', stat.bg)}>
                                        {stat.icon}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Tasks Table */}
            <Card className="overflow-hidden border-0 bg-white p-0 shadow-xl shadow-slate-200/50 rounded-[32px]" noPadding>
                <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-500">
                            <span className="text-xl">📋</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">任务列表</h2>
                    </div>
                    <Button
                        size="sm"
                        variant={filter === undefined ? 'primary' : 'secondary'}
                        onClick={() => setFilter(undefined)}
                        className="h-10 rounded-xl px-6 font-bold"
                    >
                        显示全部
                    </Button>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-bold text-slate-400">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 text-6xl opacity-20 filter grayscale">📝</div>
                        <div className="text-lg font-bold text-slate-400">暂无追评任务</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-wider text-slate-400">任务编号</th>
                                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-wider text-slate-400">费用</th>
                                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-wider text-slate-400">买手佣金</th>
                                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-wider text-slate-400">创建时间</th>
                                    <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-8 py-5 text-center text-xs font-black uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tasks.map((task, idx) => (
                                    <tr
                                        key={task.id}
                                        className={cn(
                                            "group transition-all hover:bg-slate-50/80",
                                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                                        )}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-slate-700">{task.taskNumber}</div>
                                            {task.platformOrderNumber && <div className="text-xs text-slate-400 mt-1">订单: {task.platformOrderNumber}</div>}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900">¥{Number(task.money).toFixed(2)}</td>
                                        <td className="px-8 py-5 text-sm font-black text-emerald-500">¥{Number(task.userMoney).toFixed(2)}</td>
                                        <td className="px-8 py-5 text-xs font-medium text-slate-400">{new Date(task.createdAt).toLocaleString('zh-CN')}</td>
                                        <td className="px-8 py-5">
                                            <Badge variant="solid" color={statusLabels[task.state]?.color as any || 'slate'} className="rounded-full px-3 py-1 text-xs">
                                                {statusLabels[task.state]?.text || '未知'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <Button
                                                size="sm"
                                                variant={task.state === ReviewTaskStatus.UPLOADED ? 'primary' : 'secondary'}
                                                onClick={() => setSelectedTask(task)}
                                                className={cn(
                                                    "h-9 rounded-xl px-5 text-xs font-bold transition-transform active:scale-95",
                                                    task.state === ReviewTaskStatus.UPLOADED ? "shadow-md shadow-primary-500/20" : "bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                                )}
                                            >
                                                {task.state === ReviewTaskStatus.UPLOADED ? '审核' : '详情'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Review Modal */}
            <Modal
                title={`追评详情 - ${statusLabels[selectedTask?.state ?? 0]?.text || ''}`}
                open={selectedTask !== null}
                onClose={() => setSelectedTask(null)}
                className="max-w-xl rounded-[32px]"
            >
                {selectedTask && (
                    <div className="space-y-8">
                        {/* Task Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 rounded-[24px] bg-slate-50 p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">任务编号</span>
                                        <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100">{selectedTask.taskNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-500">平台订单号</span>
                                        <span className="font-bold text-slate-900">{selectedTask.platformOrderNumber || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[24px] bg-indigo-50 p-5">
                                <div className="text-xs font-bold text-indigo-400 mb-1">追评费用</div>
                                <div className="text-2xl font-black text-indigo-600">¥{Number(selectedTask.money).toFixed(2)}</div>
                            </div>
                            <div className="rounded-[24px] bg-emerald-50 p-5">
                                <div className="text-xs font-bold text-emerald-500 mb-1">买手佣金</div>
                                <div className="text-2xl font-black text-emerald-600">¥{Number(selectedTask.userMoney).toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Submitted Images */}
                        {selectedTask.img && parseImages(selectedTask.img).length > 0 && (
                            <div>
                                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">买手上传的追评截图</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {parseImages(selectedTask.img).map((img, idx) => (
                                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-[20px] bg-slate-100 ring-1 ring-slate-100 transition-all hover:ring-primary-500 hover:ring-2 hover:shadow-lg">
                                            <img src={img} alt="" className="h-full w-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110" onClick={() => window.open(img, '_blank')} />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10 pointer-events-none">
                                                <span className="opacity-0 transition-opacity group-hover:opacity-100 text-white text-2xl drop-shadow-md">🔍</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {selectedTask.uploadTime && (
                                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <span>⏰</span>
                                        <span>上传时间: {new Date(selectedTask.uploadTime).toLocaleString('zh-CN')}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                            {selectedTask.state === ReviewTaskStatus.UPLOADED ? (
                                <>
                                    <Button variant="secondary" onClick={() => handleCancel(selectedTask.id)} disabled={processing} className="rounded-[16px] h-12 px-6 font-bold text-slate-500 hover:text-red-500 hover:bg-red-50">取消任务</Button>
                                    <Button onClick={() => handleConfirm(selectedTask.id)} disabled={processing} className="rounded-[16px] h-12 px-8 bg-primary-600 hover:bg-primary-700 font-bold text-white shadow-lg shadow-primary-500/20 active:scale-95 transition-all">{processing ? '处理中...' : '确认完成'}</Button>
                                </>
                            ) : (
                                (selectedTask.state === ReviewTaskStatus.UNPAID || selectedTask.state === ReviewTaskStatus.PAID || selectedTask.state === ReviewTaskStatus.APPROVED) ? (
                                    <>
                                        <Button variant="secondary" onClick={() => handleCancel(selectedTask.id)} disabled={processing} className="rounded-[16px] h-12 px-6 font-bold text-slate-500 hover:text-red-500 hover:bg-red-50">取消任务</Button>
                                        <Button variant="secondary" onClick={() => setSelectedTask(null)} className="rounded-[16px] h-12 px-8 font-bold">关闭</Button>
                                    </>
                                ) : (
                                    <Button variant="secondary" onClick={() => setSelectedTask(null)} className="rounded-[16px] h-12 w-full font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">关闭详情</Button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

