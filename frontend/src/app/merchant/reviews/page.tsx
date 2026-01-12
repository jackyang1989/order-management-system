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
        { label: '待支付', value: stats.unpaid, color: 'text-amber-500', bg: 'bg-amber-50', statusFilter: ReviewTaskStatus.UNPAID },
        { label: '待确认', value: stats.uploaded, color: 'text-indigo-500', bg: 'bg-indigo-50', statusFilter: ReviewTaskStatus.UPLOADED },
        { label: '已完成', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-50', statusFilter: ReviewTaskStatus.COMPLETED },
        { label: '已取消', value: stats.cancelled + stats.rejected, color: 'text-slate-500', bg: 'bg-slate-50', statusFilter: undefined },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">追评管理</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {statsCards.map((stat, idx) => (
                    <Card
                        key={idx}
                        onClick={() => setFilter(stat.statusFilter)}
                        className={cn(
                            'cursor-pointer border-0 p-6 transition-all hover:-translate-y-1 hover:shadow-lg',
                            filter === stat.statusFilter
                                ? 'bg-white ring-2 ring-primary-500 shadow-lg shadow-primary-500/10'
                                : 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                        )}
                    >
                        <div className={cn('mb-2 text-4xl font-black', stat.color)}>{stat.value}</div>
                        <div className="text-sm font-bold text-slate-400">{stat.label}</div>
                    </Card>
                ))}
            </div>

            {/* Tasks Table */}
            <Card className="overflow-hidden border-0 bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[24px]">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-bold text-slate-900">任务列表</h2>
                    <Button
                        size="sm"
                        variant={filter === undefined ? 'primary' : 'secondary'}
                        onClick={() => setFilter(undefined)}
                        className="h-9 rounded-full px-4 text-xs font-bold"
                    >
                        显示全部
                    </Button>
                </div>

                {loading ? (
                    <div className="py-20 text-center font-bold text-slate-400">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 text-5xl opacity-20">📝</div>
                        <div className="font-bold text-slate-400">暂无追评任务</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">任务编号</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">费用</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">买手佣金</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">创建时间</th>
                                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tasks.map(task => (
                                    <tr key={task.id} className="transition-colors hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{task.taskNumber}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900">¥{Number(task.money).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm font-black text-emerald-500">¥{Number(task.userMoney).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">{new Date(task.createdAt).toLocaleString('zh-CN')}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusLabels[task.state]?.color as any || 'slate'} rounded>
                                                {statusLabels[task.state]?.text || '未知'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button
                                                size="sm"
                                                variant={task.state === ReviewTaskStatus.UPLOADED ? 'primary' : 'secondary'}
                                                onClick={() => setSelectedTask(task)}
                                                className="h-8 rounded-full px-4 text-xs font-bold"
                                            >
                                                {task.state === ReviewTaskStatus.UPLOADED ? '审核' : '查看'}
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
                className="max-w-lg rounded-[32px]"
            >
                {selectedTask && (
                    <div className="space-y-6">
                        {/* Task Info */}
                        <div className="rounded-[20px] bg-slate-50 p-6">
                            <div className="mb-3 flex justify-between text-sm">
                                <span className="font-bold text-slate-500">任务编号</span>
                                <span className="font-bold text-slate-900">{selectedTask.taskNumber}</span>
                            </div>
                            <div className="mb-3 flex justify-between text-sm">
                                <span className="font-bold text-slate-500">追评费用</span>
                                <span className="font-black text-slate-900">¥{Number(selectedTask.money).toFixed(2)}</span>
                            </div>
                            <div className="mb-3 flex justify-between text-sm">
                                <span className="font-bold text-slate-500">买手佣金</span>
                                <span className="font-black text-emerald-500">¥{Number(selectedTask.userMoney).toFixed(2)}</span>
                            </div>
                            {selectedTask.platformOrderNumber && (
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-500">平台订单号</span>
                                    <span className="font-bold text-slate-900">{selectedTask.platformOrderNumber}</span>
                                </div>
                            )}
                        </div>

                        {/* Submitted Images */}
                        {selectedTask.img && parseImages(selectedTask.img).length > 0 && (
                            <div>
                                <h3 className="mb-3 text-xs font-bold uppercase text-slate-400">买手上传的追评截图</h3>
                                <div className="flex flex-wrap gap-2">
                                    {parseImages(selectedTask.img).map((img, idx) => (
                                        <div key={idx} className="relative h-24 w-24 overflow-hidden rounded-[16px] border border-slate-100 shadow-sm transition-transform hover:scale-105">
                                            <img src={img} alt="" className="h-full w-full object-cover cursor-pointer" onClick={() => window.open(img, '_blank')} />
                                        </div>
                                    ))}
                                </div>
                                {selectedTask.uploadTime && <div className="mt-2 text-xs font-medium text-slate-400">上传时间: {new Date(selectedTask.uploadTime).toLocaleString('zh-CN')}</div>}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                            {selectedTask.state === ReviewTaskStatus.UPLOADED ? (
                                <>
                                    <Button variant="secondary" onClick={() => handleCancel(selectedTask.id)} disabled={processing} className="rounded-[14px]">取消任务</Button>
                                    <Button onClick={() => handleConfirm(selectedTask.id)} disabled={processing} className="rounded-[14px] bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-none">{processing ? '处理中...' : '确认完成'}</Button>
                                </>
                            ) : (
                                (selectedTask.state === ReviewTaskStatus.UNPAID || selectedTask.state === ReviewTaskStatus.PAID || selectedTask.state === ReviewTaskStatus.APPROVED) ? (
                                    <>
                                        <Button variant="secondary" onClick={() => handleCancel(selectedTask.id)} disabled={processing} className="rounded-[14px]">取消任务</Button>
                                        <Button variant="secondary" onClick={() => setSelectedTask(null)} className="rounded-[14px]">关闭</Button>
                                    </>
                                ) : (
                                    <Button variant="secondary" onClick={() => setSelectedTask(null)} className="rounded-[14px]">关闭</Button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
