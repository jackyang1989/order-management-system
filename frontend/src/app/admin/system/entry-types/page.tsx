'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

interface EntryType {
    id: string;
    code: string;
    name: string;
    icon: string;
    color: string;
    value: number;
    isActive: boolean;
    sortOrder: number;
    description?: string;
}

export default function EntryTypesPage() {
    const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<EntryType>>({});
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEntryTypes();
    }, []);

    const loadEntryTypes = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('未登录，请先登录管理后台');
                setLoading(false);
                return;
            }
            const response = await fetch(`${BASE_URL}/admin/entry-types?activeOnly=false`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setEntryTypes(data.data || []);
            } else if (response.status === 401) {
                setError('登录已过期，请重新登录');
            } else {
                setError('加载入口类型列表失败');
            }
        } catch (error) {
            console.error('加载失败:', error);
            setError('网络错误，请检查后端服务是否运行');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entryType: EntryType) => {
        setEditingId(entryType.id);
        setEditForm(entryType);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            code: '',
            name: '',
            icon: '🔍',
            color: '#1890ff',
            value: entryTypes.length + 1,
            isActive: true,
            sortOrder: entryTypes.length,
            description: '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId ? `${BASE_URL}/admin/entry-types/${editingId}` : `${BASE_URL}/admin/entry-types`;
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });

            setShowModal(false);
            loadEntryTypes();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleToggle = async (id: string, currentState: boolean) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/entry-types/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: !currentState }),
            });
            loadEntryTypes();
        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该入口类型？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/entry-types/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadEntryTypes();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const entryTypeIcons = ['🔍', '📋', '📱', '🚗', '🔗', '⭐', '🎯', '💎', '🔥', '💰'];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">任务类型管理</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">管理任务入口类型，如关键词、淘口令、二维码、直通车、通道等</p>
                </div>
                <Button onClick={handleCreate}>+ 添加类型</Button>
            </div>

            {/* Entry Type List */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
                ) : error ? (
                    <div className="py-16 text-center">
                        <div className="text-danger-400 mb-4">{error}</div>
                        <Button onClick={loadEntryTypes} variant="secondary">重试</Button>
                    </div>
                ) : entryTypes.length === 0 ? (
                    <div className="py-16 text-center text-[#9ca3af]">暂无入口类型数据</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-4 py-4 text-left text-sm font-medium">排序</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">图标</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">类型代码</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">类型名称</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">枚举值</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">说明</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entryTypes.sort((a, b) => a.sortOrder - b.sortOrder).map(entryType => (
                                    <tr key={entryType.id} className={cn('border-b border-[#f3f4f6]', !entryType.isActive && 'opacity-50')}>
                                        <td className="px-4 py-4">{entryType.sortOrder}</td>
                                        <td className="px-4 py-4 text-2xl">{entryType.icon || '🔍'}</td>
                                        <td className="px-4 py-4 font-mono">{entryType.code}</td>
                                        <td className="px-4 py-4 font-medium">{entryType.name}</td>
                                        <td className="px-4 py-4">{entryType.value}</td>
                                        <td className="px-4 py-4 text-sm text-[#6b7280]">{entryType.description || '-'}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={entryType.isActive ? 'green' : 'red'}>
                                                {entryType.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(entryType)}>编辑</Button>
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        entryType.isActive
                                                            ? 'border border-amber-400 bg-amber-50 text-warning-500 hover:bg-amber-100'
                                                            : 'border border-blue-400 bg-blue-50 text-primary-600 hover:bg-blue-100'
                                                    )}
                                                    onClick={() => handleToggle(entryType.id, entryType.isActive)}
                                                >
                                                    {entryType.isActive ? '禁用' : '启用'}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(entryType.id)}>删除</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Edit Modal */}
            <Modal title={editingId ? '编辑入口类型' : '添加入口类型'} open={showModal} onClose={() => setShowModal(false)} className="max-w-md">
                <div className="space-y-5">
                    <Input
                        label="类型代码"
                        placeholder="如: keyword, taoword, qrcode"
                        value={editForm.code || ''}
                        onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                    />
                    <Input
                        label="类型名称"
                        placeholder="如: 关键词, 淘口令, 二维码"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#374151]">图标</label>
                        <div className="flex flex-wrap gap-2">
                            {entryTypeIcons.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, icon })}
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-md border text-xl transition-colors',
                                        editForm.icon === icon
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                                            : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                                    )}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Input
                        label="枚举值 (对应TaskEntryType)"
                        type="number"
                        value={String(editForm.value || 1)}
                        onChange={e => setEditForm({ ...editForm, value: parseInt(e.target.value) })}
                    />
                    <Input
                        label="排序"
                        type="number"
                        value={String(editForm.sortOrder || 0)}
                        onChange={e => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                    />
                    <Input
                        label="说明"
                        placeholder="简要描述该入口类型"
                        value={editForm.description || ''}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <div className="flex gap-6">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.isActive !== false}
                                onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-[#d1d5db]"
                            />
                            <span className="text-sm">启用</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
