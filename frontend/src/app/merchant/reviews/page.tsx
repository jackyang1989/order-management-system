'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

// 追评任务状态枚举（匹配后端）
enum ReviewTaskStatus {
    UNPAID = 0,           // 未支付
    PAID = 1,             // 已支付 (等待管理员审核)
    APPROVED = 2,         // 已审核 (通知买手去追评)
    UPLOADED = 3,         // 已上传 (买手已上传追评截图，等待商家确认)
    COMPLETED = 4,        // 已完成
    CANCELLED = 5,        // 已取消
    BUYER_REJECTED = 6,   // 买手拒接
    REJECTED = 7,         // 已拒绝
}

interface ReviewTask {
    id: string;
    merchantId: string;
    userId: string;
    buynoId: string;
    shopId: string;
    taobaoOrderNumber: string;
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

interface Stats {
    unpaid: number;
    paid: number;
    approved: number;
    uploaded: number;
    completed: number;
    cancelled: number;
    rejected: number;
}

const statusLabels: Record<ReviewTaskStatus, { text: string; color: string }> = {
    [ReviewTaskStatus.UNPAID]: { text: '待支付', color: '#f59e0b' },
    [ReviewTaskStatus.PAID]: { text: '待审核', color: '#6366f1' },
    [ReviewTaskStatus.APPROVED]: { text: '待追评', color: '#3b82f6' },
    [ReviewTaskStatus.UPLOADED]: { text: '待确认', color: '#8b5cf6' },
    [ReviewTaskStatus.COMPLETED]: { text: '已完成', color: '#10b981' },
    [ReviewTaskStatus.CANCELLED]: { text: '已取消', color: '#6b7280' },
    [ReviewTaskStatus.BUYER_REJECTED]: { text: '买手拒接', color: '#ef4444' },
    [ReviewTaskStatus.REJECTED]: { text: '已拒绝', color: '#dc2626' },
};

export default function MerchantReviewsPage() {
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [stats, setStats] = useState<Stats>({
        unpaid: 0, paid: 0, approved: 0, uploaded: 0, completed: 0, cancelled: 0, rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(ReviewTaskStatus.UPLOADED); // 默认显示待确认
    const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        setLoading(true);
        try {
            // Load tasks - 使用正确的API路径
            const params = new URLSearchParams({ page: '1', limit: '50' });
            if (filter !== undefined) {
                params.append('state', filter.toString());
            }
            const url = `${BASE_URL}/review-tasks/merchant/list?${params}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setTasks(json.data.list || []);
            }

            // Load stats
            const statsRes = await fetch(`${BASE_URL}/review-tasks/merchant/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statsJson = await statsRes.json();
            if (statsJson.success) {
                setStats(statsJson.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // 商家确认追评完成
    const handleConfirm = async (taskId: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        if (!confirm('确认追评已完成？佣金将发放给买手')) return;

        setProcessing(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reviewTaskId: taskId })
            });
            const json = await res.json();
            if (json.success) {
                alert('确认成功，佣金已发放给买手');
                setSelectedTask(null);
                loadData();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setProcessing(false);
        }
    };

    // 商家取消追评任务
    const handleCancel = async (taskId: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        const reason = prompt('请输入取消原因（可选）：');
        if (!confirm('确认取消此追评任务？费用将退还')) return;

        setProcessing(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reviewTaskId: taskId, reason: reason || undefined })
            });
            const json = await res.json();
            if (json.success) {
                alert('取消成功，费用已退还');
                setSelectedTask(null);
                loadData();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setProcessing(false);
        }
    };

    // 解析已上传的图片
    const parseImages = (imgStr: string): string[] => {
        if (!imgStr) return [];
        try {
            return JSON.parse(imgStr);
        } catch {
            return imgStr.split(',').filter(Boolean);
        }
    };

    const statsCards = [
        { label: '待支付', value: stats.unpaid, color: '#f59e0b', statusFilter: ReviewTaskStatus.UNPAID },
        { label: '待确认', value: stats.uploaded, color: '#8b5cf6', statusFilter: ReviewTaskStatus.UPLOADED },
        { label: '已完成', value: stats.completed, color: '#10b981', statusFilter: ReviewTaskStatus.COMPLETED },
        { label: '已取消', value: stats.cancelled + stats.rejected, color: '#6b7280', statusFilter: undefined },
    ];

    return (
        <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {statsCards.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => setFilter(stat.statusFilter)}
                        style={{
                            background: filter === stat.statusFilter ? '#eef2ff' : '#fff',
                            border: `1px solid ${filter === stat.statusFilter ? '#4f46e5' : '#e5e7eb'}`,
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tasks Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>追评任务列表</h2>
                    <button
                        onClick={() => setFilter(undefined)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            background: filter === undefined ? '#4f46e5' : '#fff',
                            color: filter === undefined ? '#fff' : '#374151',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        显示全部
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>暂无追评任务</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>任务编号</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>费用</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>买手佣金</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>创建时间</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>状态</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                                        {task.taskNumber}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '500', color: '#ef4444' }}>
                                        ¥{Number(task.money).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '500', color: '#10b981' }}>
                                        ¥{Number(task.userMoney).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                                        {new Date(task.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: (statusLabels[task.state]?.color || '#6b7280') + '20',
                                            color: statusLabels[task.state]?.color || '#6b7280'
                                        }}>
                                            {statusLabels[task.state]?.text || '未知'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedTask(task)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '6px',
                                                border: task.state === ReviewTaskStatus.UPLOADED ? 'none' : '1px solid #d1d5db',
                                                background: task.state === ReviewTaskStatus.UPLOADED ? '#4f46e5' : '#fff',
                                                color: task.state === ReviewTaskStatus.UPLOADED ? '#fff' : '#374151',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {task.state === ReviewTaskStatus.UPLOADED ? '审核' : '查看'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Review Modal */}
            {selectedTask && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setSelectedTask(null)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        width: '500px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        padding: '24px'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
                            追评详情 - {statusLabels[selectedTask.state]?.text}
                        </h2>

                        {/* Task Info */}
                        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280' }}>任务编号：</span>
                                {selectedTask.taskNumber}
                            </div>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280' }}>追评费用：</span>
                                <span style={{ color: '#ef4444', fontWeight: '500' }}>¥{Number(selectedTask.money).toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280' }}>买手佣金：</span>
                                <span style={{ color: '#10b981', fontWeight: '500' }}>¥{Number(selectedTask.userMoney).toFixed(2)}</span>
                            </div>
                            {selectedTask.taobaoOrderNumber && (
                                <div style={{ fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>淘宝订单号：</span>
                                    {selectedTask.taobaoOrderNumber}
                                </div>
                            )}
                        </div>

                        {/* Submitted Images */}
                        {selectedTask.img && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>买手上传的追评截图</h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {parseImages(selectedTask.img).map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt=""
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    ))}
                                </div>
                                {selectedTask.uploadTime && (
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                        上传时间: {new Date(selectedTask.uploadTime).toLocaleString('zh-CN')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions for UPLOADED status */}
                        {selectedTask.state === ReviewTaskStatus.UPLOADED && (
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                <button
                                    onClick={() => handleCancel(selectedTask.id)}
                                    disabled={processing}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: '1px solid #ef4444',
                                        background: '#fff',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    取消任务
                                </button>
                                <button
                                    onClick={() => handleConfirm(selectedTask.id)}
                                    disabled={processing}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    {processing ? '处理中...' : '确认完成'}
                                </button>
                            </div>
                        )}

                        {/* Actions for cancellable statuses */}
                        {(selectedTask.state === ReviewTaskStatus.UNPAID ||
                            selectedTask.state === ReviewTaskStatus.PAID ||
                            selectedTask.state === ReviewTaskStatus.APPROVED) && (
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                    <button
                                        onClick={() => handleCancel(selectedTask.id)}
                                        disabled={processing}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: '1px solid #ef4444',
                                            background: '#fff',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {processing ? '处理中...' : '取消任务'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            background: '#fff',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        关闭
                                    </button>
                                </div>
                            )}

                        {/* Close button for other statuses */}
                        {(selectedTask.state === ReviewTaskStatus.COMPLETED ||
                            selectedTask.state === ReviewTaskStatus.CANCELLED ||
                            selectedTask.state === ReviewTaskStatus.BUYER_REJECTED ||
                            selectedTask.state === ReviewTaskStatus.REJECTED) && (
                                <div style={{ textAlign: 'right', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            background: '#fff',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        关闭
                                    </button>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}
