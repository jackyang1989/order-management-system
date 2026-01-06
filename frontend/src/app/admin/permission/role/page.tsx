'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

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
            const url = editingRole ? `${BASE_URL}/admin/roles/${editingRole.id}` : `${BASE_URL}/admin/roles`;
            const method = editingRole ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">角色管理</h2>
                    <p className="mt-1 text-sm text-slate-500">管理系统角色和权限分配</p>
                </div>
                <Button onClick={() => {
                    setEditingRole(null);
                    setFormData({ name: '', description: '', permissions: [], status: 1, sort: 0 });
                    setShowModal(true);
                }}>
                    + 添加角色
                </Button>
            </div>

            {/* Role Cards */}
            {loading ? (
                <div className="py-16 text-center text-slate-400">加载中...</div>
            ) : roles.length === 0 ? (
                <Card className="bg-white py-16 text-center text-slate-400">
                    <div className="mb-4 text-5xl">🔐</div>
                    <div>暂无角色配置</div>
                </Card>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                    {roles.map(role => (
                        <Card
                            key={role.id}
                            className={cn(
                                'bg-white',
                                role.name === '超级管理员' && 'ring-2 ring-blue-500'
                            )}
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <h3 className="flex items-center gap-2 text-base font-medium">
                                        {role.name}
                                        {role.name === '超级管理员' && (
                                            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">系统</span>
                                        )}
                                    </h3>
                                    <p className="mt-1.5 text-xs text-slate-500">{role.description}</p>
                                </div>
                                <Badge variant="soft" color={role.status === 1 ? 'green' : 'slate'}>
                                    {role.status === 1 ? '启用' : '禁用'}
                                </Badge>
                            </div>

                            <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm">
                                <div className="mb-2 flex justify-between">
                                    <span className="text-slate-500">权限数量</span>
                                    <span className="font-medium">
                                        {role.permissions.includes('*') ? '全部权限' : `${role.permissions.length} 项`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">使用人数</span>
                                    <span className="font-medium">{role.userCount || 0} 人</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEdit(role)}>编辑</Button>
                                {role.name !== '超级管理员' && (
                                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete(role.id)}>删除</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal title={editingRole ? '编辑角色' : '添加角色'} open={showModal} onClose={() => setShowModal(false)} className="max-w-xl">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="角色名称"
                            placeholder="请输入角色名称"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            label="排序"
                            type="number"
                            value={String(formData.sort)}
                            onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                        />
                    </div>

                    <Input
                        label="描述"
                        placeholder="请输入角色描述"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">权限配置</label>
                        <div className="max-h-72 overflow-auto rounded-md border border-slate-300 p-4">
                            {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module} className="mb-4">
                                    <div
                                        onClick={() => toggleAllPermissions(module)}
                                        className="mb-2 flex cursor-pointer items-center gap-2 font-medium"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={perms.every(p => formData.permissions.includes(p.code))}
                                            onChange={() => toggleAllPermissions(module)}
                                            className="h-4 w-4 rounded border-slate-300"
                                        />
                                        {module}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pl-6">
                                        {perms.map(p => (
                                            <label
                                                key={p.code}
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm',
                                                    formData.permissions.includes(p.code) ? 'bg-blue-50' : 'bg-slate-100'
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(p.code)}
                                                    onChange={() => togglePermission(p.code)}
                                                    className="h-3.5 w-3.5 rounded border-slate-300"
                                                />
                                                {p.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.status === 1}
                                onChange={e => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm">启用该角色</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSubmit}>保存</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
