'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Withdrawal {
    id: string;
    userId: string;
    amount: number;
    fee: number;
    actualAmount: number;
    bankName: string;
    cardNumber: string;
    holderName: string;
    status: string;
    remark: string;
    createdAt: string;
}

const statusLabels: Record<string, { text: string; color: string }> = {
    PENDING: { text: '待审核', color: '#faad14' },
    APPROVED: { text: '已通过', color: '#52c41a' },
    REJECTED: { text: '已拒绝', color: '#ff4d4f' },
    COMPLETED: { text: '已完成', color: '#8c8c8c' },
};

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDING');
    const [reviewing, setReviewing] = useState<string | null>(null);

    useEffect(() => {
        loadWithdrawals();
    }, [filter]);

    const loadWithdrawals = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        setLoading(true);
        try {
            const url = filter ? `${BASE_URL}/admin/withdrawals?status=${filter}` : `${BASE_URL}/admin/withdrawals`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setWithdrawals(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, approved: boolean) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        const remark = approved ? '' : prompt('请输入拒绝原因：') || '';
        setReviewing(id);
        try {
            const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ approved, remark })
            });
            const json = await res.json();
            if (json.success) { alert(approved ? '提现已通过' : '提现已拒绝'); loadWithdrawals(); }
        } catch (e) {
            alert('操作失败');
        } finally {
            setReviewing(null);
        }
    };

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>状态筛选：</span>
                {Object.entries(statusLabels).map(([key, val]) => (
                    <button key={key} onClick={() => setFilter(key)} style={{ padding: '6px 16px', borderRadius: '4px', border: filter === key ? '1px solid #1890ff' : '1px solid #d9d9d9', background: filter === key ? '#e6f7ff' : '#fff', color: filter === key ? '#1890ff' : '#666', cursor: 'pointer' }}>
                        {val.text}
                    </button>
                ))}
            </div>

            {/* 提现列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : withdrawals.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无提现记录</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提现金额</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>到账金额</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>银行卡</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>持卡人</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>申请时间</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.map(w => (
                                <tr key={w.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>¥{Number(w.amount).toFixed(2)}</td>
                                    <td style={{ padding: '14px 16px', color: '#52c41a', fontWeight: '500' }}>¥{Number(w.actualAmount).toFixed(2)}</td>
                                    <td style={{ padding: '14px 16px', color: '#000', fontSize: '13px' }}>
                                        {w.bankName}<br /><span style={{ color: '#999' }}>{w.cardNumber}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#666' }}>{w.holderName}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[w.status]?.color || '#999') + '20', color: statusLabels[w.status]?.color || '#999' }}>
                                            {statusLabels[w.status]?.text || w.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>{new Date(w.createdAt).toLocaleString('zh-CN')}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        {w.status === 'PENDING' ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button onClick={() => handleApprove(w.id, true)} disabled={reviewing === w.id} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>通过</button>
                                                <button onClick={() => handleApprove(w.id, false)} disabled={reviewing === w.id} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '13px' }}>拒绝</button>
                                            </div>
                                        ) : (
                                            <button style={{ padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', color: '#666', cursor: 'pointer' }}>查看</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
