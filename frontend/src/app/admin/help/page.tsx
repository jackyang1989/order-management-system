'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';

interface HelpArticle {
    id: string;
    title: string;
    content: string;
    type: string;
    sortOrder: number;
    isPublished: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

const typeLabels: Record<string, { text: string; color: 'blue' | 'green' | 'amber' }> = {
    announcement: { text: '公告', color: 'blue' },
    faq: { text: '常见问题', color: 'green' },
    guide: { text: '使用指南', color: 'amber' },
};

export default function AdminHelpCenterPage() {
    const [articles, setArticles] = useState<HelpArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Form modal
    const [formModal, setFormModal] = useState<'add' | 'edit' | null>(null);
    const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'faq',
        sortOrder: 0,
        isPublished: true,
    });
    const [submitting, setSubmitting] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadArticles();
    }, [typeFilter, page]);

    const loadArticles = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/help?page=${page}&limit=20`;
            if (typeFilter) url += `&type=${typeFilter}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setArticles(json.data?.list || json.data?.items || []);
                setTotal(json.data?.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({
            title: '',
            content: '',
            type: 'faq',
            sortOrder: 0,
            isPublished: true,
        });
        setEditingArticle(null);
        setFormModal('add');
    };

    const openEditModal = (article: HelpArticle) => {
        setFormData({
            title: article.title,
            content: article.content,
            type: article.type,
            sortOrder: article.sortOrder,
            isPublished: article.isPublished,
        });
        setEditingArticle(article);
        setFormModal('edit');
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) {
            toastError('请填写标题和内容');
            return;
        }
        const token = localStorage.getItem('adminToken');
        setSubmitting(true);
        try {
            const url = formModal === 'add'
                ? `${BASE_URL}/admin/help`
                : `${BASE_URL}/admin/help/${editingArticle?.id}`;
            const method = formModal === 'add' ? 'POST' : 'PUT';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(formModal === 'add' ? '创建成功' : '更新成功');
                setFormModal(null);
                loadArticles();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTogglePublish = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/help/${id}/toggle-publish`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(json.message || '状态已更新');
                loadArticles();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        const token = localStorage.getItem('adminToken');
        setDeleting(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/help/${deleteModal}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('删除成功');
                setDeleteModal(null);
                loadArticles();
            } else {
                toastError(json.message || '删除失败');
            }
        } catch (e) {
            toastError('删除失败');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">帮助中心管理</span>
                    <div className="flex items-center gap-3">
                        <Button onClick={openAddModal}>+ 添加文章</Button>
                    </div>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select
                        value={typeFilter}
                        onChange={(v) => { setTypeFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部类型' },
                            { value: 'announcement', label: '公告' },
                            { value: 'faq', label: '常见问题' },
                            { value: 'guide', label: '使用指南' },
                        ]}
                        className="w-32"
                    />
                    <Button variant="secondary" onClick={loadArticles}>刷新</Button>
                    <span className="ml-auto text-sm text-[#6b7280]">共 {total} 条记录</span>
                </div>

                <div className="overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                    ) : articles.length === 0 ? (
                        <div className="py-12 text-center text-[#9ca3af]">暂无文章</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[800px] w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-50">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">标题</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">类型</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">排序</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">浏览量</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">更新时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {articles.map(a => (
                                        <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-[#3b4559]">{a.title}</div>
                                                <div className="text-xs text-[#9ca3af] line-clamp-1 max-w-[300px]">
                                                    {a.content.replace(/[#*`]/g, '').substring(0, 50)}...
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <Badge variant="soft" color={typeLabels[a.type]?.color || 'slate'}>
                                                    {typeLabels[a.type]?.text || a.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">{a.sortOrder}</td>
                                            <td className="px-4 py-3.5 text-center text-[#6b7280]">{a.viewCount}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={a.isPublished ? 'green' : 'slate'}>
                                                    {a.isPublished ? '已发布' : '草稿'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                                                {a.updatedAt ? new Date(a.updatedAt).toLocaleString('zh-CN') : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => openEditModal(a)}>编辑</Button>
                                                    <Button
                                                        size="sm"
                                                        variant={a.isPublished ? 'outline' : 'primary'}
                                                        onClick={() => handleTogglePublish(a.id)}
                                                    >
                                                        {a.isPublished ? '取消发布' : '发布'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-500 hover:bg-red-50"
                                                        onClick={() => setDeleteModal(a.id)}
                                                    >
                                                        删除
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={formModal === 'add' ? '添加文章' : '编辑文章'}
                open={formModal !== null}
                onClose={() => setFormModal(null)}
                className="max-w-2xl"
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">标题 *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="请输入标题"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">类型</label>
                            <Select
                                value={formData.type}
                                onChange={(v) => setFormData({ ...formData, type: v })}
                                options={[
                                    { value: 'announcement', label: '公告' },
                                    { value: 'faq', label: '常见问题' },
                                    { value: 'guide', label: '使用指南' },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">排序</label>
                            <Input
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                placeholder="数字越小越靠前"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">状态</label>
                            <Select
                                value={formData.isPublished ? 'true' : 'false'}
                                onChange={(v) => setFormData({ ...formData, isPublished: v === 'true' })}
                                options={[
                                    { value: 'true', label: '发布' },
                                    { value: 'false', label: '草稿' },
                                ]}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">内容 *（支持Markdown）</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="请输入内容，支持Markdown格式"
                            rows={12}
                            className="w-full resize-y rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setFormModal(null)}>取消</Button>
                        <Button loading={submitting} onClick={handleSubmit}>
                            {formModal === 'add' ? '创建' : '保存'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal title="确认删除" open={deleteModal !== null} onClose={() => setDeleteModal(null)} className="max-w-sm">
                <div className="space-y-4">
                    <p className="text-[#4b5563]">确定要删除这篇文章吗？此操作不可恢复。</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>取消</Button>
                        <Button variant="destructive" loading={deleting} onClick={handleDelete}>确认删除</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
