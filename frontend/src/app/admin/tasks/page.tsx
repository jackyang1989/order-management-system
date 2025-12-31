'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    status: number;
    createdAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待支付', color: '#8c8c8c' },
    1: { text: '进行中', color: '#52c41a' },
    2: { text: '已完成', color: '#1890ff' },
    3: { text: '已取消', color: '#ff4d4f' },
    4: { text: '待审核', color: '#faad14' },
};

const platformLabels: Record<number, string> = {
    1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多',
};

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadTasks();
    }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}`;
            if (filter !== undefined) url += `&status=${filter}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTasks(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: number) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const json = await res.json();
            if (json.success) { alert('状态更新成功'); loadTasks(); }
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>状态筛选：</span>
                {[
                    { label: '全部', value: undefined },
                    { label: '进行中', value: 1 },
                    { label: '待审核', value: 4 },
                    { label: '已完成', value: 2 },
                    { label: '已取消', value: 3 },
                ].map(item => (
                    <button key={String(item.value)} onClick={() => { setFilter(item.value); setPage(1); }} style={{ padding: '6px 16px', borderRadius: '4px', border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9', background: filter === item.value ? '#e6f7ff' : '#fff', color: filter === item.value ? '#1890ff' : '#666', cursor: 'pointer' }}>
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 任务列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无任务</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>任务编号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>标题</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>单价</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>进度</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#666' }}>{task.taskNumber}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{platformLabels[task.taskType] || '其他'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000', fontWeight: '500' }}>¥{Number(task.goodsPrice).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ color: '#1890ff' }}>{task.claimedCount}</span>
                                            <span style={{ color: '#999' }}> / {task.count}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[task.status]?.color || '#999') + '20', color: statusLabels[task.status]?.color || '#999' }}>
                                                {statusLabels[task.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>{new Date(task.createdAt).toLocaleDateString('zh-CN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <select value={task.status} onChange={e => handleUpdateStatus(task.id, parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9', fontSize: '13px' }}>
                                                {Object.entries(statusLabels).map(([val, label]) => (
                                                    <option key={val} value={val}>{label.text}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={tasks.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: tasks.length < 20 ? 'not-allowed' : 'pointer', opacity: tasks.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
