'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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
            const url = editingId
                ? `${BASE_URL}/admin/vip-levels/${editingId}`
                : `${BASE_URL}/admin/vip-levels`;
            const method = editingId ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
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

    const filteredLevels = vipLevels
        .filter(v => v.type === activeTab)
        .sort((a, b) => a.level - b.level);

    return (
        <div>
            {/* 页面标题 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>VIP等级配置</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        配置买手和商家的VIP等级及权益
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    style={{
                        padding: '10px 24px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    + 添加VIP等级
                </button>
            </div>

            {/* Tab切换 */}
            <div style={{
                display: 'flex',
                gap: '0',
                marginBottom: '20px',
                background: '#fff',
                borderRadius: '8px',
                padding: '4px',
                width: 'fit-content'
            }}>
                <button
                    onClick={() => setActiveTab('buyer')}
                    style={{
                        padding: '10px 32px',
                        background: activeTab === 'buyer' ? '#1890ff' : 'transparent',
                        color: activeTab === 'buyer' ? '#fff' : '#666',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeTab === 'buyer' ? '500' : 'normal'
                    }}
                >
                    👤 买手VIP
                </button>
                <button
                    onClick={() => setActiveTab('merchant')}
                    style={{
                        padding: '10px 32px',
                        background: activeTab === 'merchant' ? '#1890ff' : 'transparent',
                        color: activeTab === 'merchant' ? '#fff' : '#666',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: activeTab === 'merchant' ? '500' : 'normal'
                    }}
                >
                    🏪 商家VIP
                </button>
            </div>

            {/* VIP等级卡片 */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredLevels.map(vip => (
                        <div key={vip.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            opacity: vip.isActive ? 1 : 0.6,
                        }}>
                            {/* 卡片头部 */}
                            <div style={{
                                background: vip.color || '#1890ff',
                                color: '#fff',
                                padding: '20px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: vip.isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                }}>
                                    {vip.isActive ? '已启用' : '已禁用'}
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {vip.name}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                    等级 {vip.level} · {vip.duration > 0 ? `${vip.duration}天` : '永久'}
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '12px' }}>
                                    ¥{vip.price}
                                    {vip.duration > 0 && <span style={{ fontSize: '14px', fontWeight: 'normal' }}>/月</span>}
                                </div>
                            </div>

                            {/* 卡片内容 */}
                            <div style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontWeight: '500', marginBottom: '12px', color: '#333' }}>权益配置</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#666' }}>
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

                                {/* 操作按钮 */}
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => handleEdit(vip)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: '#fff',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => handleToggle(vip.id)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            background: vip.isActive ? '#fff2e8' : '#e6f7ff',
                                            border: `1px solid ${vip.isActive ? '#ffbb96' : '#91d5ff'}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: vip.isActive ? '#d46b08' : '#1890ff'
                                        }}
                                    >
                                        {vip.isActive ? '禁用' : '启用'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(vip.id)}
                                        style={{
                                            padding: '8px 12px',
                                            background: '#fff',
                                            border: '1px solid #ff4d4f',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            color: '#ff4d4f'
                                        }}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 编辑弹窗 */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        width: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: '500',
                            fontSize: '16px'
                        }}>
                            {editingId ? '编辑VIP等级' : '添加VIP等级'}
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>名称</label>
                                    <input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>等级</label>
                                    <input
                                        type="number"
                                        value={editForm.level || 0}
                                        onChange={e => setEditForm({ ...editForm, level: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>价格 (元)</label>
                                    <input
                                        type="number"
                                        value={editForm.price || 0}
                                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>有效期 (天)</label>
                                    <input
                                        type="number"
                                        value={editForm.duration || 0}
                                        onChange={e => setEditForm({ ...editForm, duration: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>颜色</label>
                                    <input
                                        type="color"
                                        value={editForm.color || '#1890ff'}
                                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                        style={{ width: '100%', height: '42px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                    />
                                </div>
                                {activeTab === 'buyer' ? (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>每日任务上限</label>
                                            <input
                                                type="number"
                                                value={editForm.dailyTaskLimit || 0}
                                                onChange={e => setEditForm({ ...editForm, dailyTaskLimit: parseInt(e.target.value) })}
                                                placeholder="0表示无限制"
                                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>佣金加成 (%)</label>
                                            <input
                                                type="number"
                                                value={editForm.commissionBonus || 0}
                                                onChange={e => setEditForm({ ...editForm, commissionBonus: parseFloat(e.target.value) })}
                                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>提现折扣 (%)</label>
                                            <input
                                                type="number"
                                                value={editForm.withdrawFeeDiscount || 0}
                                                onChange={e => setEditForm({ ...editForm, withdrawFeeDiscount: parseFloat(e.target.value) })}
                                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>发布任务上限</label>
                                            <input
                                                type="number"
                                                value={editForm.publishTaskLimit || 0}
                                                onChange={e => setEditForm({ ...editForm, publishTaskLimit: parseInt(e.target.value) })}
                                                placeholder="0表示无限制"
                                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>服务费折扣 (%)</label>
                                            <input
                                                type="number"
                                                value={editForm.serviceFeeDiscount || 0}
                                                onChange={e => setEditForm({ ...editForm, serviceFeeDiscount: parseFloat(e.target.value) })}
                                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 开关选项 */}
                            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                {activeTab === 'buyer' ? (
                                    <>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.canReserveTask || false}
                                                onChange={e => setEditForm({ ...editForm, canReserveTask: e.target.checked })}
                                            />
                                            <span>可预约任务</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.showVipBadge || false}
                                                onChange={e => setEditForm({ ...editForm, showVipBadge: e.target.checked })}
                                            />
                                            <span>显示VIP徽章</span>
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.priorityReview || false}
                                                onChange={e => setEditForm({ ...editForm, priorityReview: e.target.checked })}
                                            />
                                            <span>优先审核</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={editForm.dedicatedSupport || false}
                                                onChange={e => setEditForm({ ...editForm, dedicatedSupport: e.target.checked })}
                                            />
                                            <span>专属客服</span>
                                        </label>
                                    </>
                                )}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive || false}
                                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                    />
                                    <span>启用</span>
                                </label>
                            </div>
                        </div>
                        <div style={{
                            padding: '16px 24px',
                            borderTop: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '10px 24px',
                                    background: '#1890ff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
