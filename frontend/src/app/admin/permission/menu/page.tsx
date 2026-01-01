'use client';

import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface MenuItem {
    id: string;
    name: string;
    path: string;
    icon: string;
    parentId: string | null;
    sort: number;
    isActive: boolean;
    permission: string;
    children?: MenuItem[];
}

export default function MenuPermissionPage() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        path: '',
        icon: '',
        parentId: '',
        sort: 0,
        isActive: true,
        permission: ''
    });

    const iconOptions = ['📊', '👥', '🏪', '📋', '📦', '💰', '📢', '⚙️', '🔐', '🛠️', '📁', '📄', '🔧'];

    useEffect(() => {
        loadMenus();
    }, []);

    const loadMenus = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/menus`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setMenus(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            // 模拟数据
            setMenus([
                { id: '1', name: '仪表盘', path: '/admin/dashboard', icon: '📊', parentId: null, sort: 1, isActive: true, permission: 'dashboard:view' },
                { id: '2', name: '买手管理', path: '/admin/users', icon: '👥', parentId: null, sort: 2, isActive: true, permission: 'users:view',
                    children: [
                        { id: '2-1', name: '买手列表', path: '/admin/users', icon: '📄', parentId: '2', sort: 1, isActive: true, permission: 'users:list' },
                        { id: '2-2', name: '余额记录', path: '/admin/users/balance', icon: '💰', parentId: '2', sort: 2, isActive: true, permission: 'users:balance' },
                    ]
                },
                { id: '3', name: '商家管理', path: '/admin/merchants', icon: '🏪', parentId: null, sort: 3, isActive: true, permission: 'merchants:view' },
                { id: '4', name: '任务管理', path: '/admin/tasks', icon: '📋', parentId: null, sort: 4, isActive: true, permission: 'tasks:view' },
                { id: '5', name: '订单管理', path: '/admin/orders', icon: '📦', parentId: null, sort: 5, isActive: true, permission: 'orders:view' },
                { id: '6', name: '财务管理', path: '/admin/finance', icon: '💰', parentId: null, sort: 6, isActive: true, permission: 'finance:view' },
                { id: '7', name: '系统设置', path: '/admin/system', icon: '⚙️', parentId: null, sort: 7, isActive: true, permission: 'system:view' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingMenu
                ? `${BASE_URL}/admin/menus/${editingMenu.id}`
                : `${BASE_URL}/admin/menus`;
            const method = editingMenu ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setEditingMenu(null);
            setFormData({ name: '', path: '', icon: '', parentId: '', sort: 0, isActive: true, permission: '' });
            loadMenus();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该菜单？子菜单也将被删除！')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/menus/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadMenus();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const openEdit = (menu: MenuItem) => {
        setEditingMenu(menu);
        setFormData({
            name: menu.name,
            path: menu.path,
            icon: menu.icon,
            parentId: menu.parentId || '',
            sort: menu.sort,
            isActive: menu.isActive,
            permission: menu.permission
        });
        setShowModal(true);
    };

    const renderMenuRow = (menu: MenuItem, level: number = 0): React.ReactNode => {
        return (
            <>
                <tr key={menu.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '16px', paddingLeft: `${16 + level * 24}px` }}>
                        <span style={{ marginRight: '8px' }}>{menu.icon}</span>
                        {menu.name}
                    </td>
                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>{menu.path}</td>
                    <td style={{ padding: '16px', color: '#999', fontSize: '13px' }}>{menu.permission}</td>
                    <td style={{ padding: '16px' }}>{menu.sort}</td>
                    <td style={{ padding: '16px' }}>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background: menu.isActive ? '#f6ffed' : '#f5f5f5',
                            color: menu.isActive ? '#52c41a' : '#999'
                        }}>
                            {menu.isActive ? '启用' : '禁用'}
                        </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                                onClick={() => openEdit(menu)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                }}
                            >
                                编辑
                            </button>
                            <button
                                onClick={() => handleDelete(menu.id)}
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
                {menu.children?.map(child => renderMenuRow(child, level + 1))}
            </>
        );
    };

    const flatMenus = menus.filter(m => !m.parentId);

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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>菜单管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理后台菜单结构和权限配置
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingMenu(null);
                        setFormData({ name: '', path: '', icon: '', parentId: '', sort: 0, isActive: true, permission: '' });
                        setShowModal(true);
                    }}
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
                    + 添加菜单
                </button>
            </div>

            {/* 菜单列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : menus.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                        <div>暂无菜单配置</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>菜单名称</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>路径</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>权限标识</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>排序</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flatMenus.map(menu => renderMenuRow(menu))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 添加/编辑弹窗 */}
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
                        padding: '24px',
                        width: '520px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px' }}>
                            {editingMenu ? '编辑菜单' : '添加菜单'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>菜单名称</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="请输入菜单名称"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>图标</label>
                                <select
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">请选择图标</option>
                                    {iconOptions.map(icon => (
                                        <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>路径</label>
                                <input
                                    type="text"
                                    value={formData.path}
                                    onChange={e => setFormData({ ...formData, path: e.target.value })}
                                    placeholder="如: /admin/users"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>上级菜单</label>
                                <select
                                    value={formData.parentId}
                                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">无（顶级菜单）</option>
                                    {flatMenus.map(m => (
                                        <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>排序</label>
                                <input
                                    type="number"
                                    value={formData.sort}
                                    onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>权限标识</label>
                                <input
                                    type="text"
                                    value={formData.permission}
                                    onChange={e => setFormData({ ...formData, permission: e.target.value })}
                                    placeholder="如: users:view"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    启用该菜单
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
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
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
