'use client';

import { useState } from 'react';

export default function AdminUsersAccountsPage() {
    const [accounts] = useState([
        { id: '1', username: '用户A', platform: '淘宝', account: 'tb_user123', status: 1, createdAt: '2024-12-30' },
        { id: '2', username: '用户B', platform: '京东', account: 'jd_buyer456', status: 0, createdAt: '2024-12-29' },
        { id: '3', username: '用户C', platform: '拼多多', account: 'pdd_shop789', status: 1, createdAt: '2024-12-28' },
    ]);

    const statusLabels: Record<number, { text: string; color: string }> = {
        0: { text: '待审核', color: '#faad14' },
        1: { text: '已通过', color: '#52c41a' },
        2: { text: '已拒绝', color: '#ff4d4f' },
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>买号审核</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户名</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>买号账号</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提交时间</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{a.username}</td>
                                <td style={{ padding: '14px 16px', color: '#666' }}>{a.platform}</td>
                                <td style={{ padding: '14px 16px', color: '#1890ff' }}>{a.account}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: statusLabels[a.status]?.color + '20', color: statusLabels[a.status]?.color }}>
                                        {statusLabels[a.status]?.text}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{a.createdAt}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {a.status === 0 && (
                                        <>
                                            <button style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer', marginRight: '8px' }}>通过</button>
                                            <button style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>拒绝</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
