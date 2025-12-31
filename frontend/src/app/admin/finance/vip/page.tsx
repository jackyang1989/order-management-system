'use client';

import { useState } from 'react';

export default function AdminFinanceVipPage() {
    const [records] = useState([
        { id: '1', username: '用户A', vipType: '月度会员', amount: 99, expireAt: '2025-01-30', createdAt: '2024-12-30' },
        { id: '2', username: '用户B', vipType: '年度会员', amount: 899, expireAt: '2025-12-30', createdAt: '2024-12-29' },
    ]);

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>会员记录</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>会员类型</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>到期时间</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>购买时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.username}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#722ed120', color: '#722ed1' }}>{r.vipType}</span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{r.amount}</td>
                                <td style={{ padding: '14px 16px', color: '#666' }}>{r.expireAt}</td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{r.createdAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
