'use client';

import { useState } from 'react';

export default function AdminSystemMenuPage() {
    const [menus] = useState([
        { id: '1', name: '仪表盘', path: '/admin/dashboard', icon: '📊', order: 1, status: 1 },
        { id: '2', name: '买手管理', path: '/admin/users', icon: '👥', order: 2, status: 1 },
        { id: '3', name: '商家管理', path: '/admin/merchants', icon: '🏪', order: 3, status: 1 },
        { id: '4', name: '任务管理', path: '/admin/tasks', icon: '📋', order: 4, status: 1 },
        { id: '5', name: '财务管理', path: '/admin/finance', icon: '💰', order: 5, status: 1 },
    ]);

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>菜单管理</span>
                <button style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ 添加菜单</button>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>图标</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>名称</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>路径</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>排序</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menus.map(m => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontSize: '20px' }}>{m.icon}</td>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{m.name}</td>
                                <td style={{ padding: '14px 16px', color: '#1890ff', fontFamily: 'monospace' }}>{m.path}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666' }}>{m.order}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: m.status === 1 ? '#52c41a20' : '#ff4d4f20', color: m.status === 1 ? '#52c41a' : '#ff4d4f' }}>
                                        {m.status === 1 ? '已启用' : '已禁用'}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <button style={{ padding: '4px 12px', border: '1px solid #1890ff', borderRadius: '4px', background: '#fff', color: '#1890ff', cursor: 'pointer', marginRight: '8px' }}>编辑</button>
                                    <button style={{ padding: '4px 12px', border: '1px solid #ff4d4f', borderRadius: '4px', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
