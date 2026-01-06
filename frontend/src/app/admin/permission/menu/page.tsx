'use client';

import React, { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

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
            setMenus([
                { id: '1', name: '仪表盘', path: '/admin/dashboard', icon: '📊', parentId: null, sort: 1, isActive: true, permission: 'dashboard:view' },
                {
                    id: '2', name: '买手管理', path: '/admin/users', icon: '👥', parentId: null, sort: 2, isActive: true, permission: 'users:view',
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
            const url = editingMenu ? `${BASE_URL}/admin/menus/${editingMenu.id}` : `${BASE_URL}/admin/menus`;
            const method = editingMenu ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        // Calculate padding based on nesting level: 16px base + 24px per level
        const paddingLeft = 16 + level * 24;

        return (
            <React.Fragment key={menu.id}>
                <tr className="border-b border-slate-100">
                    <td className={cn('px-4 py-4', `pl-[${paddingLeft}px]`)}>
                        <span className="mr-2">{menu.icon}</span>
                        {menu.name}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{menu.path}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{menu.permission}</td>
                    <td className="px-4 py-4">{menu.sort}</td>
                    <td className="px-4 py-4">
                        <Badge variant="soft" color={menu.isActive ? 'green' : 'slate'}>
                            {menu.isActive ? '启用' : '禁用'}
                        </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => openEdit(menu)}>编辑</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(menu.id)}>删除</Button>
                        </div>
                    </td>
                </tr>
                {menu.children?.map(child => renderMenuRow(child, level + 1))}
            </React.Fragment>
        );
    };

    const flatMenus = menus.filter(m => !m.parentId);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">菜单管理</h2>
                    <p className="mt-1 text-sm text-slate-500">管理后台菜单结构和权限配置</p>
                </div>
                <Button onClick={() => {
                    setEditingMenu(null);
                    setFormData({ name: '', path: '', icon: '', parentId: '', sort: 0, isActive: true, permission: '' });
                    setShowModal(true);
                }}>
                    + 添加菜单
                </Button>
            </div>

            {/* Menu List */}
            <Card className="overflow-hidden bg-white">
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : menus.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="mb-4 text-5xl">📁</div>
                        <div>暂无菜单配置</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-4 text-left text-sm font-medium">菜单名称</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">路径</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">权限标识</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">排序</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flatMenus.map(menu => renderMenuRow(menu))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal title={editingMenu ? '编辑菜单' : '添加菜单'} open={showModal} onClose={() => setShowModal(false)} className="max-w-lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="菜单名称"
                            placeholder="请输入菜单名称"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">图标</label>
                            <Select
                                value={formData.icon}
                                onChange={v => setFormData({ ...formData, icon: v })}
                                options={[{ value: '', label: '请选择图标' }, ...iconOptions.map(icon => ({ value: icon, label: icon }))]}
                            />
                        </div>
                    </div>

                    <Input
                        label="路径"
                        placeholder="如: /admin/users"
                        value={formData.path}
                        onChange={e => setFormData({ ...formData, path: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">上级菜单</label>
                            <Select
                                value={formData.parentId}
                                onChange={v => setFormData({ ...formData, parentId: v })}
                                options={[{ value: '', label: '无（顶级菜单）' }, ...flatMenus.map(m => ({ value: m.id, label: `${m.icon} ${m.name}` }))]}
                            />
                        </div>
                        <Input
                            label="排序"
                            type="number"
                            value={String(formData.sort)}
                            onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                        />
                    </div>

                    <Input
                        label="权限标识"
                        placeholder="如: users:view"
                        value={formData.permission}
                        onChange={e => setFormData({ ...formData, permission: e.target.value })}
                    />

                    <div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm">启用该菜单</span>
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
