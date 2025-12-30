'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../../../services/authService';
import {
    fetchBankCards,
    fetchWithdrawals,
    createWithdrawal,
    BankCard,
    Withdrawal
} from '../../../services/userService';

export default function WithdrawPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'principal' | 'silver' | 'records'>('principal');

    // 余额信息
    const [balance, setBalance] = useState({
        principal: 0,
        silver: 0,
        frozenSilver: 0
    });

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [payPassword, setPayPassword] = useState('');
    const [records, setRecords] = useState<Withdrawal[]>([]);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 费率设置
    const feeRate = 0.05; // 5% 手续费（银锭提现）
    const minWithdraw = 10; // 最低提现金额

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            // 获取用户信息
            const user = getCurrentUser();
            if (user) {
                setBalance({
                    principal: Number(user.balance) || 0,
                    silver: Number(user.silver) || 0,
                    frozenSilver: Number(user.frozenSilver) || 0
                });
            }

            // 获取银行卡
            const cards = await fetchBankCards();
            setBankCards(cards);
            // 默认选择第一张卡
            if (cards.length > 0) {
                const defaultCard = cards.find(c => c.isDefault) || cards[0];
                setSelectedCard(defaultCard.id);
            }

            // 获取提现记录
            const withdrawals = await fetchWithdrawals();
            setRecords(withdrawals);
        } catch (error) {
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAvailableBalance = () => {
        return activeTab === 'principal' ? balance.principal : (balance.silver - balance.frozenSilver);
    };

    const calculateFee = () => {
        const amount = parseFloat(withdrawAmount) || 0;
        if (activeTab === 'principal') return 0; // 本金提现无手续费
        return amount * feeRate;
    };

    const calculateActual = () => {
        const amount = parseFloat(withdrawAmount) || 0;
        return amount - calculateFee();
    };

    const handleWithdraw = () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount < minWithdraw) {
            alert(`最低提现金额 ${minWithdraw} 元`);
            return;
        }
        if (amount > getAvailableBalance()) {
            alert('提现金额超过可用余额');
            return;
        }
        if (bankCards.length === 0) {
            alert('请先绑定收款账户');
            router.push('/profile/payment');
            return;
        }
        if (!selectedCard) {
            alert('请选择收款银行卡');
            return;
        }
        setShowConfirm(true);
    };

    const confirmWithdraw = async () => {
        if (payPassword.length !== 6) {
            alert('请输入6位支付密码');
            return;
        }
        setSubmitting(true);
        try {
            const result = await createWithdrawal({
                amount: parseFloat(withdrawAmount),
                type: activeTab === 'principal' ? 1 : 2,
                bankCardId: selectedCard
            });

            if (result.success) {
                alert(result.message || '提现申请已提交，预计1-3个工作日到账');
                setWithdrawAmount('');
                setPayPassword('');
                setShowConfirm(false);
                // 刷新提现记录
                const withdrawals = await fetchWithdrawals();
                setRecords(withdrawals);
            } else {
                alert(result.message || '提现失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusText = (status: number | string) => {
        if (status === 0 || status === 'PENDING') return { text: '处理中', color: '#e6a23c' };
        if (status === 1 || status === 'APPROVED') return { text: '已通过', color: '#409eff' };
        if (status === 2 || status === 'REJECTED') return { text: '已拒绝', color: '#f56c6c' };
        if (status === 3 || status === 'COMPLETED' || status === 'SUCCESS') return { text: '已到账', color: '#67c23a' };
        return { text: '未知', color: '#999' };
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }


    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
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
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>资金提现</div>
            </div>

            {/* 余额展示 */}
            <div style={{
                background: '#409eff',
                padding: '20px 15px 30px',
                color: '#fff'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>¥{balance.principal.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>可提现本金</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{balance.silver - balance.frozenSilver}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>可提现银锭</div>
                    </div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                {[
                    { key: 'principal', label: '本金提现' },
                    { key: 'silver', label: '银锭提现' },
                    { key: 'records', label: '提现记录' }
                ].map(tab => (
                    <div
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key as 'principal' | 'silver' | 'records'); setWithdrawAmount(''); }}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px 0',
                            fontSize: '14px',
                            color: activeTab === tab.key ? '#409eff' : '#666',
                            position: 'relative'
                        }}
                    >
                        {tab.label}
                        {activeTab === tab.key && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#409eff' }}></div>}
                    </div>
                ))}
            </div>

            {/* 本金/银锭提现表单 */}
            {(activeTab === 'principal' || activeTab === 'silver') && (
                <div>
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            可提现{activeTab === 'principal' ? '本金' : '银锭'}：
                            <span style={{ color: '#409eff', fontWeight: 'bold', marginLeft: '5px' }}>
                                {activeTab === 'principal' ? `¥${balance.principal.toFixed(2)}` : `${balance.silver - balance.frozenSilver}银锭`}
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '10px 15px'
                        }}>
                            <span style={{ fontSize: '20px', color: '#333', marginRight: '10px' }}>¥</span>
                            <input
                                type="number"
                                placeholder="请输入提现金额"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    outline: 'none'
                                }}
                            />
                            <span
                                onClick={() => setWithdrawAmount(getAvailableBalance().toString())}
                                style={{ color: '#409eff', fontSize: '14px', cursor: 'pointer' }}
                            >
                                全部提现
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                            最低提现金额：¥{minWithdraw}
                        </div>
                    </div>

                    {/* 费用明细 */}
                    {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                        <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>费用明细</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                <span>提现金额</span>
                                <span>¥{parseFloat(withdrawAmount).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                <span>手续费 ({activeTab === 'principal' ? '0%' : `${feeRate * 100}%`})</span>
                                <span>-¥{calculateFee().toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#333', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px dashed #e5e5e5' }}>
                                <span>实际到账</span>
                                <span style={{ color: '#67c23a' }}>¥{calculateActual().toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* 收款账户选择 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                            收款账户
                            <span
                                onClick={() => router.push('/profile/payment')}
                                style={{ float: 'right', fontSize: '12px', color: '#409eff', fontWeight: 'normal', cursor: 'pointer' }}
                            >
                                管理账户 &gt;
                            </span>
                        </div>
                        {bankCards.length === 0 ? (
                            <div
                                onClick={() => router.push('/profile/payment')}
                                style={{
                                    padding: '15px',
                                    border: '1px dashed #ddd',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    color: '#999',
                                    cursor: 'pointer'
                                }}
                            >
                                + 请先绑定收款账户
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {bankCards.map(card => (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedCard(card.id)}
                                        style={{
                                            padding: '12px',
                                            border: selectedCard === card.id ? '2px solid #409eff' : '1px solid #e5e5e5',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: selectedCard === card.id ? '#f0f7ff' : '#fff'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: '#409eff',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}>
                                            {card.bankName.substring(0, 2)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                                {card.bankName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {card.cardNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1 **** **** $3')}
                                            </div>
                                        </div>
                                        {selectedCard === card.id && (
                                            <div style={{ color: '#409eff', fontSize: '18px' }}>✓</div>
                                        )}
                                        {card.isDefault && (
                                            <span style={{
                                                fontSize: '10px',
                                                color: '#e6a23c',
                                                background: '#fdf6ec',
                                                padding: '2px 6px',
                                                borderRadius: '10px'
                                            }}>
                                                默认
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 提示信息 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                            <div>📌 提现将在1-3个工作日内到账</div>
                            <div>📌 请确保收款账户信息正确</div>
                            {activeTab === 'silver' && <div>📌 银锭提现收取{feeRate * 100}%手续费</div>}
                        </div>
                    </div>

                    {/* 底部按钮 */}
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxWidth: '540px',
                        margin: '0 auto',
                        padding: '10px 15px',
                        background: '#fff',
                        borderTop: '1px solid #e5e5e5'
                    }}>
                        <button
                            onClick={handleWithdraw}
                            style={{
                                width: '100%',
                                background: '#409eff',
                                border: 'none',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            申请提现
                        </button>
                    </div>
                </div>
            )}

            {/* 提现记录 */}
            {activeTab === 'records' && (
                <div style={{ background: '#fff', marginTop: '10px' }}>
                    {records.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
                            暂无提现记录
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                        {record.type === 1 ? '本金提现' : '银锭提现'}
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#409eff', fontWeight: 'bold' }}>
                                        -¥{Number(record.amount).toFixed(2)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>实际到账</span>
                                        <span>¥{Number(record.actualAmount).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>申请时间</span>
                                        <span>{new Date(record.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>状态</span>
                                        <span style={{ color: getStatusText(record.status).color, fontWeight: 'bold' }}>
                                            {getStatusText(record.status).text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 支付密码确认弹窗 */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '80%',
                        maxWidth: '300px',
                        padding: '20px'
                    }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>确认提现</div>
                        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '15px' }}>
                            提现金额：<span style={{ color: '#409eff', fontWeight: 'bold' }}>¥{parseFloat(withdrawAmount).toFixed(2)}</span>
                            <br />
                            实际到账：<span style={{ color: '#67c23a', fontWeight: 'bold' }}>¥{calculateActual().toFixed(2)}</span>
                        </div>
                        <input
                            type="password"
                            placeholder="请输入6位支付密码"
                            maxLength={6}
                            value={payPassword}
                            onChange={e => setPayPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                textAlign: 'center',
                                marginBottom: '15px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => { setShowConfirm(false); setPayPassword(''); }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    background: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmWithdraw}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    background: submitting ? '#ccc' : '#409eff',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
