'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    status: number;
    sort: number;
    createdAt: string;
    userCount?: number;
}

interface Permission {
    code: string;
    name: string;
    module: string;
}

export default function RolePage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[],
        status: 1,
        sort: 0
    });

    useEffect(() => {
        loadRoles();
        loadPermissions();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/roles`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            // 模拟数据
            setRoles([
                { id: '1', name: '超级管理员', description: '拥有所有权限', permissions: ['*'], status: 1, sort: 1, createdAt: new Date().toISOString(), userCount: 2 },
                { id: '2', name: '运营管理员', description: '负责日常运营管理', permissions: ['users:view', 'orders:view', 'tasks:view'], status: 1, sort: 2, createdAt: new Date().toISOString(), userCount: 5 },
                { id: '3', name: '财务管理员', description: '负责财务相关操作', permissions: ['finance:view', 'finance:audit'], status: 1, sort: 3, createdAt: new Date().toISOString(), userCount: 3 },
                { id: '4', name: '客服', description: '处理用户问题', permissions: ['users:view', 'orders:view'], status: 0, sort: 4, createdAt: new Date().toISOString(), userCount: 8 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadPermissions = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/permissions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPermissions(data.data || []);
            }
        } catch (error) {
            console.error('加载权限失败:', error);
            // 模拟数据
            setPermissions([
                { code: 'dashboard:view', name: '查看仪表盘', module: '仪表盘' },
                { code: 'users:view', name: '查看买手', module: '买手管理' },
                { code: 'users:edit', name: '编辑买手', module: '买手管理' },
                { code: 'users:balance', name: '调整余额', module: '买手管理' },
                { code: 'merchants:view', name: '查看商家', module: '商家管理' },
                { code: 'merchants:audit', name: '审核商家', module: '商家管理' },
                { code: 'tasks:view', name: '查看任务', module: '任务管理' },
                { code: 'orders:view', name: '查看订单', module: '订单管理' },
                { code: 'orders:refund', name: '退款处理', module: '订单管理' },
                { code: 'finance:view', name: '查看财务', module: '财务管理' },
                { code: 'finance:audit', name: '审核提现', module: '财务管理' },
                { code: 'system:view', name: '查看设置', module: '系统设置' },
                { code: 'system:edit', name: '修改设置', module: '系统设置' },
            ]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            alert('请输入角色名称');
            return;
        }
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingRole
                ? `${BASE_URL}/admin/roles/${editingRole.id}`
                : `${BASE_URL}/admin/roles`;
            const method = editingRole ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setEditingRole(null);
            setFormData({ name: '', description: '', permissions: [], status: 1, sort: 0 });
            loadRoles();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该角色？使用该角色的管理员将失去权限！')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/roles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadRoles();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const openEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            status: role.status,
            sort: role.sort
        });
        setShowModal(true);
    };

    const togglePermission = (code: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(code)
                ? prev.permissions.filter(p => p !== code)
                : [...prev.permissions, code]
        }));
    };

    const toggleAllPermissions = (module: string) => {
        const moduleCodes = permissions.filter(p => p.module === module).map(p => p.code);
        const allSelected = moduleCodes.every(c => formData.permissions.includes(c));

        setFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(p => !moduleCodes.includes(p))
                : [...new Set([...prev.permissions, ...moduleCodes])]
        }));
    };

    const groupedPermissions = permissions.reduce((acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>角色管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理系统角色和权限分配
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingRole(null);
                        setFormData({ name: '', description: '', permissions: [], status: 1, sort: 0 });
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
                    + 添加角色
                </button>
            </div>

            {/* 角色卡片 */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
            ) : roles.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: '#999',
                    background: '#fff',
                    borderRadius: '8px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                    <div>暂无角色配置</div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px'
                }}>
                    {roles.map(role => (
                        <div key={role.id} style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '20px',
                            border: role.name === '超级管理员' ? '2px solid #1890ff' : '1px solid #f0f0f0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {role.name}
                                        {role.name === '超级管理员' && (
                                            <span style={{
                                                fontSize: '12px',
                                                background: '#1890ff',
                                                color: '#fff',
                                                padding: '2px 8px',
                                                borderRadius: '4px'
                                            }}>系统</span>
                                        )}
                                    </h3>
                                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '13px' }}>{role.description}</p>
                                </div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    background: role.status === 1 ? '#f6ffed' : '#f5f5f5',
                                    color: role.status === 1 ? '#52c41a' : '#999'
                                }}>
                                    {role.status === 1 ? '启用' : '禁用'}
                                </span>
                            </div>

                            <div style={{
                                padding: '12px',
                                background: '#f9f9f9',
                                borderRadius: '6px',
                                marginBottom: '16px',
                                fontSize: '13px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#666' }}>权限数量</span>
                                    <span style={{ fontWeight: '500' }}>
                                        {role.permissions.includes('*') ? '全部权限' : `${role.permissions.length} 项`}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666' }}>使用人数</span>
                                    <span style={{ fontWeight: '500' }}>{role.userCount || 0} 人</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => openEdit(role)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: '#fff',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                    }}
                                >
                                    编辑
                                </button>
                                {role.name !== '超级管理员' && (
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
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
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                        width: '640px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px' }}>
                            {editingRole ? '编辑角色' : '添加角色'}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>角色名称</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="请输入角色名称"
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
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>描述</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="请输入角色描述"
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

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>权限配置</label>
                            <div style={{
                                border: '1px solid #d9d9d9',
                                borderRadius: '6px',
                                padding: '16px',
                                maxHeight: '300px',
                                overflow: 'auto'
                            }}>
                                {Object.entries(groupedPermissions).map(([module, perms]) => (
                                    <div key={module} style={{ marginBottom: '16px' }}>
                                        <div
                                            onClick={() => toggleAllPermissions(module)}
                                            style={{
                                                fontWeight: '500',
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={perms.every(p => formData.permissions.includes(p.code))}
                                                onChange={() => toggleAllPermissions(module)}
                                            />
                                            {module}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                            paddingLeft: '24px'
                                        }}>
                                            {perms.map(p => (
                                                <label
                                                    key={p.code}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '4px 8px',
                                                        background: formData.permissions.includes(p.code) ? '#e6f7ff' : '#f5f5f5',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(p.code)}
                                                        onChange={() => togglePermission(p.code)}
                                                    />
                                                    {p.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.status === 1}
                                    onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                                />
                                启用该角色
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
