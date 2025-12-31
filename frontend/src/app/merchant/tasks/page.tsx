'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number; // Enum: 1=Taobao, etc.
    goodsPrice: number;
    count: number;
    claimedCount: number;
    totalCommission: number;
    status: number; // Enum 0,1,2...
    createdAt: string;
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

export default function MerchantTasksPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState({ status: 'all', taskType: 'all' });

    useEffect(() => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }
        loadTasks();
    }, [router]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('merchantToken');
            // Construct query params
            const query = new URLSearchParams();
            if (filter.status !== 'all') query.append('status', filter.status);
            if (filter.taskType !== 'all') query.append('taskType', filter.taskType);

            const response = await fetch(`${BASE_URL}/tasks?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resData = await response.json();
            if (resData.success && Array.isArray(resData.data)) {
                setTasks(resData.data);
            }
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: number) => {
        const style = TaskStatusMap[status] || { text: '未知', color: '#6b7280', bg: '#f3f4f6' };
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
            }}>
                {style.text}
            </span>
        );
    };

    const thStyle: React.CSSProperties = {
        padding: '14px 16px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: '600',
        color: '#6b7280',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
    };

    const tdStyle: React.CSSProperties = {
        padding: '16px',
        fontSize: '14px',
        color: '#1f2937',
        borderBottom: '1px solid #e5e7eb'
    };

    return (
        <div>
            {/* 顶栏：标题 + 按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>任务管理</h1>
                <button
                    onClick={() => router.push('/merchant/tasks/new')}
                    style={{
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                    }}
                >
                    <span style={{ fontSize: '18px' }}>+</span>
                    发布任务
                </button>
            </div>

            {/* 筛选栏 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>状态:</span>
                    <select
                        value={filter.status}
                        onChange={e => setFilter({ ...filter, status: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    >
                        <option value="all">全部</option>
                        <option value="1">进行中</option>
                        <option value="2">已完成</option>
                        <option value="3">已取消</option>
                        <option value="0">待支付</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>平台:</span>
                    <select
                        value={filter.taskType}
                        onChange={e => setFilter({ ...filter, taskType: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    >
                        <option value="all">全部</option>
                        <option value="1">淘宝</option>
                        <option value="2">天猫</option>
                        <option value="3">京东</option>
                        <option value="4">拼多多</option>
                    </select>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    共 <strong style={{ color: '#1f2937' }}>{tasks.length}</strong> 条任务
                </div>
                <button
                    onClick={loadTasks}
                    style={{
                        padding: '8px 16px',
                        background: '#f3f4f6',
                        color: '#4b5563',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    刷新
                </button>
            </div>

            {/* 任务表格 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px' }}>暂无任务</div>
                        <button
                            onClick={() => router.push('/merchant/tasks/new')}
                            style={{
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            发布第一个任务
                        </button>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>任务编号</th>
                                <th style={thStyle}>商品信息</th>
                                <th style={thStyle}>平台</th>
                                <th style={thStyle}>佣金</th>
                                <th style={thStyle}>进度</th>
                                <th style={thStyle}>状态</th>
                                <th style={thStyle}>发布时间</th>
                                <th style={thStyle}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td style={tdStyle}>
                                        <span style={{ fontFamily: 'monospace', color: '#4f46e5' }}>{task.taskNumber}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: '500' }}>{task.title}</div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>¥{task.goodsPrice}</div>
                                    </td>
                                    <td style={tdStyle}>{TaskTypeMap[task.taskType] || '未知'}</td>
                                    <td style={tdStyle}>
                                        <span style={{ color: '#dc2626', fontWeight: '600' }}>¥{task.totalCommission}</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '6px',
                                                background: '#e5e7eb',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${task.count > 0 ? (task.claimedCount / task.count) * 100 : 0}%`,
                                                    height: '100%',
                                                    background: '#4f46e5',
                                                    borderRadius: '3px'
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                                {task.claimedCount}/{task.count}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>{getStatusBadge(task.status)}</td>
                                    <td style={tdStyle}>
                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <button
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #e5e7eb',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '13px',
                                                color: '#4f46e5',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            查看
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
