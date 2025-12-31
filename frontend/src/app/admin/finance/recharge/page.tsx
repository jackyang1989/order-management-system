'use client';

import { useState } from 'react';

export default function AdminFinanceRechargePage() {
    const [records] = useState([
        { id: '1', username: '商家A', amount: 1000, channel: '支付宝', status: 1, createdAt: '2024-12-30 10:00' },
        { id: '2', username: '商家B', amount: 500, channel: '微信', status: 1, createdAt: '2024-12-30 09:30' },
        { id: '3', username: '商家C', amount: 2000, channel: '银行卡', status: 0, createdAt: '2024-12-29 15:00' },
    ]);

    const statusLabels: Record<number, { text: string; color: string }> = {
        0: { text: '待确认', color: '#faad14' },
        1: { text: '已完成', color: '#52c41a' },
        2: { text: '已取消', color: '#ff4d4f' },
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>充值记录</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>渠道</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.username}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{r.amount.toFixed(2)}</td>
                                <td style={{ padding: '14px 16px', color: '#666' }}>{r.channel}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: statusLabels[r.status]?.color + '20', color: statusLabels[r.status]?.color }}>
                                        {statusLabels[r.status]?.text}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{r.createdAt}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
