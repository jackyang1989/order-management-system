'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

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
            const url = editingAdmin ? `${BASE_URL}/admin/users/${editingAdmin.id}` : `${BASE_URL}/admin/users`;
            const method = editingAdmin ? 'PUT' : 'POST';
            const submitData = { ...formData };
            if (editingAdmin && !submitData.password) {
                delete (submitData as { password?: string }).password;
            }

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">管理员管理</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">管理后台管理员账号</p>
                </div>
                <Button onClick={() => {
                    setEditingAdmin(null);
                    setFormData({ username: '', password: '', realName: '', phone: '', email: '', roleId: '', status: 1 });
                    setShowModal(true);
                }}>
                    + 添加管理员
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-primary-600">{admins.length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">管理员总数</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-success-400">{admins.filter(a => a.status === 1).length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">正常状态</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-warning-400">{admins.filter(a => a.status === 0).length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">已禁用</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-purple-600">{roles.length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">角色数量</div>
                </Card>
            </div>

            {/* Admin List */}
            <Card className="overflow-hidden bg-white">
                <div className="border-b border-[#f3f4f6] px-6 py-4 text-sm font-medium">管理员列表</div>
                {loading ? (
                    <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
                ) : admins.length === 0 ? (
                    <div className="py-16 text-center text-[#9ca3af]">
                        <div className="mb-4 text-5xl">👤</div>
                        <div>暂无管理员</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-4 py-4 text-left text-sm font-medium">用户名</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">姓名</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">角色</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">手机号</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">最后登录</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map(admin => (
                                    <tr key={admin.id} className="border-b border-[#f3f4f6]">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-medium text-white">
                                                    {admin.realName?.[0] || admin.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium">{admin.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">{admin.realName || '-'}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={admin.roleName === '超级管理员' ? 'blue' : 'slate'}>
                                                {admin.roleName}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-[#6b7280]">{admin.phone || '-'}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={admin.status === 1 ? 'green' : 'red'}>
                                                {admin.status === 1 ? '正常' : '禁用'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-[#6b7280]">
                                            <div>{formatDate(admin.lastLoginAt)}</div>
                                            {admin.lastLoginIp && <div className="text-[#9ca3af]">{admin.lastLoginIp}</div>}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-wrap justify-center gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => openEdit(admin)}>编辑</Button>
                                                <Button size="sm" className="border border-amber-400 bg-amber-50 text-warning-500 hover:bg-amber-100" onClick={() => handleResetPassword(admin.id)}>重置密码</Button>
                                                {admin.username !== 'admin' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                admin.status === 1
                                                                    ? 'border border-amber-400 bg-amber-50 text-warning-500 hover:bg-amber-100'
                                                                    : 'border border-green-400 bg-green-50 text-success-400 hover:bg-green-100'
                                                            )}
                                                            onClick={() => handleToggleStatus(admin)}
                                                        >
                                                            {admin.status === 1 ? '禁用' : '启用'}
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(admin.id)}>删除</Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal title={editingAdmin ? '编辑管理员' : '添加管理员'} open={showModal} onClose={() => setShowModal(false)} className="max-w-lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">用户名 <span className="text-danger-400">*</span></label>
                            <Input
                                placeholder="请输入用户名"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                disabled={!!editingAdmin}
                                className={editingAdmin ? 'bg-[#f3f4f6]' : ''}
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">密码 {!editingAdmin && <span className="text-danger-400">*</span>}</label>
                            <Input
                                type="password"
                                placeholder={editingAdmin ? '留空则不修改' : '请输入密码'}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="姓名"
                            placeholder="请输入姓名"
                            value={formData.realName}
                            onChange={e => setFormData({ ...formData, realName: e.target.value })}
                        />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-[#374151]">角色</label>
                            <Select
                                value={formData.roleId}
                                onChange={v => setFormData({ ...formData, roleId: v })}
                                options={[{ value: '', label: '请选择角色' }, ...roles.map(r => ({ value: r.id, label: r.name }))]}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="手机号"
                            placeholder="请输入手机号"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Input
                            label="邮箱"
                            type="email"
                            placeholder="请输入邮箱"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.status === 1}
                                onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                                className="h-4 w-4 rounded border-[#d1d5db]"
                            />
                            <span className="text-sm">启用该账号</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSubmit}>保存</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
