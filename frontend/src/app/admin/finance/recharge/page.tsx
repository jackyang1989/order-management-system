'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface RechargeRecord {
    id: string;
    userId: string;
    userType: string;
    amount: number;
    payType: string;
    status: number;
    orderNumber: string;
    tradeNo: string;
    createdAt: string;
    paidAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待支付', color: '#faad14' },
    1: { text: '已完成', color: '#52c41a' },
    2: { text: '已取消', color: '#ff4d4f' },
};

const userTypeLabels: Record<string, string> = {
    buyer: '买手',
    merchant: '商家',
};

export default function AdminFinanceRechargePage() {
    const [records, setRecords] = useState<RechargeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadRecords();
    }, [page]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/recharge/admin/records?page=${page}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setRecords(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>充值记录</span>
                <span style={{ color: '#999' }}>共 {total} 条记录</span>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : records.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无充值记录</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>订单号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户类型</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>支付方式</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{r.orderNumber}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{userTypeLabels[r.userType] || r.userType}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(r.amount).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{r.payType}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[r.status]?.color || '#999') + '20', color: statusLabels[r.status]?.color || '#999' }}>
                                                {statusLabels[r.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{new Date(r.createdAt).toLocaleString('zh-CN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                            >
                                上一页
                            </button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={records.length < 20}
                                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: records.length < 20 ? 'not-allowed' : 'pointer', opacity: records.length < 20 ? 0.5 : 1 }}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
