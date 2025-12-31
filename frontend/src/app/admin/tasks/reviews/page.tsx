'use client';

import { useState } from 'react';

export default function AdminTasksReviewsPage() {
    const [tasks] = useState([
        { id: '1', orderNumber: 'ORD001', buyerAccount: 'tb_user123', content: '商品很好用', status: 1, createdAt: '2024-12-30' },
        { id: '2', orderNumber: 'ORD002', buyerAccount: 'jd_buyer456', content: '物流很快', status: 0, createdAt: '2024-12-29' },
    ]);

    const statusLabels: Record<number, { text: string; color: string }> = {
        0: { text: '待审核', color: '#faad14' },
        1: { text: '已通过', color: '#52c41a' },
        2: { text: '已驳回', color: '#ff4d4f' },
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>追评任务审核</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>订单编号</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>买号</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>追评内容</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提交时间</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#666' }}>{t.orderNumber}</td>
                                <td style={{ padding: '14px 16px', color: '#1890ff' }}>{t.buyerAccount}</td>
                                <td style={{ padding: '14px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.content}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: statusLabels[t.status]?.color + '20', color: statusLabels[t.status]?.color }}>
                                        {statusLabels[t.status]?.text}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{t.createdAt}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <button style={{ padding: '4px 12px', border: '1px solid #1890ff', borderRadius: '4px', background: '#fff', color: '#1890ff', cursor: 'pointer' }}>查看</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
