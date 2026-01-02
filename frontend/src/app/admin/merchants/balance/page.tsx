'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface BalanceRecord {
    id: string;
    userId: string;
    username: string;
    userType: number;
    moneyType: number;
    changeType: string;
    amount: number;
    beforeBalance: number;
    afterBalance: number;
    remark: string;
    orderId: string;
    taskId: string;
    createdAt: string;
}

const changeTypeLabels: Record<string, string> = {
    'TASK_COMMISSION': '任务佣金',
    'WITHDRAW': '提现',
    'RECHARGE': '充值',
    'ADMIN_ADD': '管理员充值',
    'ADMIN_DEDUCT': '管理员扣款',
    'ORDER_FROZEN': '订单冻结',
    'ORDER_UNFROZEN': '订单解冻',
    'ORDER_REFUND': '订单退款',
    'REFERRAL_REWARD': '推荐奖励',
    'VIP_PURCHASE': 'VIP购买',
    'TASK_PUBLISH': '发布任务',
    'TASK_CANCEL': '任务取消退款',
    'SERVICE_FEE': '服务费',
    'DEPOSIT': '押金',
};

const moneyTypeLabels: Record<number, { text: string; color: string }> = {
    1: { text: '本金', color: '#52c41a' },
    2: { text: '银锭', color: '#1890ff' },
};

export default function AdminMerchantsBalancePage() {
    const [records, setRecords] = useState<BalanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [moneyTypeFilter, setMoneyTypeFilter] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRecords();
    }, [page, moneyTypeFilter]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/finance-records/admin/all?page=${page}&limit=20&userType=2`;
            if (moneyTypeFilter) url += `&moneyType=${moneyTypeFilter}`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;

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

    const handleSearch = () => {
        setPage(1);
        loadRecords();
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>商家余额记录</span>
                    <span style={{ color: '#666' }}>共 {total} 条记录</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="搜索商家名..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{ width: '200px', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                    <select
                        value={moneyTypeFilter || ''}
                        onChange={e => { setMoneyTypeFilter(e.target.value ? parseInt(e.target.value) : undefined); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="">全部类型</option>
                        <option value="1">本金</option>
                        <option value="2">银锭</option>
                    </select>
                    <button onClick={handleSearch} style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>搜索</button>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : records.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无记录</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>商家</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>账户</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>变动金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>变动前</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>变动后</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>备注</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{r.username || '-'}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{changeTypeLabels[r.changeType] || r.changeType}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (moneyTypeLabels[r.moneyType]?.color || '#999') + '20', color: moneyTypeLabels[r.moneyType]?.color || '#999' }}>
                                                {moneyTypeLabels[r.moneyType]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: Number(r.amount) > 0 ? '#52c41a' : '#ff4d4f', fontWeight: '500' }}>
                                            {Number(r.amount) > 0 ? '+' : ''}{Number(r.amount).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#999' }}>{Number(r.beforeBalance || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000' }}>{Number(r.afterBalance || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remark || '-'}</td>
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
