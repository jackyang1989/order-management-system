'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface TransactionRecord {
    id: string;
    type: 'deposit' | 'withdraw' | 'freeze' | 'unfreeze' | 'deduct';
    amount: number;
    balanceType: 'balance' | 'silver';
    memo: string;
    createdAt: string;
}

interface WalletStats {
    balance: number;
    frozenBalance: number;
    silver: number;
}

// Mock transaction data
const mockTransactions: TransactionRecord[] = [
    { id: '1', type: 'deposit', amount: 5000, balanceType: 'balance', memo: '支付宝充值', createdAt: '2024-12-30T10:30:00' },
    { id: '2', type: 'freeze', amount: -1280, balanceType: 'balance', memo: '发布任务冻结 [T202412300001]', createdAt: '2024-12-30T11:15:00' },
    { id: '3', type: 'deduct', amount: -50, balanceType: 'silver', memo: '发布任务佣金 [T202412300001]', createdAt: '2024-12-30T11:15:00' },
    { id: '4', type: 'deposit', amount: 1000, balanceType: 'silver', memo: '银锭充值', createdAt: '2024-12-29T15:00:00' },
    { id: '5', type: 'unfreeze', amount: 128, balanceType: 'balance', memo: '订单完成返还 [O202412300032]', createdAt: '2024-12-30T14:00:00' },
];

export default function MerchantWalletPage() {
    const [stats, setStats] = useState<WalletStats>({ balance: 0, frozenBalance: 0, silver: 0 });
    const [transactions] = useState<TransactionRecord[]>(mockTransactions);
    const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'silver'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats({
                    balance: json.data.balance || 0,
                    frozenBalance: json.data.frozenBalance || 0,
                    silver: json.data.silver || 0
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (activeTab === 'all') return true;
        return t.balanceType === activeTab;
    });

    const typeLabels: Record<string, { text: string; color: string }> = {
        deposit: { text: '充值', color: '#10b981' },
        withdraw: { text: '提现', color: '#ef4444' },
        freeze: { text: '冻结', color: '#f59e0b' },
        unfreeze: { text: '解冻', color: '#3b82f6' },
        deduct: { text: '扣款', color: '#ef4444' },
    };

    return (
        <div>
            {/* Balance Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                {/* Available Balance */}
                <div style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>可用余额</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
                        ¥{Number(stats.balance).toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            充值
                        </button>
                        <button style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}>
                            提现
                        </button>
                    </div>
                </div>

                {/* Frozen Balance */}
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>冻结金额</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
                        ¥{Number(stats.frozenBalance).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        用于发布中的任务押金
                    </div>
                </div>

                {/* Silver */}
                <div style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>银锭余额</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
                        {Number(stats.silver).toFixed(2)}
                    </div>
                    <button style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        充值银锭
                    </button>
                </div>
            </div>

            {/* Transaction History */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>资金流水</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['all', 'balance', 'silver'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: activeTab === tab ? '#4f46e5' : '#f3f4f6',
                                    color: activeTab === tab ? '#fff' : '#374151',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                {tab === 'all' ? '全部' : tab === 'balance' ? '余额' : '银锭'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>加载中...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>暂无记录</div>
                ) : (
                    <div>
                        {filteredTransactions.map((tx, idx) => (
                            <div
                                key={tx.id}
                                style={{
                                    padding: '16px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: idx < filteredTransactions.length - 1 ? '1px solid #f3f4f6' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: typeLabels[tx.type]?.color + '15',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px'
                                    }}>
                                        {tx.type === 'deposit' ? '💰' : tx.type === 'withdraw' ? '💸' : tx.type === 'freeze' ? '🔒' : tx.type === 'unfreeze' ? '🔓' : '📤'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                                            {tx.memo}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                            {new Date(tx.createdAt).toLocaleString('zh-CN')} · {tx.balanceType === 'balance' ? '余额' : '银锭'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: tx.amount > 0 ? '#10b981' : '#ef4444'
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{tx.balanceType === 'balance' ? '¥' : ''}{tx.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
