'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../../../services/authService';
import { fetchFundRecords, FundRecord } from '../../../services/userService';

// Mock data for development
const mockRecords: FundRecord[] = [
    {
        id: '1',
        type: 'principal',
        action: 'in',
        amount: 99.00,
        balance: 99.00,
        description: '订单返款 - 任务单号 TASK20240115001',
        orderId: 'order_1',
        createdAt: '2024-01-15 14:30:00'
    },
    {
        id: '2',
        type: 'principal',
        action: 'out',
        amount: 50.00,
        balance: 49.00,
        description: '提现到工商银行 **** 1234',
        createdAt: '2024-01-16 10:00:00'
    },
    {
        id: '3',
        type: 'silver',
        action: 'in',
        amount: 15,
        balance: 115,
        description: '任务佣金 - 任务单号 TASK20240115001',
        orderId: 'order_1',
        createdAt: '2024-01-15 14:30:00'
    },
    {
        id: '4',
        type: 'silver',
        action: 'in',
        amount: 10,
        balance: 125,
        description: '邀请奖励 - 成功邀请用户 user123',
        createdAt: '2024-01-17 09:00:00'
    },
    {
        id: '5',
        type: 'silver',
        action: 'out',
        amount: 25,
        balance: 100,
        description: '提现到建设银行 **** 5678',
        createdAt: '2024-01-18 11:00:00'
    }
];

function RecordsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') as 'principal' | 'silver' | null;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'principal' | 'silver'>(initialType || 'principal');
    const [actionFilter, setActionFilter] = useState<'all' | 'in' | 'out'>('all');
    const [records, setRecords] = useState<FundRecord[]>([]);
    const [balance, setBalance] = useState({ principal: 0, silver: 0 });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        const user = getCurrentUser();
        if (user) {
            setBalance({
                principal: Number(user.balance) || 0,
                silver: Number(user.silver) || 0
            });
        }
        loadRecords();
    }, [activeTab, actionFilter, router]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            // Try API first, fallback to mock data
            const result = await fetchFundRecords({
                type: activeTab,
                action: actionFilter === 'all' ? undefined : actionFilter
            });

            if (result.list.length > 0) {
                setRecords(result.list);
            } else {
                // Use mock data filtered by type and action
                await new Promise(resolve => setTimeout(resolve, 300));
                let filtered = mockRecords.filter(r => r.type === activeTab);
                if (actionFilter !== 'all') {
                    filtered = filtered.filter(r => r.action === actionFilter);
                }
                setRecords(filtered);
            }
        } catch (error) {
            console.error('Load records error:', error);
            // Fallback to mock
            let filtered = mockRecords.filter(r => r.type === activeTab);
            if (actionFilter !== 'all') {
                filtered = filtered.filter(r => r.action === actionFilter);
            }
            setRecords(filtered);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (record: FundRecord) => {
        const prefix = record.action === 'in' ? '+' : '-';
        const unit = record.type === 'principal' ? '¥' : '';
        const suffix = record.type === 'silver' ? '银锭' : '';
        return `${prefix}${unit}${record.amount}${suffix}`;
    };

    const getActionColor = (action: 'in' | 'out') => {
        return action === 'in' ? '#67c23a' : '#f56c6c';
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '20px' }}>
            {/* Header */}
            <div style={{
                background: '#409eff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#fff' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>资金记录</div>
            </div>

            {/* Balance Display */}
            <div style={{
                background: '#409eff',
                padding: '15px 15px 25px',
                color: '#fff'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div
                        onClick={() => setActiveTab('principal')}
                        style={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            opacity: activeTab === 'principal' ? 1 : 0.7,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>¥{balance.principal.toFixed(2)}</div>
                        <div style={{ fontSize: '12px' }}>可用本金</div>
                    </div>
                    <div
                        onClick={() => setActiveTab('silver')}
                        style={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            opacity: activeTab === 'silver' ? 1 : 0.7,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '5px' }}>{balance.silver}</div>
                        <div style={{ fontSize: '12px' }}>可用银锭</div>
                    </div>
                </div>
            </div>

            {/* Tab Switch */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => { setActiveTab('principal'); setActionFilter('all'); }}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'principal' ? '#409eff' : '#666',
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                >
                    本金记录
                    {activeTab === 'principal' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '2px', background: '#409eff' }}></div>}
                </div>
                <div
                    onClick={() => { setActiveTab('silver'); setActionFilter('all'); }}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'silver' ? '#409eff' : '#666',
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                >
                    银锭记录
                    {activeTab === 'silver' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '2px', background: '#409eff' }}></div>}
                </div>
            </div>

            {/* Action Filter */}
            <div style={{ display: 'flex', gap: '10px', padding: '10px 15px', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                {[
                    { key: 'all', label: '全部' },
                    { key: 'in', label: '收入' },
                    { key: 'out', label: '支出' }
                ].map(filter => (
                    <button
                        key={filter.key}
                        onClick={() => setActionFilter(filter.key as 'all' | 'in' | 'out')}
                        style={{
                            padding: '5px 15px',
                            border: actionFilter === filter.key ? 'none' : '1px solid #ddd',
                            borderRadius: '15px',
                            background: actionFilter === filter.key ? '#409eff' : '#fff',
                            color: actionFilter === filter.key ? '#fff' : '#666',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Records List */}
            <div style={{ background: '#fff', marginTop: '10px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</div>
                ) : records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>
                            {activeTab === 'principal' ? '💰' : '🪙'}
                        </div>
                        <div style={{ fontSize: '14px' }}>暂无{activeTab === 'principal' ? '本金' : '银锭'}记录</div>
                    </div>
                ) : (
                    records.map((record, index) => (
                        <div
                            key={record.id}
                            style={{
                                padding: '15px',
                                borderBottom: index < records.length - 1 ? '1px solid #f5f5f5' : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ flex: 1, paddingRight: '10px' }}>
                                    <div style={{ fontSize: '14px', color: '#333', marginBottom: '4px', lineHeight: '1.4' }}>
                                        {record.description}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {record.createdAt}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: getActionColor(record.action),
                                        marginBottom: '4px'
                                    }}>
                                        {formatAmount(record)}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#999' }}>
                                        余额: {activeTab === 'principal' ? `¥${record.balance.toFixed(2)}` : `${record.balance}银锭`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Tips */}
            <div style={{ padding: '15px', fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>说明：</div>
                {activeTab === 'principal' ? (
                    <>
                        <div>• 本金为订单垫付后返还的金额</div>
                        <div>• 本金可随时申请提现至绑定银行卡</div>
                        <div>• 提现到账时间为1-3个工作日</div>
                    </>
                ) : (
                    <>
                        <div>• 银锭是平台的虚拟货币，1银锭=1元</div>
                        <div>• 银锭可通过完成任务、邀请好友获得</div>
                        <div>• 银锭提现将收取5%手续费</div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function RecordsPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>}>
            <RecordsContent />
        </Suspense>
    );
}
