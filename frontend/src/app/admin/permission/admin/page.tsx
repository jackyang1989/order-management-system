'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface Admin {
    id: string;
    username: string;
    realName: string;
    phone: string;
    email: string;
    roleId: string;
    roleName: string;
    status: number;
    avatar: string;
    lastLoginAt: string;
    lastLoginIp: string;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
}

export default function AdminPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        realName: '',
        phone: '',
        email: '',
        roleId: '',
        status: 1
    });

    useEffect(() => {
        loadAdmins();
        loadRoles();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/users/list`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            // 模拟数据
            setAdmins([
                { id: '1', username: 'admin', realName: '超级管理员', phone: '13800138000', email: 'admin@example.com', roleId: '1', roleName: '超级管理员', status: 1, avatar: '', lastLoginAt: new Date().toISOString(), lastLoginIp: '192.168.1.1', createdAt: new Date().toISOString() },
                { id: '2', username: 'operator', realName: '运营小王', phone: '13800138001', email: 'operator@example.com', roleId: '2', roleName: '运营管理员', status: 1, avatar: '', lastLoginAt: new Date(Date.now() - 3600000).toISOString(), lastLoginIp: '192.168.1.2', createdAt: new Date().toISOString() },
                { id: '3', username: 'finance', realName: '财务小李', phone: '13800138002', email: 'finance@example.com', roleId: '3', roleName: '财务管理员', status: 1, avatar: '', lastLoginAt: new Date(Date.now() - 86400000).toISOString(), lastLoginIp: '192.168.1.3', createdAt: new Date().toISOString() },
                { id: '4', username: 'test', realName: '测试账号', phone: '13800138003', email: 'test@example.com', roleId: '2', roleName: '运营管理员', status: 0, avatar: '', lastLoginAt: '', lastLoginIp: '', createdAt: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadRoles = async () => {
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
            console.error('加载角色失败:', error);
            setRoles([
                { id: '1', name: '超级管理员' },
                { id: '2', name: '运营管理员' },
                { id: '3', name: '财务管理员' },
                { id: '4', name: '客服' },
            ]);
        }
    };

    const handleSubmit = async () => {
        if (!formData.username.trim()) {
            alert('请输入用户名');
            return;
        }
        if (!editingAdmin && !formData.password.trim()) {
            alert('请输入密码');
            return;
        }
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingAdmin
                ? `${BASE_URL}/admin/users/${editingAdmin.id}`
                : `${BASE_URL}/admin/users`;
            const method = editingAdmin ? 'PUT' : 'POST';

            const submitData = { ...formData };
            if (editingAdmin && !submitData.password) {
                delete (submitData as { password?: string }).password;
            }

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(submitData),
            });

            setShowModal(false);
            setEditingAdmin(null);
            setFormData({ username: '', password: '', realName: '', phone: '', email: '', roleId: '', status: 1 });
            loadAdmins();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该管理员？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadAdmins();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const handleToggleStatus = async (admin: Admin) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/users/${admin.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: admin.status === 1 ? 0 : 1 }),
            });
            loadAdmins();
        } catch (error) {
            console.error('更新状态失败:', error);
        }
    };

    const handleResetPassword = async (id: string) => {
        const newPassword = prompt('请输入新密码（至少6位）：');
        if (!newPassword || newPassword.length < 6) {
            alert('密码不能少于6位');
            return;
        }
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/users/${id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ password: newPassword }),
            });
            alert('密码重置成功');
        } catch (error) {
            console.error('重置密码失败:', error);
            alert('重置密码失败');
        }
    };

    const openEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        setFormData({
            username: admin.username,
            password: '',
            realName: admin.realName,
            phone: admin.phone,
            email: admin.email,
            roleId: admin.roleId,
            status: admin.status
        });
        setShowModal(true);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('zh-CN');
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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>管理员管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理后台管理员账号
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingAdmin(null);
                        setFormData({ username: '', password: '', realName: '', phone: '', email: '', roleId: '', status: 1 });
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
                    + 添加管理员
                </button>
            </div>

            {/* 统计卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        {admins.length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>管理员总数</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                        {admins.filter(a => a.status === 1).length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>正常状态</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#faad14' }}>
                        {admins.filter(a => a.status === 0).length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>已禁用</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#722ed1' }}>
                        {roles.length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>角色数量</div>
                </div>
            </div>

            {/* 管理员列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: '500',
                    fontSize: '15px'
                }}>
                    管理员列表
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : admins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                        <div>暂无管理员</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>用户名</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>姓名</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>角色</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>手机号</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>最后登录</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                background: '#1890ff',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '500',
                                                fontSize: '14px'
                                            }}>
                                                {admin.realName?.[0] || admin.username[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '500' }}>{admin.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>{admin.realName || '-'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: admin.roleName === '超级管理员' ? '#e6f7ff' : '#f0f0f0',
                                            color: admin.roleName === '超级管理员' ? '#1890ff' : '#666'
                                        }}>
                                            {admin.roleName}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>{admin.phone || '-'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: admin.status === 1 ? '#f6ffed' : '#fff2f0',
                                            color: admin.status === 1 ? '#52c41a' : '#ff4d4f'
                                        }}>
                                            {admin.status === 1 ? '正常' : '禁用'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
                                        <div>{formatDate(admin.lastLoginAt)}</div>
                                        {admin.lastLoginIp && (
                                            <div style={{ color: '#999', fontSize: '12px' }}>{admin.lastLoginIp}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => openEdit(admin)}
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
                                                onClick={() => handleResetPassword(admin.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #faad14',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: '#d48806'
                                                }}
                                            >
                                                重置密码
                                            </button>
                                            {admin.username !== 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleStatus(admin)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: admin.status === 1 ? '#fff7e6' : '#f6ffed',
                                                            border: `1px solid ${admin.status === 1 ? '#ffd591' : '#b7eb8f'}`,
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            color: admin.status === 1 ? '#d48806' : '#52c41a'
                                                        }}
                                                    >
                                                        {admin.status === 1 ? '禁用' : '启用'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(admin.id)}
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
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                            {editingAdmin ? '编辑管理员' : '添加管理员'}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    用户名 <span style={{ color: '#ff4d4f' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="请输入用户名"
                                    disabled={!!editingAdmin}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        background: editingAdmin ? '#f5f5f5' : '#fff'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    密码 {!editingAdmin && <span style={{ color: '#ff4d4f' }}>*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingAdmin ? '留空则不修改' : '请输入密码'}
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
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>姓名</label>
                                <input
                                    type="text"
                                    value={formData.realName}
                                    onChange={e => setFormData({ ...formData, realName: e.target.value })}
                                    placeholder="请输入姓名"
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
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>角色</label>
                                <select
                                    value={formData.roleId}
                                    onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">请选择角色</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>手机号</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="请输入手机号"
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
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>邮箱</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="请输入邮箱"
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
                                        checked={formData.status === 1}
                                        onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                                    />
                                    启用该账号
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
