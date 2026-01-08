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

const statsColorMap: Record<string, string> = {
    '#f59e0b': 'text-amber-500',
    '#8b5cf6': 'text-purple-500',
    '#10b981': 'text-green-600',
    '#6b7280': 'text-slate-500',
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
        { label: '待支付', value: stats.unpaid, color: '#f59e0b', statusFilter: ReviewTaskStatus.UNPAID },
        { label: '待确认', value: stats.uploaded, color: '#8b5cf6', statusFilter: ReviewTaskStatus.UPLOADED },
        { label: '已完成', value: stats.completed, color: '#10b981', statusFilter: ReviewTaskStatus.COMPLETED },
        { label: '已取消', value: stats.cancelled + stats.rejected, color: '#6b7280', statusFilter: undefined },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {statsCards.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => setFilter(stat.statusFilter)}
                        className={cn(
                            'cursor-pointer rounded-lg border p-5 transition-all',
                            filter === stat.statusFilter ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
                        )}
                    >
                        <div className={cn('text-3xl font-bold', statsColorMap[stat.color] || 'text-slate-600')}>{stat.value}</div>
                        <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tasks Table */}
            <Card className="overflow-hidden bg-white p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold">追评任务列表</h2>
                    <Button
                        size="sm"
                        variant={filter === undefined ? 'primary' : 'secondary'}
                        onClick={() => setFilter(undefined)}
                    >
                        显示全部
                    </Button>
                </div>

                {loading ? (
                    <div className="py-12 text-center text-slate-500">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">暂无追评任务</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">任务编号</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">费用</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">买手佣金</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">创建时间</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">状态</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className="border-b border-slate-100">
                                        <td className="px-4 py-4 text-sm text-slate-700">{task.taskNumber}</td>
                                        <td className="px-4 py-4 font-medium text-red-500">¥{Number(task.money).toFixed(2)}</td>
                                        <td className="px-4 py-4 font-medium text-green-600">¥{Number(task.userMoney).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-xs text-slate-500">{new Date(task.createdAt).toLocaleString('zh-CN')}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={statusLabels[task.state]?.color || 'slate'}>{statusLabels[task.state]?.text || '未知'}</Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Button
                                                size="sm"
                                                variant={task.state === ReviewTaskStatus.UPLOADED ? 'primary' : 'secondary'}
                                                onClick={() => setSelectedTask(task)}
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
                className="max-w-lg"
            >
                {selectedTask && (
                    <div className="space-y-5">
                        {/* Task Info */}
                        <div className="rounded-lg bg-slate-50 p-4">
                            <div className="mb-2 text-sm"><span className="text-slate-500">任务编号：</span>{selectedTask.taskNumber}</div>
                            <div className="mb-2 text-sm"><span className="text-slate-500">追评费用：</span><span className="font-medium text-red-500">¥{Number(selectedTask.money).toFixed(2)}</span></div>
                            <div className="mb-2 text-sm"><span className="text-slate-500">买手佣金：</span><span className="font-medium text-green-600">¥{Number(selectedTask.userMoney).toFixed(2)}</span></div>
                            {selectedTask.platformOrderNumber && <div className="text-sm"><span className="text-slate-500">平台订单号：</span>{selectedTask.platformOrderNumber}</div>}
                        </div>

                        {/* Submitted Images */}
                        {selectedTask.img && parseImages(selectedTask.img).length > 0 && (
                            <div>
                                <h3 className="mb-3 font-semibold">买手上传的追评截图</h3>
                                <div className="flex flex-wrap gap-2">
                                    {parseImages(selectedTask.img).map((img, idx) => (
                                        <img key={idx} src={img} alt="" className="h-[100px] w-[100px] cursor-pointer rounded-lg object-cover" onClick={() => window.open(img, '_blank')} />
                                    ))}
                                </div>
                                {selectedTask.uploadTime && <div className="mt-2 text-xs text-slate-400">上传时间: {new Date(selectedTask.uploadTime).toLocaleString('zh-CN')}</div>}
                            </div>
                        )}

                        {/* Actions for UPLOADED status */}
                        {selectedTask.state === ReviewTaskStatus.UPLOADED && (
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <Button variant="destructive" onClick={() => handleCancel(selectedTask.id)} disabled={processing}>取消任务</Button>
                                <Button className="bg-green-500 hover:bg-green-600" onClick={() => handleConfirm(selectedTask.id)} disabled={processing}>{processing ? '处理中...' : '确认完成'}</Button>
                            </div>
                        )}

                        {/* Actions for cancellable statuses */}
                        {(selectedTask.state === ReviewTaskStatus.UNPAID || selectedTask.state === ReviewTaskStatus.PAID || selectedTask.state === ReviewTaskStatus.APPROVED) && (
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <Button variant="destructive" onClick={() => handleCancel(selectedTask.id)} disabled={processing}>{processing ? '处理中...' : '取消任务'}</Button>
                                <Button variant="secondary" onClick={() => setSelectedTask(null)}>关闭</Button>
                            </div>
                        )}

                        {/* Close button for other statuses */}
                        {(selectedTask.state === ReviewTaskStatus.COMPLETED || selectedTask.state === ReviewTaskStatus.CANCELLED || selectedTask.state === ReviewTaskStatus.BUYER_REJECTED || selectedTask.state === ReviewTaskStatus.REJECTED) && (
                            <div className="border-t border-slate-100 pt-5 text-right">
                                <Button variant="secondary" onClick={() => setSelectedTask(null)}>关闭</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
