'use client';

import { useState } from 'react';

export default function AdminFinanceBankPage() {
    const [cards] = useState([
        { id: '1', username: '用户A', bankName: '中国银行', cardNumber: '****1234', holderName: '张三', status: 0, createdAt: '2024-12-30' },
        { id: '2', username: '商家B', bankName: '工商银行', cardNumber: '****5678', holderName: '李四', status: 1, createdAt: '2024-12-29' },
    ]);

    const statusLabels: Record<number, { text: string; color: string }> = {
        0: { text: '待审核', color: '#faad14' },
        1: { text: '已通过', color: '#52c41a' },
        2: { text: '已拒绝', color: '#ff4d4f' },
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>银行卡审核</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>银行</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>卡号</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>持卡人</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提交时间</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cards.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{c.username}</td>
                                <td style={{ padding: '14px 16px', color: '#666' }}>{c.bankName}</td>
                                <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>{c.cardNumber}</td>
                                <td style={{ padding: '14px 16px' }}>{c.holderName}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: statusLabels[c.status]?.color + '20', color: statusLabels[c.status]?.color }}>
                                        {statusLabels[c.status]?.text}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{c.createdAt}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {c.status === 0 && (
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
