'use client';

import { useState } from 'react';

export default function AdminUsersBalancePage() {
    const [records] = useState([
        { id: '1', username: '用户A', type: '任务佣金', amount: 50, balance: 150, createdAt: '2024-12-30 10:00' },
        { id: '2', username: '用户B', type: '提现', amount: -100, balance: 200, createdAt: '2024-12-30 09:30' },
        { id: '3', username: '用户C', type: '任务佣金', amount: 30, balance: 80, createdAt: '2024-12-29 15:00' },
    ]);

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>买手余额记录</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户名</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>变动金额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>余额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.username}</td>
                                <td style={{ padding: '14px 16px', color: '#666' }}>{r.type}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', color: r.amount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: '500' }}>
                                    {r.amount > 0 ? '+' : ''}{r.amount.toFixed(2)}
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000' }}>¥{r.balance.toFixed(2)}</td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{r.createdAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
