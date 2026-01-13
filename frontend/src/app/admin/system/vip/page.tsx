'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

const FeatureItem = ({ label, value, high }: { label: string; value: string; high: boolean }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className={cn("font-medium", high ? "text-slate-900" : "text-slate-500")}>{value}</span>
    </div>
);

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



    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">VIP等级配置</span>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleCreate}>+ 添加VIP等级</Button>
                    </div>
                </div>

                {/* Tab Switch */}
                <div className="mb-6 inline-flex rounded-md bg-[#f3f4f6] p-1">
                    <button
                        onClick={() => setActiveTab('buyer')}
                        className={cn(
                            'rounded-md px-6 py-2 text-sm transition-colors',
                            activeTab === 'buyer'
                                ? 'bg-white font-medium text-[#3b4559] shadow-sm'
                                : 'text-[#6b7280] hover:text-[#374151]'
                        )}
                    >
                        👤 买手VIP
                    </button>
                    <button
                        onClick={() => setActiveTab('merchant')}
                        className={cn(
                            'rounded-md px-6 py-2 text-sm transition-colors',
                            activeTab === 'merchant'
                                ? 'bg-white font-medium text-[#3b4559] shadow-sm'
                                : 'text-[#6b7280] hover:text-[#374151]'
                        )}
                    >
                        🏪 商家VIP
                    </button>
                </div>

                {/* VIP Level Cards */}
                {loading ? (
                    <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                    {filteredLevels.map(vip => {
                        // Map colors to text/bg shades
                        let colorStyles = {
                            text: 'text-primary-600',
                            bg: 'bg-primary-50',
                            border: 'border-primary-100',
                            badge: 'bg-primary-100 text-primary-700'
                        };

                        if (vip.color === '#52c41a') colorStyles = { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', badge: 'bg-green-100 text-green-700' };
                        else if (vip.color === '#faad14') colorStyles = { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', badge: 'bg-amber-100 text-amber-700' };
                        else if (vip.color === '#eb2f96') colorStyles = { text: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', badge: 'bg-pink-100 text-pink-700' };
                        else if (vip.color === '#722ed1') colorStyles = { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', badge: 'bg-purple-100 text-purple-700' };
                        else if (vip.color === '#13c2c2') colorStyles = { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', badge: 'bg-cyan-100 text-cyan-700' };
                        else if (vip.color === '#f5222d') colorStyles = { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-700' };

                        return (
                            <Card key={vip.id} className={cn(
                                'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
                                !vip.isActive && 'opacity-60 grayscale-[0.5]',
                                vip.isActive ? 'border border-slate-100 shadow-sm' : 'border border-dashed border-slate-200 shadow-none'
                            )}>
                                {/* Decorative Background Gradient */}
                                <div className={cn("absolute right-0 top-0 h-32 w-32 translate-x-1/3 translate-y-[-1/3] rounded-full blur-3xl opacity-20", colorStyles.bg.replace('bg-', 'bg-'))}></div>

                                <div className="p-6">
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className={cn("text-lg font-bold mb-1", colorStyles.text)}>{vip.name}</div>
                                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                Level {vip.level} · {vip.duration > 0 ? `${vip.duration}天` : '永久'}
                                            </div>
                                        </div>
                                        <div className={cn("px-2.5 py-1 rounded-lg text-xs font-bold", vip.isActive ? colorStyles.badge : "bg-slate-100 text-slate-500")}>
                                            {vip.isActive ? '启用中' : '已禁用'}
                                        </div>
                                    </div>

                                    {/* Price Section */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-bold text-slate-800">¥{vip.price}</span>
                                            {vip.duration > 0 && <span className="ml-1 text-sm text-slate-400 font-medium">/ {vip.duration}天</span>}
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="space-y-3 mb-6">
                                        {activeTab === 'buyer' ? (
                                            <>
                                                <FeatureItem label="每日任务" value={vip.dailyTaskLimit === 0 ? '无限制' : `${vip.dailyTaskLimit}个`} high={vip.dailyTaskLimit === 0} />
                                                <FeatureItem label="佣金加成" value={`+${vip.commissionBonus}%`} high={vip.commissionBonus > 0} />
                                                <FeatureItem label="提现折扣" value={`-${vip.withdrawFeeDiscount}%`} high={vip.withdrawFeeDiscount > 0} />
                                                <FeatureItem label="预约任务" value={vip.canReserveTask ? '支持' : '不支持'} high={vip.canReserveTask} />
                                            </>
                                        ) : (
                                            <>
                                                <FeatureItem label="发布任务" value={vip.publishTaskLimit === 0 ? '无限制' : `${vip.publishTaskLimit}个/天`} high={vip.publishTaskLimit === 0} />
                                                <FeatureItem label="服务费折扣" value={`-${vip.serviceFeeDiscount}%`} high={vip.serviceFeeDiscount > 0} />
                                                <FeatureItem label="优先审核" value={vip.priorityReview ? '支持' : '不支持'} high={vip.priorityReview} />
                                                <FeatureItem label="专属客服" value={vip.dedicatedSupport ? '支持' : '不支持'} high={vip.dedicatedSupport} />
                                            </>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-4 border-t border-slate-50">
                                        <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl font-medium" onClick={() => handleEdit(vip)}>编辑</Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={cn(
                                                'flex-1 h-9 rounded-xl font-medium',
                                                vip.isActive ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200' : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-primary-200'
                                            )}
                                            onClick={() => handleToggle(vip.id)}
                                        >
                                            {vip.isActive ? '禁用' : '启用'}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-9 w-9 rounded-xl text-slate-400 hover:text-danger-500 hover:bg-danger-50 p-0" onClick={() => handleDelete(vip.id)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
            </Card>

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
