'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { toastSuccess, toastError } from '../../../../lib/toast';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

interface Banner {
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    position: string;
    sort: number;
    status: number;
    createdAt: string;
}

const positionLabels: Record<string, string> = {
    home: '首页',
    buyer: '买手端',
    merchant: '商家端',
};

const statusLabels: Record<number, { text: string; color: 'green' | 'slate' }> = {
    0: { text: '禁用', color: 'slate' },
    1: { text: '启用', color: 'green' },
};

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [positionFilter, setPositionFilter] = useState<string>('');

    // Form modal
    const [formModal, setFormModal] = useState<'add' | 'edit' | null>(null);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        linkUrl: '',
        position: 'home',
        sort: 0,
        status: 1,
    });
    const [submitting, setSubmitting] = useState(false);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadBanners();
    }, [positionFilter]);

    const loadBanners = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/banners/admin/list`;
            if (positionFilter) url += `?position=${positionFilter}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setBanners(json.data || []);
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
            imageUrl: '',
            linkUrl: '',
            position: 'home',
            sort: 0,
            status: 1,
        });
        setEditingBanner(null);
        setFormModal('add');
    };

    const openEditModal = (banner: Banner) => {
        setFormData({
            title: banner.title,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl || '',
            position: banner.position,
            sort: banner.sort,
            status: banner.status,
        });
        setEditingBanner(banner);
        setFormModal('edit');
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.imageUrl) {
            toastError('请填写标题和图片URL');
            return;
        }
        const token = localStorage.getItem('adminToken');
        setSubmitting(true);
        try {
            const url = formModal === 'add'
                ? `${BASE_URL}/banners/admin`
                : `${BASE_URL}/banners/admin/${editingBanner?.id}`;
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
                loadBanners();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/banners/admin/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('状态已更新');
                loadBanners();
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
            const res = await fetch(`${BASE_URL}/banners/admin/${deleteModal}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('删除成功');
                setDeleteModal(null);
                loadBanners();
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
        <div className="space-y-4">
            {/* Filter Bar */}
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">轮播图管理</span>
                    <Button onClick={openAddModal}>+ 添加轮播图</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={positionFilter}
                        onChange={setPositionFilter}
                        options={[
                            { value: '', label: '全部位置' },
                            { value: 'home', label: '首页' },
                            { value: 'buyer', label: '买手端' },
                            { value: 'merchant', label: '商家端' },
                        ]}
                        className="w-32"
                    />
                    <Button variant="secondary" onClick={loadBanners}>刷新</Button>
                </div>
            </Card>

            {/* Banner List */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                ) : banners.length === 0 ? (
                    <div className="py-12 text-center text-[#9ca3af]">暂无轮播图</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-4 py-3.5 text-left text-sm font-medium">预览</th>
                                    <th className="px-4 py-3.5 text-left text-sm font-medium">标题</th>
                                    <th className="px-4 py-3.5 text-left text-sm font-medium">位置</th>
                                    <th className="px-4 py-3.5 text-center text-sm font-medium">排序</th>
                                    <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                    <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                    <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {banners.map(b => (
                                    <tr key={b.id} className="border-b border-[#f3f4f6]">
                                        <td className="px-4 py-3.5">
                                            <img
                                                src={b.imageUrl}
                                                alt={b.title}
                                                className="h-12 w-24 rounded object-cover"
                                            />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium text-[#3b4559]">{b.title}</div>
                                            {b.linkUrl && (
                                                <div className="text-xs text-[#9ca3af] truncate max-w-[200px]">{b.linkUrl}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-[#6b7280]">{positionLabels[b.position] || b.position}</td>
                                        <td className="px-4 py-3.5 text-center">{b.sort}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <Badge variant="soft" color={statusLabels[b.status]?.color || 'slate'}>
                                                {statusLabels[b.status]?.text || '未知'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                                            {b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN') : '-'}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => openEditModal(b)}>编辑</Button>
                                                <Button
                                                    size="sm"
                                                    variant={b.status === 1 ? 'outline' : 'primary'}
                                                    onClick={() => handleToggleStatus(b.id)}
                                                >
                                                    {b.status === 1 ? '禁用' : '启用'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-500 hover:bg-red-50"
                                                    onClick={() => setDeleteModal(b.id)}
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
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={formModal === 'add' ? '添加轮播图' : '编辑轮播图'}
                open={formModal !== null}
                onClose={() => setFormModal(null)}
                className="max-w-lg"
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
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">图片URL *</label>
                        <Input
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="请输入图片URL"
                        />
                        {formData.imageUrl && (
                            <img src={formData.imageUrl} alt="预览" className="mt-2 h-20 rounded object-cover" />
                        )}
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">跳转链接</label>
                        <Input
                            value={formData.linkUrl}
                            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                            placeholder="点击后跳转的URL（可选）"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">显示位置</label>
                            <Select
                                value={formData.position}
                                onChange={(v) => setFormData({ ...formData, position: v })}
                                options={[
                                    { value: 'home', label: '首页' },
                                    { value: 'buyer', label: '买手端' },
                                    { value: 'merchant', label: '商家端' },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">排序</label>
                            <Input
                                type="number"
                                value={formData.sort}
                                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                                placeholder="数字越小越靠前"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">状态</label>
                        <Select
                            value={String(formData.status)}
                            onChange={(v) => setFormData({ ...formData, status: parseInt(v) })}
                            options={[
                                { value: '1', label: '启用' },
                                { value: '0', label: '禁用' },
                            ]}
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
                    <p className="text-[#4b5563]">确定要删除这个轮播图吗？此操作不可恢复。</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>取消</Button>
                        <Button variant="destructive" loading={deleting} onClick={handleDelete}>确认删除</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
