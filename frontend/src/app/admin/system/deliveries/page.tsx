'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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
            const url = editingId
                ? `${BASE_URL}/admin/deliveries/${editingId}`
                : `${BASE_URL}/admin/deliveries`;
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
        <div>
            {/* 页面标题 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>快递管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理快递公司信息，配置物流查询链接
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
                    + 添加快递公司
                </button>
            </div>

            {/* 快递列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>排序</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>快递代码</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>快递名称</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>物流查询链接</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(delivery => (
                                <tr key={delivery.id} style={{
                                    borderBottom: '1px solid #f0f0f0',
                                    opacity: delivery.isActive ? 1 : 0.5
                                }}>
                                    <td style={{ padding: '16px' }}>{delivery.sortOrder || 0}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: '500' }}>{delivery.code}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ marginRight: '8px' }}>📦</span>
                                        {delivery.name}
                                    </td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {delivery.trackingUrl || '-'}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: delivery.isActive ? '#f6ffed' : '#fff2f0',
                                            color: delivery.isActive ? '#52c41a' : '#ff4d4f'
                                        }}>
                                            {delivery.isActive ? '启用' : '禁用'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(delivery)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                编辑
                                            </button>
                                            <button
                                                onClick={() => handleToggle(delivery.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: delivery.isActive ? '#fff2e8' : '#e6f7ff',
                                                    border: `1px solid ${delivery.isActive ? '#ffbb96' : '#91d5ff'}`,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: delivery.isActive ? '#d46b08' : '#1890ff'
                                                }}
                                            >
                                                {delivery.isActive ? '禁用' : '启用'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(delivery.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #ff4d4f',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: '#ff4d4f'
                                                }}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

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
                        width: '500px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid #f0f0f0',
                            fontWeight: '500',
                            fontSize: '16px'
                        }}>
                            {editingId ? '编辑快递公司' : '添加快递公司'}
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>快递代码</label>
                                    <input
                                        value={editForm.code || ''}
                                        onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                                        placeholder="如: SF, YTO, ZTO"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>快递名称</label>
                                    <input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="如: 顺丰速运, 圆通速递"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>物流查询链接</label>
                                    <input
                                        value={editForm.trackingUrl || ''}
                                        onChange={e => setEditForm({ ...editForm, trackingUrl: e.target.value })}
                                        placeholder="使用 {number} 代表运单号"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                    <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#999' }}>
                                        示例: https://www.sf-express.com/cn/sc/dynamic_function/waybill/#search/bill-number/{'{number}'}
                                    </p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>排序</label>
                                    <input
                                        type="number"
                                        value={editForm.sortOrder || 0}
                                        onChange={e => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.isActive !== false}
                                            onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        />
                                        <span>启用</span>
                                    </label>
                                </div>
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
