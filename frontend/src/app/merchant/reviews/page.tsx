'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface ReviewTask {
    id: string;
    orderId: string;
    userId: string;
    buynoAccount: string;
    content: string;
    commission: number;
    status: number;
    deadline: string;
    submittedContent?: string;
    submittedImages?: string[];
    submittedAt?: string;
    createdAt: string;
}

interface Stats {
    pending: number;
    submitted: number;
    completed: number;
    rejected: number;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    1: { text: '待处理', color: '#3b82f6' },
    2: { text: '待审核', color: '#f59e0b' },
    3: { text: '已通过', color: '#10b981' },
    4: { text: '已完成', color: '#6b7280' },
    5: { text: '已拒绝', color: '#ef4444' },
    6: { text: '已取消', color: '#9ca3af' },
};

export default function MerchantReviewsPage() {
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, submitted: 0, completed: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(2); // 默认显示待审核
    const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        setLoading(true);
        try {
            // Load tasks
            const url = filter ? `${BASE_URL}/review-tasks/merchant?status=${filter}` : `${BASE_URL}/review-tasks/merchant`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setTasks(json.data);
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

    const handleReview = async (taskId: string, approved: boolean, reason?: string) => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        setReviewing(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/${taskId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved, reason })
            });
            const json = await res.json();
            if (json.success) {
                alert(approved ? '追评审核通过' : '已驳回');
                setSelectedTask(null);
                loadData();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setReviewing(false);
        }
    };

    return (
        <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: '待处理', value: stats.pending, color: '#3b82f6', statusFilter: 1 },
                    { label: '待审核', value: stats.submitted, color: '#f59e0b', statusFilter: 2 },
                    { label: '已完成', value: stats.completed, color: '#10b981', statusFilter: 4 },
                    { label: '已拒绝', value: stats.rejected, color: '#ef4444', statusFilter: 5 },
                ].map((stat, idx) => (
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
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>买号</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>追评内容</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>佣金</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>截止时间</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>状态</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{task.buynoAccount || '-'}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {task.content || '(无指定内容)'}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '500', color: '#10b981' }}>¥{Number(task.commission).toFixed(2)}</td>
                                    <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                                        {new Date(task.deadline).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: (statusLabels[task.status]?.color || '#6b7280') + '20',
                                            color: statusLabels[task.status]?.color || '#6b7280'
                                        }}>
                                            {statusLabels[task.status]?.text || '未知'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedTask(task)}
                                            style={{
                                                padding: '6px 16px',
                                                borderRadius: '6px',
                                                border: task.status === 2 ? 'none' : '1px solid #d1d5db',
                                                background: task.status === 2 ? '#4f46e5' : '#fff',
                                                color: task.status === 2 ? '#fff' : '#374151',
                                                cursor: 'pointer',
                                                fontSize: '13px'
                                            }}
                                        >
                                            {task.status === 2 ? '审核' : '查看'}
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
                            追评详情 - {statusLabels[selectedTask.status]?.text}
                        </h2>

                        {/* Task Info */}
                        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280' }}>买号：</span>
                                {selectedTask.buynoAccount || '-'}
                            </div>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ color: '#6b7280' }}>佣金：</span>
                                <span style={{ color: '#10b981', fontWeight: '500' }}>¥{Number(selectedTask.commission).toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                <span style={{ color: '#6b7280' }}>要求内容：</span>
                                {selectedTask.content || '(无指定)'}
                            </div>
                        </div>

                        {/* Submitted Content */}
                        {selectedTask.submittedContent && (
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>买手提交的追评</h3>
                                <div style={{ background: '#fef3c7', borderRadius: '8px', padding: '12px', fontSize: '14px' }}>
                                    {selectedTask.submittedContent}
                                </div>
                                {selectedTask.submittedImages && selectedTask.submittedImages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        {selectedTask.submittedImages.map((img, idx) => (
                                            <img key={idx} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        {selectedTask.status === 2 && (
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        const reason = prompt('请输入驳回原因（可选）：');
                                        handleReview(selectedTask.id, false, reason || undefined);
                                    }}
                                    disabled={reviewing}
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
                                    驳回
                                </button>
                                <button
                                    onClick={() => handleReview(selectedTask.id, true)}
                                    disabled={reviewing}
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
                                    {reviewing ? '处理中...' : '通过'}
                                </button>
                            </div>
                        )}

                        {selectedTask.status !== 2 && (
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
