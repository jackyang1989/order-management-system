'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================

// ========================

// 本金记录
interface PrincipalRecord {
    id: string;
    type: string;           // 类型描述
    money: number;          // 金额
    balance: number;        // 余额
    create_time: string;    // 创建时间
    remark: string;         // 备注
}

// 银锭记录
interface SilverRecord {
    id: string;
    type: string;           // 类型描述
    reward: number;         // 银锭数量
    balance: number;        // 余额
    create_time: string;    // 创建时间
    remark: string;         // 备注
}

// 提现记录
interface WithdrawRecord {
    id: string;
    type: number;           // 1=本金提现, 2=银锭提现
    money: number;          // 提现金额
    state: number;          // 0=待审核, 1=已通过, 2=已拒绝
    state_text: string;     // 状态文本
    bank_name: string;      // 银行名称
    bank_card: string;      // 银行卡号
    create_time: string;    // 创建时间
    remark: string;         // 备注
}

function RecordsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'principal';

    // 三种独立记录 Tab
    const [activeTab, setActiveTab] = useState<'principal' | 'silver' | 'withdraw'>(
        initialType as 'principal' | 'silver' | 'withdraw'
    );

    // 独立的记录列表和分页
    const [principalRecords, setPrincipalRecords] = useState<PrincipalRecord[]>([]);
    const [silverRecords, setSilverRecords] = useState<SilverRecord[]>([]);
    const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([]);

    const [principalPage, setPrincipalPage] = useState(1);
    const [silverPage, setSilverPage] = useState(1);
    const [withdrawPage, setWithdrawPage] = useState(1);

    const [principalTotal, setPrincipalTotal] = useState(0);
    const [silverTotal, setSilverTotal] = useState(0);
    const [withdrawTotal, setWithdrawTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ principal: 0, silver: 0 });

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [activeTab]);

    // 加载余额信息
    const loadBalance = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/index`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.code === 1) {
                setBalance({
                    principal: data.data?.balance || 0,
                    silver: data.data?.reward || 0
                });
            }
        } catch (error) {
            console.error('Load balance error:', error);
        }
    };

    // 根据当前 Tab 加载对应数据
    const loadData = async () => {
        setLoading(true);
        await loadBalance();

        if (activeTab === 'principal') {
            await loadPrincipalRecords();
        } else if (activeTab === 'silver') {
            await loadSilverRecords();
        } else if (activeTab === 'withdraw') {
            await loadWithdrawRecords();
        }

        setLoading(false);
    };

    // ========================

    // ========================
    const loadPrincipalRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/benjinlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ page: principalPage })
            });
            const data = await res.json();
            if (data.code === 1) {
                setPrincipalRecords(data.data?.list || []);
                setPrincipalTotal(data.data?.total || 0);
            }
        } catch (error) {
            console.error('Load principal records error:', error);
        }
    };

    // ========================

    // ========================
    const loadSilverRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/yindinglist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ page: silverPage })
            });
            const data = await res.json();
            if (data.code === 1) {
                setSilverRecords(data.data?.list || []);
                setSilverTotal(data.data?.total || 0);
            }
        } catch (error) {
            console.error('Load silver records error:', error);
        }
    };

    // ========================

    // ========================
    const loadWithdrawRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/tixianlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ page: withdrawPage })
            });
            const data = await res.json();
            if (data.code === 1) {
                setWithdrawRecords(data.data?.list || []);
                setWithdrawTotal(data.data?.total || 0);
            }
        } catch (error) {
            console.error('Load withdraw records error:', error);
        }
    };

    // 切换 Tab
    const switchTab = (tab: 'principal' | 'silver' | 'withdraw') => {
        setActiveTab(tab);
    };

    // 获取状态颜色
    const getStateColor = (state: number) => {
        switch (state) {
            case 0: return '#ff9500'; // 待审核
            case 1: return '#67c23a'; // 已通过
            case 2: return '#f56c6c'; // 已拒绝
            default: return '#999';
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '20px' }}>
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>资金记录</div>
                    <div style={{ width: '24px' }}></div>
                </div>

                {/* 余额展示 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                            ¥{balance.principal}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>可用本金</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffd700', marginBottom: '4px' }}>
                            {balance.silver}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>可用银锭</div>
                    </div>
                </div>
            </div>

            {/* Tab Switch - 三种独立记录 */}
            <div style={{
                display: 'flex',
                background: '#fff',
                borderBottom: '1px solid #e5e5e5'
            }}>
                {[
                    { key: 'principal', label: '本金记录' },
                    { key: 'silver', label: '银锭记录' },
                    { key: 'withdraw', label: '提现记录' },
                ].map(tab => (
                    <div
                        key={tab.key}
                        onClick={() => switchTab(tab.key as 'principal' | 'silver' | 'withdraw')}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '14px 0',
                            fontSize: '14px',
                            color: activeTab === tab.key ? '#409eff' : '#666',
                            borderBottom: activeTab === tab.key ? '2px solid #409eff' : 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab.key ? '600' : 'normal'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* Records List */}
            <div style={{ marginTop: '10px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999', background: '#fff' }}>
                        加载中...
                    </div>
                ) : (
                    <>
                        {/* 本金记录列表 */}
                        {activeTab === 'principal' && (
                            <div style={{ background: '#fff' }}>
                                {principalRecords.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>💰</div>
                                        <div style={{ fontSize: '14px' }}>暂无本金记录</div>
                                    </div>
                                ) : (
                                    principalRecords.map((record, index) => (
                                        <div
                                            key={record.id}
                                            style={{
                                                padding: '15px',
                                                borderBottom: index < principalRecords.length - 1 ? '1px solid #f5f5f5' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                                    {record.type}
                                                </div>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: record.money >= 0 ? '#67c23a' : '#f56c6c'
                                                }}>
                                                    {record.money >= 0 ? '+' : ''}{record.money}元
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                                                <span>{record.create_time}</span>
                                                <span>余额: ¥{record.balance}</span>
                                            </div>
                                            {record.remark && (
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                                                    备注: {record.remark}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {principalTotal > 10 && (
                                    <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                                        共 {principalTotal} 条记录
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 银锭记录列表 */}
                        {activeTab === 'silver' && (
                            <div style={{ background: '#fff' }}>
                                {silverRecords.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>🥇</div>
                                        <div style={{ fontSize: '14px' }}>暂无银锭记录</div>
                                    </div>
                                ) : (
                                    silverRecords.map((record, index) => (
                                        <div
                                            key={record.id}
                                            style={{
                                                padding: '15px',
                                                borderBottom: index < silverRecords.length - 1 ? '1px solid #f5f5f5' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                                    {record.type}
                                                </div>
                                                <div style={{
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: record.reward >= 0 ? '#ffd700' : '#f56c6c'
                                                }}>
                                                    {record.reward >= 0 ? '+' : ''}{record.reward}银锭
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                                                <span>{record.create_time}</span>
                                                <span>余额: {record.balance}银锭</span>
                                            </div>
                                            {record.remark && (
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                                                    备注: {record.remark}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {silverTotal > 10 && (
                                    <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                                        共 {silverTotal} 条记录
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 提现记录列表 */}
                        {activeTab === 'withdraw' && (
                            <div style={{ background: '#fff' }}>
                                {withdrawRecords.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>💳</div>
                                        <div style={{ fontSize: '14px' }}>暂无提现记录</div>
                                    </div>
                                ) : (
                                    withdrawRecords.map((record, index) => (
                                        <div
                                            key={record.id}
                                            style={{
                                                padding: '15px',
                                                borderBottom: index < withdrawRecords.length - 1 ? '1px solid #f5f5f5' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                                    {record.type === 1 ? '本金提现' : '银锭提现'}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    color: getStateColor(record.state),
                                                    padding: '2px 8px',
                                                    background: `${getStateColor(record.state)}15`,
                                                    borderRadius: '10px'
                                                }}>
                                                    {record.state_text}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f56c6c', marginBottom: '8px' }}>
                                                -¥{record.money}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                                                提现至: {record.bank_name} {record.bank_card}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {record.create_time}
                                            </div>
                                            {record.remark && (
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                                                    备注: {record.remark}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {withdrawTotal > 10 && (
                                    <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                                        共 {withdrawTotal} 条记录
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Tips */}
            <div style={{ padding: '15px', fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>说明：</div>
                {activeTab === 'principal' && (
                    <>
                        <div>• 本金为订单垫付后返还的金额</div>
                        <div>• 本金可随时申请提现至绑定银行卡</div>
                        <div>• 提现到账时间为1-3个工作日</div>
                    </>
                )}
                {activeTab === 'silver' && (
                    <>
                        <div>• 银锭是平台的虚拟货币，1银锭=1元</div>
                        <div>• 银锭可通过完成任务、邀请好友获得</div>
                        <div>• 银锭提现将收取5%手续费</div>
                    </>
                )}
                {activeTab === 'withdraw' && (
                    <>
                        <div>• 提现申请将在1-3个工作日内审核处理</div>
                        <div>• 请确保银行卡信息正确，以免提现失败</div>
                        <div>• 如有疑问请联系客服</div>
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
