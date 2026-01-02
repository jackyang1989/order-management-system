'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Merchant {
    id: string;
    username: string;
    phone: string;
    companyName: string;
    balance: number;
    frozenBalance: number;
    silver: number;
    status: number;
    createdAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: '#faad14' },
    1: { text: '已通过', color: '#52c41a' },
    2: { text: '已拒绝', color: '#ff4d4f' },
};

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [reviewing, setReviewing] = useState<string | null>(null);

    useEffect(() => {
        loadMerchants();
    }, [filter]);

    const loadMerchants = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            const url = filter !== undefined
                ? `${BASE_URL}/admin/merchants?status=${filter}`
                : `${BASE_URL}/admin/merchants`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setMerchants(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, approved: boolean) => {
        const token = localStorage.getItem('adminToken');
        setReviewing(id);
        try {
            const res = await fetch(`${BASE_URL}/admin/merchants/${id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approved })
            });
            const json = await res.json();
            if (json.success) {
                alert(approved ? '商家已通过审核' : '商家已被拒绝');
                loadMerchants();
            }
        } catch (e) {
            alert('操作失败');
        } finally {
            setReviewing(null);
        }
    };

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <span style={{ color: '#666' }}>状态筛选：</span>
                {[
                    { label: '全部', value: undefined },
                    { label: '待审核', value: 0 },
                    { label: '已通过', value: 1 },
                    { label: '已拒绝', value: 2 },
                ].map(item => (
                    <button
                        key={String(item.value)}
                        onClick={() => setFilter(item.value)}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '4px',
                            border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9',
                            background: filter === item.value ? '#e6f7ff' : '#fff',
                            color: filter === item.value ? '#1890ff' : '#666',
                            cursor: 'pointer'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 商家列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : merchants.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无商家</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户名</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>公司名称</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>手机号</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>余额</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>冻结金额</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>银锭</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>注册时间</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {merchants.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{m.username}</td>
                                    <td style={{ padding: '14px 16px', color: '#000' }}>{m.companyName || '-'}</td>
                                    <td style={{ padding: '14px 16px', color: '#666' }}>{m.phone}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(m.balance || 0).toFixed(2)}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#faad14' }}>¥{Number(m.frozenBalance || 0).toFixed(2)}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#722ed1' }}>{Number(m.silver || 0).toFixed(0)}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            background: (statusLabels[m.status]?.color || '#999') + '20',
                                            color: statusLabels[m.status]?.color || '#999'
                                        }}>
                                            {statusLabels[m.status]?.text || '未知'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>{new Date(m.createdAt).toLocaleDateString('zh-CN')}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        {m.status === 0 ? (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button onClick={() => handleApprove(m.id, true)} disabled={reviewing === m.id} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>通过</button>
                                                <button onClick={() => handleApprove(m.id, false)} disabled={reviewing === m.id} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '13px' }}>拒绝</button>
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
