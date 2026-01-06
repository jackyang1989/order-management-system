'use client';

import { useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

export default function AdminSystemMenuPage() {
    const [menus] = useState([
        { id: '1', name: '仪表盘', path: '/admin/dashboard', icon: '📊', order: 1, status: 1 },
        { id: '2', name: '买手管理', path: '/admin/users', icon: '👥', order: 2, status: 1 },
        { id: '3', name: '商家管理', path: '/admin/merchants', icon: '🏪', order: 3, status: 1 },
        { id: '4', name: '任务管理', path: '/admin/tasks', icon: '📋', order: 4, status: 1 },
        { id: '5', name: '财务管理', path: '/admin/finance', icon: '💰', order: 5, status: 1 },
    ]);

    return (
        <div className="space-y-4">
            <Card className="flex items-center justify-between bg-white">
                <span className="text-base font-medium">菜单管理</span>
                <Button>+ 添加菜单</Button>
            </Card>

            <Card className="overflow-hidden bg-white p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-[700px] w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-4 py-3.5 text-left text-sm font-medium">图标</th>
                                <th className="px-4 py-3.5 text-left text-sm font-medium">名称</th>
                                <th className="px-4 py-3.5 text-left text-sm font-medium">路径</th>
                                <th className="px-4 py-3.5 text-center text-sm font-medium">排序</th>
                                <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menus.map(m => (
                                <tr key={m.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3.5 text-xl">{m.icon}</td>
                                    <td className="px-4 py-3.5 font-medium">{m.name}</td>
                                    <td className="px-4 py-3.5 font-mono text-blue-600">{m.path}</td>
                                    <td className="px-4 py-3.5 text-center text-slate-500">{m.order}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Badge variant="soft" color={m.status === 1 ? 'green' : 'red'}>
                                            {m.status === 1 ? '已启用' : '已禁用'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" variant="secondary">编辑</Button>
                                            <Button size="sm" variant="destructive">删除</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
