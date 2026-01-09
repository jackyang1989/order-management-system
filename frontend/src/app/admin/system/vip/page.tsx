'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

interface VipLevel {
    id: string;
    name: string;
    level: number;
    type: 'buyer' | 'merchant';
    price: number;
    duration: number;
    color: string;
    dailyTaskLimit: number;
    commissionBonus: number;
    withdrawFeeDiscount: number;
    publishTaskLimit: number;
    serviceFeeDiscount: number;
    canReserveTask: boolean;
    priorityReview: boolean;
    dedicatedSupport: boolean;
    showVipBadge: boolean;
    privileges: string[];
    isActive: boolean;
}

export default function VipConfigPage() {
    const [vipLevels, setVipLevels] = useState<VipLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'buyer' | 'merchant'>('buyer');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<VipLevel>>({});
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadVipLevels();
    }, []);

    const loadVipLevels = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/vip-levels?includeInactive=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setVipLevels(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vip: VipLevel) => {
        setEditingId(vip.id);
        setEditForm(vip);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            type: activeTab,
            level: Math.max(...filteredLevels.map(v => v.level), 0) + 1,
            price: 0,
            duration: 30,
            dailyTaskLimit: 0,
            commissionBonus: 0,
            withdrawFeeDiscount: 0,
            publishTaskLimit: 0,
            serviceFeeDiscount: 0,
            canReserveTask: false,
            priorityReview: false,
            dedicatedSupport: false,
            showVipBadge: false,
            isActive: true,
            privileges: [],
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId ? `${BASE_URL}/admin/vip-levels/${editingId}` : `${BASE_URL}/admin/vip-levels`;
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(editForm),
            });

            setShowModal(false);
            loadVipLevels();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/vip-levels/${id}/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadVipLevels();
        } catch (error) {
            console.error('操作失败:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该VIP等级？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/vip-levels/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadVipLevels();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const filteredLevels = vipLevels.filter(v => v.type === activeTab).sort((a, b) => a.level - b.level);

    // Color map for VIP card backgrounds (mapping hex to Tailwind classes)
    const getCardBgClass = (color: string) => {
        const colorMap: Record<string, string> = {
            '#1890ff': 'bg-primary-500',
            '#52c41a': 'bg-green-500',
            '#faad14': 'bg-warning-400',
            '#eb2f96': 'bg-pink-500',
            '#722ed1': 'bg-purple-500',
            '#13c2c2': 'bg-cyan-500',
            '#f5222d': 'bg-danger-400',
        };
        return colorMap[color] || 'bg-primary-500';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">VIP等级配置</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">配置买手和商家的VIP等级及权益</p>
                </div>
                <Button onClick={handleCreate}>+ 添加VIP等级</Button>
            </div>

            {/* Tab Switch */}
            <div className="inline-flex rounded-md bg-white p-1">
                <button
                    onClick={() => setActiveTab('buyer')}
                    className={cn(
                        'rounded-md px-8 py-2.5 text-sm transition-colors',
                        activeTab === 'buyer'
                            ? 'bg-primary-600 font-medium text-white'
                            : 'text-[#6b7280] hover:text-[#374151]'
                    )}
                >
                    👤 买手VIP
                </button>
                <button
                    onClick={() => setActiveTab('merchant')}
                    className={cn(
                        'rounded-md px-8 py-2.5 text-sm transition-colors',
                        activeTab === 'merchant'
                            ? 'bg-primary-600 font-medium text-white'
                            : 'text-[#6b7280] hover:text-[#374151]'
                    )}
                >
                    🏪 商家VIP
                </button>
            </div>

            {/* VIP Level Cards */}
            {loading ? (
                <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
                    {filteredLevels.map(vip => (
                        <Card key={vip.id} className={cn('overflow-hidden p-0', !vip.isActive && 'opacity-60')}>
                            {/* Card Header */}
                            <div className={cn('relative p-5 text-white', getCardBgClass(vip.color))}>
                                <div className={cn(
                                    'absolute right-2.5 top-2.5 rounded-full px-3 py-1 text-xs',
                                    vip.isActive ? 'bg-white/20' : 'bg-black/30'
                                )}>
                                    {vip.isActive ? '已启用' : '已禁用'}
                                </div>
                                <div className="mb-2 text-2xl font-bold">{vip.name}</div>
                                <div className="text-sm opacity-90">
                                    等级 {vip.level} · {vip.duration > 0 ? `${vip.duration}天` : '永久'}
                                </div>
                                <div className="mt-3 text-3xl font-bold">
                                    ¥{vip.price}
                                    {vip.duration > 0 && <span className="text-sm font-normal">/月</span>}
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <div className="mb-3 font-medium text-[#374151]">权益配置</div>
                                    <div className="space-y-2 text-sm text-[#6b7280]">
                                        {activeTab === 'buyer' ? (
                                            <>
                                                <div>📋 每日任务: {vip.dailyTaskLimit === 0 ? '无限制' : `${vip.dailyTaskLimit}个`}</div>
                                                <div>💰 佣金加成: +{vip.commissionBonus}%</div>
                                                <div>🏦 提现折扣: -{vip.withdrawFeeDiscount}%</div>
                                                <div>⭐ 预约任务: {vip.canReserveTask ? '支持' : '不支持'}</div>
                                                <div>🏅 VIP徽章: {vip.showVipBadge ? '显示' : '隐藏'}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div>📋 发布任务: {vip.publishTaskLimit === 0 ? '无限制' : `${vip.publishTaskLimit}个/天`}</div>
                                                <div>💰 服务费折扣: -{vip.serviceFeeDiscount}%</div>
                                                <div>⚡ 优先审核: {vip.priorityReview ? '支持' : '不支持'}</div>
                                                <div>👨‍💼 专属客服: {vip.dedicatedSupport ? '支持' : '不支持'}</div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 border-t border-[#f3f4f6] pt-4">
                                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleEdit(vip)}>编辑</Button>
                                    <Button
                                        size="sm"
                                        className={cn(
                                            'flex-1',
                                            vip.isActive
                                                ? 'border border-amber-400 bg-amber-50 text-warning-500 hover:bg-amber-100'
                                                : 'border border-blue-400 bg-blue-50 text-primary-600 hover:bg-blue-100'
                                        )}
                                        onClick={() => handleToggle(vip.id)}
                                    >
                                        {vip.isActive ? '禁用' : '启用'}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(vip.id)}>删除</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Modal title={editingId ? '编辑VIP等级' : '添加VIP等级'} open={showModal} onClose={() => setShowModal(false)} className="max-w-xl">
                <div className="max-h-[60vh] space-y-5 overflow-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="名称"
                            value={editForm.name || ''}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <Input
                            label="等级"
                            type="number"
                            value={String(editForm.level || 0)}
                            onChange={e => setEditForm({ ...editForm, level: parseInt(e.target.value) })}
                        />
                        <Input
                            label="价格 (元)"
                            type="number"
                            value={String(editForm.price || 0)}
                            onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="有效期 (天)"
                            type="number"
                            value={String(editForm.duration || 0)}
                            onChange={e => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                        />
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[#374151]">颜色</label>
                            <input
                                type="color"
                                value={editForm.color || '#1890ff'}
                                onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                className="h-10 w-full cursor-pointer rounded-md border border-[#d1d5db]"
                            />
                        </div>
                        {activeTab === 'buyer' ? (
                            <>
                                <Input
                                    label="每日任务上限"
                                    type="number"
                                    placeholder="0表示无限制"
                                    value={String(editForm.dailyTaskLimit || 0)}
                                    onChange={e => setEditForm({ ...editForm, dailyTaskLimit: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="佣金加成 (%)"
                                    type="number"
                                    value={String(editForm.commissionBonus || 0)}
                                    onChange={e => setEditForm({ ...editForm, commissionBonus: parseFloat(e.target.value) })}
                                />
                                <Input
                                    label="提现折扣 (%)"
                                    type="number"
                                    value={String(editForm.withdrawFeeDiscount || 0)}
                                    onChange={e => setEditForm({ ...editForm, withdrawFeeDiscount: parseFloat(e.target.value) })}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label="发布任务上限"
                                    type="number"
                                    placeholder="0表示无限制"
                                    value={String(editForm.publishTaskLimit || 0)}
                                    onChange={e => setEditForm({ ...editForm, publishTaskLimit: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="服务费折扣 (%)"
                                    type="number"
                                    value={String(editForm.serviceFeeDiscount || 0)}
                                    onChange={e => setEditForm({ ...editForm, serviceFeeDiscount: parseFloat(e.target.value) })}
                                />
                            </>
                        )}
                    </div>

                    {/* Toggle Options */}
                    <div className="flex flex-wrap gap-4">
                        {activeTab === 'buyer' ? (
                            <>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.canReserveTask || false}
                                        onChange={e => setEditForm({ ...editForm, canReserveTask: e.target.checked })}
                                        className="h-4 w-4 rounded border-[#d1d5db]"
                                    />
                                    <span className="text-sm">可预约任务</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.showVipBadge || false}
                                        onChange={e => setEditForm({ ...editForm, showVipBadge: e.target.checked })}
                                        className="h-4 w-4 rounded border-[#d1d5db]"
                                    />
                                    <span className="text-sm">显示VIP徽章</span>
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.priorityReview || false}
                                        onChange={e => setEditForm({ ...editForm, priorityReview: e.target.checked })}
                                        className="h-4 w-4 rounded border-[#d1d5db]"
                                    />
                                    <span className="text-sm">优先审核</span>
                                </label>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.dedicatedSupport || false}
                                        onChange={e => setEditForm({ ...editForm, dedicatedSupport: e.target.checked })}
                                        className="h-4 w-4 rounded border-[#d1d5db]"
                                    />
                                    <span className="text-sm">专属客服</span>
                                </label>
                            </>
                        )}
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.isActive || false}
                                onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-[#d1d5db]"
                            />
                            <span className="text-sm">启用</span>
                        </label>
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                    <Button onClick={handleSave}>保存</Button>
                </div>
            </Modal>
        </div>
    );
}
