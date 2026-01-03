'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';

interface TaskDetail {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopId: string;
    shopName: string;
    url: string;
    mainImage: string;
    keyword: string;
    taoWord?: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    isFreeShipping: number;
    isPraise: boolean;
    praiseType: string;
    praiseList: string[];
    isTimingPublish: boolean;
    publishTime?: string;
    isTimingPay: boolean;
    timingPayTime?: string;
    isCycleTime: boolean;
    cycleTime?: number;
    addReward: number;
    totalDeposit: number;
    totalCommission: number;
    baseServiceFee: number;
    praiseFee: number;
    postageMoney: number;
    marginMoney: number;
    createdAt: string;
    updatedAt: string;
}

interface OrderItem {
    id: string;
    buynoAccount: string;
    status: string;
    productPrice: number;
    commission: number;
    createdAt: string;
    completedAt?: string;
}

const TaskTypeMap: Record<number, string> = {
    1: '淘宝',
    2: '天猫',
    3: '京东',
    4: '拼多多'
};

const TaskStatusMap: Record<number, { text: string; color: string; bg: string }> = {
    0: { text: '待支付', color: '#d97706', bg: '#fef3c7' },
    1: { text: '进行中', color: '#16a34a', bg: '#dcfce7' },
    2: { text: '已完成', color: '#4f46e5', bg: '#e0e7ff' },
    3: { text: '已取消', color: '#dc2626', bg: '#fee2e2' },
    4: { text: '待审核', color: '#9333ea', bg: '#f3e8ff' },
};

const OrderStatusMap: Record<string, { text: string; color: string }> = {
    PENDING: { text: '进行中', color: '#3b82f6' },
    SUBMITTED: { text: '待审核', color: '#f59e0b' },
    APPROVED: { text: '已通过', color: '#10b981' },
    REJECTED: { text: '已驳回', color: '#ef4444' },
    COMPLETED: { text: '已完成', color: '#6b7280' },
};

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.id as string;

    const [task, setTask] = useState<TaskDetail | null>(null);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (taskId) {
            loadTaskDetail();
        }
    }, [taskId]);

    const loadTaskDetail = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }

        setLoading(true);
        try {
            // Load task detail
            const taskRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const taskJson = await taskRes.json();
            if (taskJson.success) {
                setTask(taskJson.data);
            } else {
                alert('任务不存在或无权访问');
                router.push('/merchant/tasks');
                return;
            }

            // Load related orders
            const ordersRes = await fetch(`${BASE_URL}/orders/task/${taskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ordersJson = await ordersRes.json();
            if (ordersJson.success) {
                setOrders(ordersJson.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('确定要取消此任务吗？已冻结的资金将返还到您的账户。')) return;

        const token = localStorage.getItem('merchantToken');
        setCancelling(true);
        try {
            const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                alert('任务已取消，资金已返还');
                loadTaskDetail();
            } else {
                alert(json.message || '取消失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                加载中...
            </div>
        );
    }

    if (!task) {
        return (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ color: '#6b7280' }}>任务不存在</div>
                <button
                    onClick={() => router.push('/merchant/tasks')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 24px',
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    返回列表
                </button>
            </div>
        );
    }

    const statusStyle = TaskStatusMap[task.status] || { text: '未知', color: '#6b7280', bg: '#f3f4f6' };
    const progress = task.count > 0 ? (task.completedCount / task.count) * 100 : 0;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => router.push('/merchant/tasks')}
                        style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        ← 返回列表
                    </button>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>任务详情</h1>
                </div>
                <span style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: statusStyle.bg,
                    color: statusStyle.color
                }}>
                    {statusStyle.text}
                </span>
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Left Column */}
                <div>
                    {/* Product Info Card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>商品信息</h2>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            {task.mainImage && (
                                <img
                                    src={task.mainImage}
                                    alt=""
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>{task.title}</div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        background: '#e0e7ff',
                                        color: '#4f46e5',
                                        borderRadius: '4px',
                                        marginRight: '8px',
                                        fontSize: '12px'
                                    }}>
                                        {TaskTypeMap[task.taskType] || '未知平台'}
                                    </span>
                                    {task.shopName}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
                                    ¥{Number(task.goodsPrice).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    关键词: <span style={{ color: '#4f46e5' }}>{task.keyword}</span>
                                </div>
                                {task.url && (
                                    <a
                                        href={task.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none' }}
                                    >
                                        查看商品链接 →
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Task Progress Card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>任务进度</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>{task.count}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>总任务数</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{task.claimedCount}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>已领取</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{task.completedCount}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>已完成</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>{task.count - task.claimedCount}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>剩余可接</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                                <span>完成进度</span>
                                <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>关联订单 ({orders.length})</h2>
                        </div>
                        {orders.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                暂无订单
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>买号</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>金额</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>状态</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '14px 16px', fontSize: '14px' }}>{order.buynoAccount}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ fontWeight: '500' }}>¥{Number(order.productPrice).toFixed(2)}</div>
                                                <div style={{ fontSize: '12px', color: '#10b981' }}>佣金 ¥{Number(order.commission).toFixed(2)}</div>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    background: (OrderStatusMap[order.status]?.color || '#6b7280') + '20',
                                                    color: OrderStatusMap[order.status]?.color || '#6b7280'
                                                }}>
                                                    {OrderStatusMap[order.status]?.text || order.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                                                {new Date(order.createdAt).toLocaleString('zh-CN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Task Info Card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>任务信息</h2>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>任务编号</span>
                                <span style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{task.taskNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>创建时间</span>
                                <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>包邮</span>
                                <span>{task.isFreeShipping === 1 ? '是' : '否'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>好评要求</span>
                                <span>{task.isPraise ? (task.praiseType === 'text' ? '文字好评' : task.praiseType === 'image' ? '图片好评' : '视频好评') : '无'}</span>
                            </div>
                            {task.addReward > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>额外奖励</span>
                                    <span style={{ color: '#f59e0b' }}>+¥{task.addReward}/单</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Breakdown Card */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>费用明细</h2>
                        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>商品本金 × {task.count}</span>
                                <span>¥{(task.goodsPrice * task.count).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>基础服务费</span>
                                <span>¥{(task.baseServiceFee * task.count).toFixed(2)}</span>
                            </div>
                            {task.praiseFee > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>好评费用</span>
                                    <span>¥{(task.praiseFee * task.count).toFixed(2)}</span>
                                </div>
                            )}
                            {task.postageMoney > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>邮费</span>
                                    <span>¥{task.postageMoney.toFixed(2)}</span>
                                </div>
                            )}
                            {task.marginMoney > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>保证金</span>
                                    <span>¥{task.marginMoney.toFixed(2)}</span>
                                </div>
                            )}
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginTop: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                    <span>押金总计</span>
                                    <span style={{ color: '#4f46e5' }}>¥{task.totalDeposit.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginTop: '6px' }}>
                                    <span>佣金总计</span>
                                    <span style={{ color: '#ef4444' }}>¥{task.totalCommission.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {task.status === 1 && task.claimedCount === 0 && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#fff',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                cursor: cancelling ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                opacity: cancelling ? 0.7 : 1
                            }}
                        >
                            {cancelling ? '取消中...' : '取消任务'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
