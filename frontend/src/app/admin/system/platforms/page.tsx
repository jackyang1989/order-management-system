'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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

    useEffect(() => {
        loadPlatforms();
    }, []);

    const loadPlatforms = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/platforms?includeInactive=true`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPlatforms(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
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
            const url = editingId
                ? `${BASE_URL}/admin/platforms/${editingId}`
                : `${BASE_URL}/admin/platforms`;
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
            loadPlatforms();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/platforms/${id}/toggle`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
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
        <div>
            {/* 页面标题 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>平台管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理电商平台分类，如淘宝、天猫、京东、拼多多等
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
                    + 添加平台
                </button>
            </div>

            {/* 平台列表 */}
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
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>图标</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>平台代码</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>平台名称</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>基础费率</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>淘口令</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platforms.sort((a, b) => a.sortOrder - b.sortOrder).map(platform => (
                                <tr key={platform.id} style={{
                                    borderBottom: '1px solid #f0f0f0',
                                    opacity: platform.isActive ? 1 : 0.5
                                }}>
                                    <td style={{ padding: '16px' }}>{platform.sortOrder}</td>
                                    <td style={{ padding: '16px', fontSize: '24px' }}>{platform.icon || '🛒'}</td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>{platform.code}</td>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{platform.name}</td>
                                    <td style={{ padding: '16px' }}>{platform.baseFeeRate}%</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: platform.supportsTkl ? '#e6f7ff' : '#f5f5f5',
                                            color: platform.supportsTkl ? '#1890ff' : '#999'
                                        }}>
                                            {platform.supportsTkl ? '支持' : '不支持'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: platform.isActive ? '#f6ffed' : '#fff2f0',
                                            color: platform.isActive ? '#52c41a' : '#ff4d4f'
                                        }}>
                                            {platform.isActive ? '启用' : '禁用'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(platform)}
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
                                                onClick={() => handleToggle(platform.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: platform.isActive ? '#fff2e8' : '#e6f7ff',
                                                    border: `1px solid ${platform.isActive ? '#ffbb96' : '#91d5ff'}`,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: platform.isActive ? '#d46b08' : '#1890ff'
                                                }}
                                            >
                                                {platform.isActive ? '禁用' : '启用'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(platform.id)}
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
                            {editingId ? '编辑平台' : '添加平台'}
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>平台代码</label>
                                    <input
                                        value={editForm.code || ''}
                                        onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                                        placeholder="如: taobao, tmall, jd"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>平台名称</label>
                                    <input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="如: 淘宝, 天猫, 京东"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>图标</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {platformIcons.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, icon })}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    fontSize: '20px',
                                                    border: editForm.icon === icon ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                                    borderRadius: '8px',
                                                    background: editForm.icon === icon ? '#e6f7ff' : '#fff',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>基础费率 (%)</label>
                                    <input
                                        type="number"
                                        value={editForm.baseFeeRate || 0}
                                        onChange={e => setEditForm({ ...editForm, baseFeeRate: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                                    />
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
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.supportsTkl || false}
                                            onChange={e => setEditForm({ ...editForm, supportsTkl: e.target.checked })}
                                        />
                                        <span>支持淘口令</span>
                                    </label>
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
