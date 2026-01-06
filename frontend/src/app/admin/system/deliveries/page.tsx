'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

interface Delivery {
    id: string;
    code: string;
    name: string;
    trackingUrl: string;
    isActive: boolean;
    sortOrder: number;
}

export default function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Delivery>>({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/deliveries?includeInactive=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setDeliveries(data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (delivery: Delivery) => {
        setEditingId(delivery.id);
        setEditForm(delivery);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            code: '',
            name: '',
            trackingUrl: '',
            isActive: true,
            sortOrder: deliveries.length,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId ? `${BASE_URL}/admin/deliveries/${editingId}` : `${BASE_URL}/admin/deliveries`;
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });

            setShowModal(false);
            loadDeliveries();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/deliveries/${id}/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadDeliveries();
        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该快递公司？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/deliveries/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadDeliveries();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">快递管理</h2>
                    <p className="mt-1 text-sm text-slate-500">管理快递公司信息，配置物流查询链接</p>
                </div>
                <Button onClick={handleCreate}>+ 添加快递公司</Button>
            </div>

            {/* Delivery List */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-4 text-left text-sm font-medium">排序</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">快递代码</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">快递名称</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">物流查询链接</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(delivery => (
                                    <tr key={delivery.id} className={cn('border-b border-slate-100', !delivery.isActive && 'opacity-50')}>
                                        <td className="px-4 py-4">{delivery.sortOrder || 0}</td>
                                        <td className="px-4 py-4 font-mono font-medium">{delivery.code}</td>
                                        <td className="px-4 py-4">
                                            <span className="mr-2">📦</span>
                                            {delivery.name}
                                        </td>
                                        <td className="max-w-[300px] truncate px-4 py-4 text-xs text-slate-500">
                                            {delivery.trackingUrl || '-'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={delivery.isActive ? 'green' : 'red'}>
                                                {delivery.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(delivery)}>编辑</Button>
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        delivery.isActive
                                                            ? 'border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                            : 'border border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    )}
                                                    onClick={() => handleToggle(delivery.id)}
                                                >
                                                    {delivery.isActive ? '禁用' : '启用'}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(delivery.id)}>删除</Button>
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
            <Modal title={editingId ? '编辑快递公司' : '添加快递公司'} open={showModal} onClose={() => setShowModal(false)} className="max-w-md">
                <div className="space-y-5">
                    <Input
                        label="快递代码"
                        placeholder="如: SF, YTO, ZTO"
                        value={editForm.code || ''}
                        onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                    />
                    <Input
                        label="快递名称"
                        placeholder="如: 顺丰速运, 圆通速递"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div>
                        <Input
                            label="物流查询链接"
                            placeholder="使用 {number} 代表运单号"
                            value={editForm.trackingUrl || ''}
                            onChange={e => setEditForm({ ...editForm, trackingUrl: e.target.value })}
                        />
                        <p className="mt-1.5 text-xs text-slate-400">
                            示例: https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/{'{number}'}
                        </p>
                    </div>
                    <Input
                        label="排序"
                        type="number"
                        value={String(editForm.sortOrder || 0)}
                        onChange={e => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                    />
                    <div>
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
