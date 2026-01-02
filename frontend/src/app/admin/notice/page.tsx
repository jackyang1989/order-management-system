'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Notice {
    id: string;
    title: string;
    content: string;
    type: number;
    target: number;
    status: number;
    sort: number;
    isTop: boolean;
    isPopup: boolean;
    coverImage: string;
    adminId: string;
    adminName: string;
    publishedAt: string;
    expiredAt: string;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

const typeLabels: Record<number, string> = {
    1: '系统公告',
    2: '活动公告',
    3: '更新公告',
    4: '通知公告',
};

const targetLabels: Record<number, { text: string; color: string }> = {
    0: { text: '所有人', color: '#1890ff' },
    1: { text: '买手', color: '#52c41a' },
    2: { text: '商家', color: '#722ed1' },
};

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '草稿', color: '#999' },
    1: { text: '已发布', color: '#52c41a' },
    2: { text: '已归档', color: '#ff4d4f' },
};

export default function AdminNoticePage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [showModal, setShowModal] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [detailModal, setDetailModal] = useState<Notice | null>(null);
    const [form, setForm] = useState({
        title: '',
        content: '',
        type: 1,
        target: 0,
        sort: 0,
        isTop: false,
        isPopup: false,
        coverImage: ''
    });

    useEffect(() => {
        loadNotices();
    }, [page, statusFilter]);

    const loadNotices = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/notices/admin/list?page=${page}&limit=20`;
            if (statusFilter !== undefined) url += `&status=${statusFilter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setNotices(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingNotice(null);
        setForm({
            title: '',
            content: '',
            type: 1,
            target: 0,
            sort: 0,
            isTop: false,
            isPopup: false,
            coverImage: ''
        });
        setShowModal(true);
    };

    const handleEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setForm({
            title: notice.title,
            content: notice.content,
            type: notice.type,
            target: notice.target,
            sort: notice.sort,
            isTop: notice.isTop,
            isPopup: notice.isPopup,
            coverImage: notice.coverImage || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const url = editingNotice
                ? `${BASE_URL}/notices/admin/${editingNotice.id}`
                : `${BASE_URL}/notices/admin`;

            const res = await fetch(url, {
                method: editingNotice ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.success) {
                setShowModal(false);
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handlePublish = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/notices/admin/${id}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleUnpublish = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/notices/admin/${id}/unpublish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleArchive = async (id: string) => {
        if (!confirm('确定要归档这条公告吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/notices/admin/${id}/archive`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleToggleTop = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/notices/admin/${id}/toggle-top`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这条公告吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/notices/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadNotices();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div>
            {/* 操作栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>公告管理</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: '#666' }}>共 {total} 条记录</span>
                        <button
                            onClick={handleCreate}
                            style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + 发布公告
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={statusFilter ?? ''}
                        onChange={e => { setStatusFilter(e.target.value !== '' ? parseInt(e.target.value) : undefined); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="">全部状态</option>
                        <option value="0">草稿</option>
                        <option value="1">已发布</option>
                        <option value="2">已归档</option>
                    </select>
                </div>
            </div>

            {/* 公告列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : notices.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无公告</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>标题</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>目标</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>置顶</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>浏览</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>发布时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notices.map(notice => (
                                    <tr key={notice.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {notice.isPopup && <span style={{ padding: '1px 4px', background: '#ff4d4f', color: '#fff', fontSize: '10px', borderRadius: '2px' }}>弹窗</span>}
                                                <span style={{ fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice.title}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666' }}>{typeLabels[notice.type] || '未知'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (targetLabels[notice.target]?.color || '#999') + '20', color: targetLabels[notice.target]?.color || '#999' }}>
                                                {targetLabels[notice.target]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[notice.status]?.color || '#999') + '20', color: statusLabels[notice.status]?.color || '#999' }}>
                                                {statusLabels[notice.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {notice.isTop ? <span style={{ color: '#faad14' }}>★</span> : <span style={{ color: '#d9d9d9' }}>☆</span>}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#666' }}>{notice.viewCount}</td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{notice.publishedAt ? new Date(notice.publishedAt).toLocaleString('zh-CN') : '-'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <button onClick={() => setDetailModal(notice)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer', fontSize: '12px' }}>查看</button>
                                                <button onClick={() => handleEdit(notice)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>编辑</button>
                                                {notice.status === 0 && (
                                                    <button onClick={() => handlePublish(notice.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>发布</button>
                                                )}
                                                {notice.status === 1 && (
                                                    <>
                                                        <button onClick={() => handleUnpublish(notice.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #faad14', background: '#fff', color: '#faad14', cursor: 'pointer', fontSize: '12px' }}>撤回</button>
                                                        <button onClick={() => handleToggleTop(notice.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #722ed1', background: '#fff', color: '#722ed1', cursor: 'pointer', fontSize: '12px' }}>{notice.isTop ? '取消置顶' : '置顶'}</button>
                                                    </>
                                                )}
                                                {notice.status !== 2 && (
                                                    <button onClick={() => handleArchive(notice.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #999', background: '#fff', color: '#999', cursor: 'pointer', fontSize: '12px' }}>归档</button>
                                                )}
                                                <button onClick={() => handleDelete(notice.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '12px' }}>删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={notices.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: notices.length < 20 ? 'not-allowed' : 'pointer', opacity: notices.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>

            {/* 详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>公告详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ margin: '0 0 12px', fontSize: '20px' }}>{detailModal.title}</h2>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#f0f0f0' }}>{typeLabels[detailModal.type]}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (targetLabels[detailModal.target]?.color || '#999') + '20', color: targetLabels[detailModal.target]?.color }}>
                                        {targetLabels[detailModal.target]?.text}
                                    </span>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[detailModal.status]?.color || '#999') + '20', color: statusLabels[detailModal.status]?.color }}>
                                        {statusLabels[detailModal.status]?.text}
                                    </span>
                                    {detailModal.isTop && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#faad1420', color: '#faad14' }}>置顶</span>}
                                    {detailModal.isPopup && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#ff4d4f20', color: '#ff4d4f' }}>弹窗</span>}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px', padding: '16px', background: '#fafafa', borderRadius: '4px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                                {detailModal.content}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', color: '#666', fontSize: '13px' }}>
                                <div><span style={{ color: '#999' }}>发布者：</span>{detailModal.adminName || '-'}</div>
                                <div><span style={{ color: '#999' }}>浏览次数：</span>{detailModal.viewCount}</div>
                                <div><span style={{ color: '#999' }}>创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                <div><span style={{ color: '#999' }}>发布时间：</span>{detailModal.publishedAt ? new Date(detailModal.publishedAt).toLocaleString('zh-CN') : '-'}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0', marginTop: '20px' }}>
                                <button onClick={() => setDetailModal(null)} style={{ padding: '10px 24px', background: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}>关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 编辑/发布弹窗 */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0 }}>{editingNotice ? '编辑公告' : '发布公告'}</h3>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>标题 <span style={{ color: '#ff4d4f' }}>*</span></label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="请输入公告标题"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>内容 <span style={{ color: '#ff4d4f' }}>*</span></label>
                                <textarea
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                    placeholder="请输入公告内容"
                                    rows={6}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>类型</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                    >
                                        <option value={1}>系统公告</option>
                                        <option value={2}>活动公告</option>
                                        <option value={3}>更新公告</option>
                                        <option value={4}>通知公告</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>目标用户</label>
                                    <select
                                        value={form.target}
                                        onChange={e => setForm({ ...form, target: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                    >
                                        <option value={0}>所有人</option>
                                        <option value={1}>买手</option>
                                        <option value={2}>商家</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>排序</label>
                                    <input
                                        type="number"
                                        value={form.sort}
                                        onChange={e => setForm({ ...form, sort: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.isTop}
                                            onChange={e => setForm({ ...form, isTop: e.target.checked })}
                                            style={{ marginRight: '8px' }}
                                        />
                                        置顶
                                    </label>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={form.isPopup}
                                            onChange={e => setForm({ ...form, isPopup: e.target.checked })}
                                            style={{ marginRight: '8px' }}
                                        />
                                        弹窗显示
                                    </label>
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>封面图URL（可选）</label>
                                <input
                                    value={form.coverImage}
                                    onChange={e => setForm({ ...form, coverImage: e.target.value })}
                                    placeholder="请输入封面图URL"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>取消</button>
                                <button onClick={handleSubmit} style={{ padding: '10px 24px', border: 'none', borderRadius: '4px', background: '#1890ff', color: '#fff', cursor: 'pointer' }}>
                                    {editingNotice ? '保存' : '创建'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
