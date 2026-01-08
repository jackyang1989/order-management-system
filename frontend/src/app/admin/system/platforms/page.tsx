'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

interface Platform {
    id: string;
    code: string;
    name: string;
    icon: string;
    baseFeeRate: number;
    supportsTkl: boolean;
    isActive: boolean;
    sortOrder: number;
}

export default function PlatformsPage() {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Platform>>({});
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPlatforms();
    }, []);

    const loadPlatforms = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('未登录，请先登录管理后台');
                setLoading(false);
                return;
            }
            const response = await fetch(`${BASE_URL}/admin/platforms?activeOnly=false`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPlatforms(data.data || []);
            } else if (response.status === 401) {
                setError('登录已过期，请重新登录');
            } else {
                setError('加载平台列表失败');
            }
        } catch (error) {
            console.error('加载失败:', error);
            setError('网络错误，请检查后端服务是否运行');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (platform: Platform) => {
        setEditingId(platform.id);
        setEditForm(platform);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            code: '',
            name: '',
            icon: '🛒',
            baseFeeRate: 0,
            supportsTkl: false,
            isActive: true,
            sortOrder: platforms.length,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId ? `${BASE_URL}/admin/platforms/${editingId}` : `${BASE_URL}/admin/platforms`;
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });

            setShowModal(false);
            loadPlatforms();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleToggle = async (id: string, currentState: boolean) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/platforms/${id}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isActive: !currentState }),
            });
            loadPlatforms();
        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该平台？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/platforms/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadPlatforms();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const platformIcons = ['🛒', '🏪', '🛍️', '📦', '🎁', '💎', '⭐', '🔥', '🎯', '💰'];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">平台管理</h2>
                    <p className="mt-1 text-sm text-slate-500">管理电商平台分类，如淘宝、天猫、京东、拼多多等</p>
                </div>
                <Button onClick={handleCreate}>+ 添加平台</Button>
            </div>

            {/* Platform List */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : error ? (
                    <div className="py-16 text-center">
                        <div className="text-red-500 mb-4">{error}</div>
                        <Button onClick={loadPlatforms} variant="secondary">重试</Button>
                    </div>
                ) : platforms.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">暂无平台数据</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-4 text-left text-sm font-medium">排序</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">图标</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">平台代码</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">平台名称</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">基础费率</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">淘口令</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {platforms.sort((a, b) => a.sortOrder - b.sortOrder).map(platform => (
                                    <tr key={platform.id} className={cn('border-b border-slate-100', !platform.isActive && 'opacity-50')}>
                                        <td className="px-4 py-4">{platform.sortOrder}</td>
                                        <td className="px-4 py-4 text-2xl">{platform.icon || '🛒'}</td>
                                        <td className="px-4 py-4 font-mono">{platform.code}</td>
                                        <td className="px-4 py-4 font-medium">{platform.name}</td>
                                        <td className="px-4 py-4">{platform.baseFeeRate}%</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={platform.supportsTkl ? 'blue' : 'slate'}>
                                                {platform.supportsTkl ? '支持' : '不支持'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={platform.isActive ? 'green' : 'red'}>
                                                {platform.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(platform)}>编辑</Button>
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        platform.isActive
                                                            ? 'border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                            : 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    )}
                                                    onClick={() => handleToggle(platform.id, platform.isActive)}
                                                >
                                                    {platform.isActive ? '禁用' : '启用'}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(platform.id)}>删除</Button>
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
            <Modal title={editingId ? '编辑平台' : '添加平台'} open={showModal} onClose={() => setShowModal(false)} className="max-w-md">
                <div className="space-y-5">
                    <Input
                        label="平台代码"
                        placeholder="如: taobao, tmall, jd"
                        value={editForm.code || ''}
                        onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                    />
                    <Input
                        label="平台名称"
                        placeholder="如: 淘宝, 天猫, 京东"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">图标</label>
                        <div className="flex flex-wrap gap-2">
                            {platformIcons.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, icon })}
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-lg border text-xl transition-colors',
                                        editForm.icon === icon
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    )}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Input
                        label="基础费率 (%)"
                        type="number"
                        value={String(editForm.baseFeeRate || 0)}
                        onChange={e => setEditForm({ ...editForm, baseFeeRate: parseFloat(e.target.value) })}
                    />
                    <Input
                        label="排序"
                        type="number"
                        value={String(editForm.sortOrder || 0)}
                        onChange={e => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                    />
                    <div className="flex gap-6">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.supportsTkl || false}
                                onChange={e => setEditForm({ ...editForm, supportsTkl: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm">支持淘口令</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.isActive !== false}
                                onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm">启用</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
