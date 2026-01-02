'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface VipRecord {
    id: string;
    userId: string;
    username: string;
    userType: number;
    vipLevel: number;
    days: number;
    price: number;
    expireAt: string;
    sourceType: string;
    operatorId: string;
    remark: string;
    createdAt: string;
}

const userTypeLabels: Record<number, { text: string; color: string }> = {
    1: { text: '买手', color: '#1890ff' },
    2: { text: '商家', color: '#722ed1' },
};

const sourceTypeLabels: Record<string, string> = {
    'PURCHASE': '购买',
    'ADMIN_SET': '管理员设置',
    'GIFT': '赠送',
    'ACTIVITY': '活动奖励',
};

export default function AdminFinanceVipPage() {
    const [records, setRecords] = useState<VipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [userTypeFilter, setUserTypeFilter] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadRecords();
    }, [page, userTypeFilter]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/vip/admin/records?page=${page}&limit=20`;
            if (userTypeFilter) url += `&userType=${userTypeFilter}`;

            const res = await fetch(url, {
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
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>会员记录</span>
                    <span style={{ color: '#666' }}>共 {total} 条记录</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={userTypeFilter || ''}
                        onChange={e => { setUserTypeFilter(e.target.value ? parseInt(e.target.value) : undefined); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="">全部用户类型</option>
                        <option value="1">买手</option>
                        <option value="2">商家</option>
                    </select>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : records.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无会员记录</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户类型</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>VIP等级</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>天数</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>来源</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>到期时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.username || r.userId.slice(0, 8)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (userTypeLabels[r.userType]?.color || '#999') + '20', color: userTypeLabels[r.userType]?.color || '#999' }}>
                                                {userTypeLabels[r.userType]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#722ed120', color: '#722ed1' }}>VIP{r.vipLevel}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center', color: '#666' }}>{r.days}天</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(r.price || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{sourceTypeLabels[r.sourceType] || r.sourceType}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{r.expireAt ? new Date(r.expireAt).toLocaleDateString('zh-CN') : '-'}</td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={records.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: records.length < 20 ? 'not-allowed' : 'pointer', opacity: records.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
