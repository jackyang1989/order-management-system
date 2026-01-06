'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';

interface TaskDetail { id: string; taskNumber: string; title: string; taskType: number; shopId: string; shopName: string; url: string; mainImage: string; keyword: string; taoWord?: string; goodsPrice: number; count: number; claimedCount: number; completedCount: number; status: number; isFreeShipping: number; isPraise: boolean; praiseType: string; praiseList: string[]; isTimingPublish: boolean; publishTime?: string; isTimingPay: boolean; timingPayTime?: string; isCycleTime: boolean; cycleTime?: number; addReward: number; totalDeposit: number; totalCommission: number; baseServiceFee: number; praiseFee: number; postageMoney: number; marginMoney: number; createdAt: string; updatedAt: string; }
interface OrderItem { id: string; buynoAccount: string; status: string; productPrice: number; commission: number; createdAt: string; completedAt?: string; }

const TaskTypeMap: Record<number, string> = { 1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多' };
const TaskStatusMap: Record<number, { text: string; color: 'amber' | 'green' | 'indigo' | 'red' | 'purple' | 'slate' }> = { 0: { text: '待支付', color: 'amber' }, 1: { text: '进行中', color: 'green' }, 2: { text: '已完成', color: 'indigo' }, 3: { text: '已取消', color: 'red' }, 4: { text: '待审核', color: 'purple' } };
const OrderStatusMap: Record<string, { text: string; color: 'blue' | 'amber' | 'green' | 'red' | 'slate' }> = { PENDING: { text: '进行中', color: 'blue' }, SUBMITTED: { text: '待审核', color: 'amber' }, APPROVED: { text: '已通过', color: 'green' }, REJECTED: { text: '已驳回', color: 'red' }, COMPLETED: { text: '已完成', color: 'slate' } };

export default function TaskDetailPage() {
    const params = useParams(); const router = useRouter(); const taskId = params.id as string;
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => { if (taskId) loadTaskDetail(); }, [taskId]);

    const loadTaskDetail = async () => {
        const token = localStorage.getItem('merchantToken'); if (!token) { router.push('/merchant/login'); return; }
        setLoading(true);
        try {
            const taskRes = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const taskJson = await taskRes.json();
            if (taskJson.success) setTask(taskJson.data); else { alert('任务不存在或无权访问'); router.push('/merchant/tasks'); return; }
            const ordersRes = await fetch(`${BASE_URL}/orders/task/${taskId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const ordersJson = await ordersRes.json(); if (ordersJson.success) setOrders(ordersJson.data || []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCancel = async () => {
        if (!confirm('确定要取消此任务吗？已冻结的资金将返还到您的账户。')) return;
        const token = localStorage.getItem('merchantToken'); setCancelling(true);
        try { const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); const json = await res.json(); if (json.success) { alert('任务已取消，资金已返还'); loadTaskDetail(); } else alert(json.message || '取消失败'); }
        catch { alert('网络错误'); } finally { setCancelling(false); }
    };

    if (loading) return <div className="flex h-[400px] items-center justify-center text-slate-500">加载中...</div>;

    if (!task) {
        return (
            <div className="py-16 text-center">
                <div className="mb-4 text-5xl">📋</div><div className="mb-5 text-slate-500">任务不存在</div>
                <Button onClick={() => router.push('/merchant/tasks')}>返回列表</Button>
            </div>
        );
    }

    const statusStyle = TaskStatusMap[task.status] || { text: '未知', color: 'slate' as const };
    const progress = task.count > 0 ? (task.completedCount / task.count) * 100 : 0;
    const statCards = [{ value: task.count, label: '总任务数', color: 'text-indigo-600' }, { value: task.claimedCount, label: '已领取', color: 'text-amber-500' }, { value: task.completedCount, label: '已完成', color: 'text-green-500' }, { value: task.count - task.claimedCount, label: '剩余可接', color: 'text-slate-500' }];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/merchant/tasks')} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200">← 返回列表</button>
                    <h1 className="text-2xl font-bold">任务详情</h1>
                </div>
                <Badge variant="soft" color={statusStyle.color} className="rounded-full px-4 py-1.5 text-sm font-medium">{statusStyle.text}</Badge>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="col-span-2 space-y-6">
                    {/* Product Info */}
                    <Card className="bg-white p-6">
                        <h2 className="mb-5 text-base font-semibold">商品信息</h2>
                        <div className="flex gap-5">
                            {task.mainImage && <img src={task.mainImage} alt="" className="h-[120px] w-[120px] rounded-lg border border-slate-200 object-cover" />}
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 text-base font-medium">{task.title}</div>
                                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                                    <Badge variant="soft" color="indigo" className="text-xs">{TaskTypeMap[task.taskType] || '未知平台'}</Badge>{task.shopName}
                                </div>
                                <div className="mb-2 text-xl font-bold text-red-500">¥{Number(task.goodsPrice).toFixed(2)}</div>
                                <div className="text-[13px] text-slate-500">关键词: <span className="text-indigo-600">{task.keyword}</span></div>
                                {task.url && <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-500">查看商品链接 →</a>}
                            </div>
                        </div>
                    </Card>

                    {/* Task Progress */}
                    <Card className="bg-white p-6">
                        <h2 className="mb-5 text-base font-semibold">任务进度</h2>
                        <div className="mb-5 grid grid-cols-4 gap-4">
                            {statCards.map((stat, i) => (
                                <div key={i} className="rounded-lg bg-slate-50 p-4 text-center">
                                    <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                                    <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="mb-1.5 flex justify-between text-[13px] text-slate-500"><span>完成进度</span><span>{progress.toFixed(1)}%</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </Card>

                    {/* Orders List */}
                    <Card className="overflow-hidden bg-white">
                        <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-base font-semibold">关联订单 ({orders.length})</h2></div>
                        {orders.length === 0 ? (
                            <div className="py-10 text-center text-slate-500">暂无订单</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-[600px] w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="px-4 py-3 text-left text-[13px] text-slate-500">买号</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-slate-500">金额</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-slate-500">状态</th>
                                            <th className="px-4 py-3 text-left text-[13px] text-slate-500">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => {
                                            const orderStatus = OrderStatusMap[order.status] || { text: order.status, color: 'slate' as const };
                                            return (
                                                <tr key={order.id} className="border-b border-slate-100">
                                                    <td className="px-4 py-3.5 text-sm">{order.buynoAccount}</td>
                                                    <td className="px-4 py-3.5"><div className="font-medium">¥{Number(order.productPrice).toFixed(2)}</div><div className="text-xs text-green-500">佣金 ¥{Number(order.commission).toFixed(2)}</div></td>
                                                    <td className="px-4 py-3.5"><Badge variant="soft" color={orderStatus.color}>{orderStatus.text}</Badge></td>
                                                    <td className="px-4 py-3.5 text-[13px] text-slate-500">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    {/* Task Info */}
                    <Card className="bg-white p-6">
                        <h2 className="mb-5 text-base font-semibold">任务信息</h2>
                        <div className="grid gap-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">任务编号</span><span className="font-mono text-indigo-600">{task.taskNumber}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">创建时间</span><span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">包邮</span><span>{task.isFreeShipping === 1 ? '是' : '否'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">好评要求</span><span>{task.isPraise ? (task.praiseType === 'text' ? '文字好评' : task.praiseType === 'image' ? '图片好评' : '视频好评') : '无'}</span></div>
                            {task.addReward > 0 && <div className="flex justify-between"><span className="text-slate-500">额外奖励</span><span className="text-amber-500">+¥{task.addReward}/单</span></div>}
                        </div>
                    </Card>

                    {/* Fee Breakdown */}
                    <Card className="bg-white p-6">
                        <h2 className="mb-5 text-base font-semibold">费用明细</h2>
                        <div className="grid gap-2.5 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">商品本金 × {task.count}</span><span>¥{(task.goodsPrice * task.count).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">基础服务费</span><span>¥{(task.baseServiceFee * task.count).toFixed(2)}</span></div>
                            {task.praiseFee > 0 && <div className="flex justify-between"><span className="text-slate-500">好评费用</span><span>¥{(task.praiseFee * task.count).toFixed(2)}</span></div>}
                            {task.postageMoney > 0 && <div className="flex justify-between"><span className="text-slate-500">邮费</span><span>¥{task.postageMoney.toFixed(2)}</span></div>}
                            {task.marginMoney > 0 && <div className="flex justify-between"><span className="text-slate-500">保证金</span><span>¥{task.marginMoney.toFixed(2)}</span></div>}
                            <div className="mt-1.5 border-t border-slate-200 pt-2.5">
                                <div className="flex justify-between font-semibold"><span>押金总计</span><span className="text-indigo-600">¥{task.totalDeposit.toFixed(2)}</span></div>
                                <div className="mt-1.5 flex justify-between font-semibold"><span>佣金总计</span><span className="text-red-500">¥{task.totalCommission.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    {task.status === 1 && task.claimedCount === 0 && (
                        <button onClick={handleCancel} disabled={cancelling} className={cn('w-full rounded-lg border border-red-500 bg-white px-3 py-3 font-medium text-red-500 hover:bg-red-50', cancelling && 'cursor-not-allowed opacity-70')}>{cancelling ? '取消中...' : '取消任务'}</button>
                    )}
                </div>
            </div>
        </div>
    );
}
