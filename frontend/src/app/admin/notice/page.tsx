'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';

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

const targetLabels: Record<number, { text: string; color: 'blue' | 'green' | 'amber' }> = {
    0: { text: '所有人', color: 'blue' },
    1: { text: '买手', color: 'green' },
    2: { text: '商家', color: 'amber' },
};

const statusLabels: Record<number, { text: string; color: 'slate' | 'green' | 'red' }> = {
    0: { text: '草稿', color: 'slate' },
    1: { text: '已发布', color: 'green' },
    2: { text: '已归档', color: 'red' },
};

export default function AdminNoticePage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('all');
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
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;

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
        setForm({ title: '', content: '', type: 1, target: 0, sort: 0, isTop: false, isPopup: false, coverImage: '' });
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
            const url = editingNotice ? `${BASE_URL}/notices/admin/${editingNotice.id}` : `${BASE_URL}/notices/admin`;
            const res = await fetch(url, {
                method: editingNotice ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
            if (json.success) loadNotices();
            else alert(json.message || '操作失败');
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
            if (json.success) loadNotices();
            else alert(json.message || '操作失败');
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
            if (json.success) loadNotices();
            else alert(json.message || '操作失败');
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
            if (json.success) loadNotices();
            else alert(json.message || '操作失败');
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
            if (json.success) loadNotices();
            else alert(json.message || '操作失败');
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">公告管理</span>
                    <div className="flex items-center gap-3">
                        <span className="text-[#6b7280]">共 {total} 条记录</span>
                        <Button onClick={handleCreate}>+ 发布公告</Button>
                    </div>
                </div>
                <div className="mb-6 flex items-center gap-3">
                    <Select
                        value={statusFilter}
                        onChange={(v) => { setStatusFilter(v); setPage(1); }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: '0', label: '草稿' },
                            { value: '1', label: '已发布' },
                            { value: '2', label: '已归档' },
                        ]}
                        className="w-32"
                    />
                </div>

                <div className="overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                    ) : notices.length === 0 ? (
                        <div className="py-12 text-center text-[#9ca3af]">暂无公告</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-[900px] w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#f9fafb]">
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-left text-sm font-medium text-[#374151]">标题</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-center text-sm font-medium text-[#374151]">类型</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-center text-sm font-medium text-[#374151]">目标</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-center text-sm font-medium text-[#374151]">状态</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-center text-sm font-medium text-[#374151]">置顶</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-right text-sm font-medium text-[#374151]">浏览</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-left text-sm font-medium text-[#374151]">发布时间</th>
                                            <th className="border-b border-[#f3f4f6] px-4 py-3.5 text-center text-sm font-medium text-[#374151]">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {notices.map(notice => (
                                            <tr key={notice.id} className="border-b border-[#f3f4f6]">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {notice.isPopup && <Badge variant="solid" color="red">弹窗</Badge>}
                                                        <span className="max-w-[200px] truncate font-medium">{notice.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-center text-[#6b7280]">{typeLabels[notice.type] || '未知'}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Badge variant="soft" color={targetLabels[notice.target]?.color || 'slate'}>
                                                        {targetLabels[notice.target]?.text || '未知'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Badge variant="soft" color={statusLabels[notice.status]?.color || 'slate'}>
                                                        {statusLabels[notice.status]?.text || '未知'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {notice.isTop ? <span className="text-warning-400">★</span> : <span className="text-[#d1d5db]">☆</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-[#6b7280]">{notice.viewCount}</td>
                                                <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                                                    {notice.publishedAt ? new Date(notice.publishedAt).toLocaleString('zh-CN') : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex flex-wrap justify-center gap-1.5">
                                                        <Button size="sm" variant="secondary" onClick={() => setDetailModal(notice)}>查看</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => handleEdit(notice)}>编辑</Button>
                                                        {notice.status === 0 && (
                                                            <Button size="sm" className="bg-success-400 hover:bg-success-500" onClick={() => handlePublish(notice.id)}>发布</Button>
                                                        )}
                                                        {notice.status === 1 && (
                                                            <>
                                                                <Button size="sm" className="border border-warning-400 bg-white text-warning-500 hover:bg-warning-50" onClick={() => handleUnpublish(notice.id)}>撤回</Button>
                                                                <Button size="sm" className="border border-purple-500 bg-white text-purple-600 hover:bg-purple-50" onClick={() => handleToggleTop(notice.id)}>{notice.isTop ? '取消置顶' : '置顶'}</Button>
                                                            </>
                                                        )}
                                                        {notice.status !== 2 && (
                                                            <Button size="sm" variant="secondary" onClick={() => handleArchive(notice.id)}>归档</Button>
                                                        )}
                                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(notice.id)}>删除</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-[#f3f4f6] pt-4 mt-4">
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</Button>
                                <span className="px-3 py-1.5 text-sm text-[#6b7280]">第 {page} 页</span>
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={notices.length < 20}>下一页</Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Detail Modal */}
            <Modal title="公告详情" open={!!detailModal} onClose={() => setDetailModal(null)} className="max-w-xl">
                {detailModal && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="mb-3 text-lg font-semibold">{detailModal.title}</h2>
                            <div className="mb-4 flex flex-wrap gap-2">
                                <Badge variant="soft" color="slate">{typeLabels[detailModal.type]}</Badge>
                                <Badge variant="soft" color={targetLabels[detailModal.target]?.color || 'slate'}>{targetLabels[detailModal.target]?.text}</Badge>
                                <Badge variant="soft" color={statusLabels[detailModal.status]?.color || 'slate'}>{statusLabels[detailModal.status]?.text}</Badge>
                                {detailModal.isTop && <Badge variant="soft" color="amber">置顶</Badge>}
                                {detailModal.isPopup && <Badge variant="solid" color="red">弹窗</Badge>}
                            </div>
                        </div>
                        <div className="whitespace-pre-wrap rounded-md bg-[#f9fafb] p-4 text-sm leading-relaxed">{detailModal.content}</div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-[#6b7280]">
                            <div><span className="text-[#9ca3af]">发布者：</span>{detailModal.adminName || '-'}</div>
                            <div><span className="text-[#9ca3af]">浏览次数：</span>{detailModal.viewCount}</div>
                            <div><span className="text-[#9ca3af]">创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                            <div><span className="text-[#9ca3af]">发布时间：</span>{detailModal.publishedAt ? new Date(detailModal.publishedAt).toLocaleString('zh-CN') : '-'}</div>
                        </div>
                        <div className="flex justify-end border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>关闭</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Create/Edit Modal */}
            <Modal title={editingNotice ? '编辑公告' : '发布公告'} open={showModal} onClose={() => setShowModal(false)} className="max-w-xl">
                <div className="space-y-4">
                    <Input
                        label="标题"
                        placeholder="请输入公告标题"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">内容</label>
                        <textarea
                            className="w-full resize-y rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={6}
                            placeholder="请输入公告内容"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">类型</label>
                            <Select
                                value={String(form.type)}
                                onChange={(v) => setForm({ ...form, type: parseInt(v) })}
                                options={[
                                    { value: '1', label: '系统公告' },
                                    { value: '2', label: '活动公告' },
                                    { value: '3', label: '更新公告' },
                                    { value: '4', label: '通知公告' },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">目标用户</label>
                            <Select
                                value={String(form.target)}
                                onChange={(v) => setForm({ ...form, target: parseInt(v) })}
                                options={[
                                    { value: '0', label: '所有人' },
                                    { value: '1', label: '买手' },
                                    { value: '2', label: '商家' },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input
                            label="排序"
                            type="number"
                            value={String(form.sort)}
                            onChange={(e) => setForm({ ...form, sort: parseInt(e.target.value) || 0 })}
                        />
                        <div className="flex items-end pb-2">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.isTop}
                                    onChange={(e) => setForm({ ...form, isTop: e.target.checked })}
                                    className="h-4 w-4 rounded border-[#d1d5db]"
                                />
                                <span className="text-sm">置顶</span>
                            </label>
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.isPopup}
                                    onChange={(e) => setForm({ ...form, isPopup: e.target.checked })}
                                    className="h-4 w-4 rounded border-[#d1d5db]"
                                />
                                <span className="text-sm">弹窗显示</span>
                            </label>
                        </div>
                    </div>
                    <Input
                        label="封面图URL（可选）"
                        placeholder="请输入封面图URL"
                        value={form.coverImage}
                        onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSubmit}>{editingNotice ? '保存' : '创建'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
