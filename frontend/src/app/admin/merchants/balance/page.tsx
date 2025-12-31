'use client';

import { useState } from 'react';

export default function AdminMerchantsBalancePage() {
    const [records] = useState([
        { id: '1', merchantName: '商家A', type: '充值', amount: 1000, balance: 5000, createdAt: '2024-12-30 10:00' },
        { id: '2', merchantName: '商家B', type: '发布任务', amount: -300, balance: 2700, createdAt: '2024-12-30 09:30' },
        { id: '3', merchantName: '商家A', type: '银锭扣除', amount: -50, balance: 4950, createdAt: '2024-12-29 15:00' },
    ]);

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>商家余额记录</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>商家</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>变动金额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>余额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.merchantName}</td>
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
