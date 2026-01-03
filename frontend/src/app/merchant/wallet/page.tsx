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

interface BankCard {
    id: string;
    bankName: string;
    cardNumber: string;
    accountName: string;
    isDefault: boolean;
    status: number; // 0: pending, 1: approved, 2: rejected
}

export default function MerchantWalletPage() {
    const [stats, setStats] = useState<WalletStats>({ balance: 0, frozenBalance: 0, silver: 0 });
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'silver'>('all');
    const [loading, setLoading] = useState(true);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedBankCardId, setSelectedBankCardId] = useState<string>('');

    useEffect(() => {
        loadStats();
        loadTransactions();
        loadBankCards();
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

    const loadTransactions = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/finance-records/merchant`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                const records = json.data.map((r: any) => ({
                    id: r.id,
                    type: r.amount > 0 ? 'deposit' : (r.type === 3 ? 'withdraw' : 'deduct'),
                    amount: r.amount,
                    balanceType: r.moneyType === 1 ? 'balance' : 'silver',
                    memo: r.memo || '财务记录',
                    createdAt: r.createdAt
                }));
                setTransactions(records);
            }
        } catch (e) {
            console.error('Failed to load transactions:', e);
        }
    };

    const loadBankCards = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setBankCards(json.data);
                const defaultCard = json.data.find((c: BankCard) => c.isDefault && c.status === 1);
                if (defaultCard) {
                    setSelectedBankCardId(defaultCard.id);
                } else if (json.data.length > 0) {
                    const approvedCard = json.data.find((c: BankCard) => c.status === 1);
                    if (approvedCard) {
                        setSelectedBankCardId(approvedCard.id);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load bank cards:', e);
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

    const [rechargeModal, setRechargeModal] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [silverModal, setSilverModal] = useState(false);
    const [step, setStep] = useState<'input' | 'payment'>('input');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentType, setPaymentType] = useState<'alipay' | 'balance'>('alipay');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const openRecharge = () => { setRechargeModal(true); setStep('input'); setAmount(''); setPaymentType('alipay'); };
    const openSilver = () => { setSilverModal(true); setStep('input'); setAmount(''); setPaymentType('alipay'); };
    const openWithdraw = () => { setWithdrawModal(true); setStep('input'); setAmount(''); };

    const closeModal = () => {
        setRechargeModal(false);
        setWithdrawModal(false);
        setSilverModal(false);
        setAmount('');
        setStep('input');
        setIsLoading(false);
        setQrCodeUrl('');
        setOrderNumber('');
    };

    // 创建充值订单
    const handleRecharge = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/recharge/merchant/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    rechargeType: 1, // 1: 押金/余额
                    paymentMethod: 1 // 1: 支付宝
                })
            });
            const json = await res.json();
            if (json.success) {
                setOrderNumber(json.data.orderNumber);
                // 生成支付二维码URL（实际项目中应该从后端返回真实的支付链接）
                setQrCodeUrl(json.payUrl || `/pay/alipay?orderNumber=${json.data.orderNumber}&amount=${amount}`);
                setStep('payment');
            } else {
                alert(json.message || '创建充值订单失败');
            }
        } catch (e) {
            console.error(e);
            alert('网络错误，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 确认支付完成（模拟回调）
    const confirmPayment = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !orderNumber) return;

        setIsLoading(true);
        try {
            // 调用支付回调接口（模拟支付成功）
            const res = await fetch(`${BASE_URL}/recharge/callback/alipay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderNumber,
                    tradeNo: `TRADE_${Date.now()}`,
                    success: true
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('充值成功！');
                closeModal();
                loadStats();
                loadTransactions();
            } else {
                alert(json.message || '支付确认失败');
            }
        } catch (e) {
            console.error(e);
            alert('网络错误，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 提现申请
    const handleWithdraw = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');
        if (Number(amount) < 100) return alert('最低提现金额为100元');
        if (Number(amount) > stats.balance) return alert('余额不足');

        const approvedCards = bankCards.filter(c => c.status === 1);
        if (approvedCards.length === 0) {
            return alert('请先添加并等待银行卡审核通过');
        }
        if (!selectedBankCardId) {
            return alert('请选择提现银行卡');
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/merchant-withdrawals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: Number(amount),
                    bankCardId: selectedBankCardId,
                    type: 1 // 1: 余额提现
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('提现申请已提交，请等待审核');
                closeModal();
                loadStats();
                loadTransactions();
            } else {
                alert(json.message || '提现申请失败');
            }
        } catch (e) {
            console.error(e);
            alert('网络错误，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 银锭充值
    const handleSilverRecharge = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');

        setIsLoading(true);
        try {
            if (paymentType === 'balance') {
                // 使用余额充值银锭
                if (Number(amount) > stats.balance) {
                    alert('余额不足');
                    setIsLoading(false);
                    return;
                }
                const res = await fetch(`${BASE_URL}/recharge/merchant/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: Number(amount),
                        rechargeType: 2, // 2: 银锭
                        paymentMethod: 2 // 2: 余额支付
                    })
                });
                const json = await res.json();
                if (json.success) {
                    // 立即模拟回调
                    await fetch(`${BASE_URL}/recharge/callback/alipay`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderNumber: json.data.orderNumber,
                            tradeNo: `BALANCE_${Date.now()}`,
                            success: true
                        })
                    });
                    alert('银锭充值成功！');
                    closeModal();
                    loadStats();
                    loadTransactions();
                } else {
                    alert(json.message || '银锭充值失败');
                }
            } else {
                // 支付宝充值银锭
                const res = await fetch(`${BASE_URL}/recharge/merchant/create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: Number(amount),
                        rechargeType: 2, // 2: 银锭
                        paymentMethod: 1 // 1: 支付宝
                    })
                });
                const json = await res.json();
                if (json.success) {
                    setOrderNumber(json.data.orderNumber);
                    setQrCodeUrl(json.payUrl || `/pay/alipay?orderNumber=${json.data.orderNumber}&amount=${amount}`);
                    setStep('payment');
                } else {
                    alert(json.message || '创建充值订单失败');
                }
            }
        } catch (e) {
            console.error(e);
            alert('网络错误，请重试');
        } finally {
            setIsLoading(false);
        }
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
                        <button
                            onClick={openRecharge}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            充值
                        </button>
                        <button
                            onClick={openWithdraw}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                background: 'transparent',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
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
                    <button
                        onClick={openSilver}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
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

            {/* Modals */}
            {(rechargeModal || withdrawModal || silverModal) && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '420px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                            {rechargeModal ? (step === 'payment' ? '扫码支付' : '账户充值') : withdrawModal ? '余额提现' : (step === 'payment' ? '扫码支付' : '充值银锭')}
                        </h3>

                        {step === 'input' ? (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
                                        {silverModal ? '充值数量' : withdrawModal ? '提现金额' : '充值金额'}
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder={silverModal ? '请输入银锭数量' : withdrawModal ? '最低100元' : '请输入金额'}
                                        disabled={isLoading}
                                        style={{
                                            width: '100%', padding: '10px',
                                            border: '1px solid #d1d5db', borderRadius: '6px',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    {withdrawModal && (
                                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                            可用余额: ¥{Number(stats.balance).toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* 银锭充值：选择支付方式 */}
                                {silverModal && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
                                            支付方式
                                        </label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => setPaymentType('alipay')}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '8px',
                                                    border: paymentType === 'alipay' ? '2px solid #4f46e5' : '1px solid #d1d5db',
                                                    background: paymentType === 'alipay' ? '#eef2ff' : '#fff',
                                                    cursor: 'pointer', fontSize: '14px'
                                                }}
                                            >
                                                支付宝支付
                                            </button>
                                            <button
                                                onClick={() => setPaymentType('balance')}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '8px',
                                                    border: paymentType === 'balance' ? '2px solid #4f46e5' : '1px solid #d1d5db',
                                                    background: paymentType === 'balance' ? '#eef2ff' : '#fff',
                                                    cursor: 'pointer', fontSize: '14px'
                                                }}
                                            >
                                                余额支付
                                            </button>
                                        </div>
                                        {paymentType === 'balance' && (
                                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                                可用余额: ¥{Number(stats.balance).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 提现：选择银行卡 */}
                                {withdrawModal && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#6b7280', fontSize: '14px' }}>
                                            提现到银行卡
                                        </label>
                                        {bankCards.filter(c => c.status === 1).length === 0 ? (
                                            <div style={{
                                                padding: '16px', background: '#fef2f2', borderRadius: '8px',
                                                color: '#dc2626', fontSize: '14px', textAlign: 'center'
                                            }}>
                                                暂无可用银行卡，请先添加银行卡并等待审核通过
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedBankCardId}
                                                onChange={e => setSelectedBankCardId(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '10px',
                                                    border: '1px solid #d1d5db', borderRadius: '6px',
                                                    boxSizing: 'border-box', background: '#fff'
                                                }}
                                            >
                                                {bankCards.filter(c => c.status === 1).map(card => (
                                                    <option key={card.id} value={card.id}>
                                                        {card.bankName} - {card.cardNumber.slice(-4)} ({card.accountName})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={closeModal}
                                        disabled={isLoading}
                                        style={{
                                            padding: '8px 20px', borderRadius: '6px',
                                            border: '1px solid #d1d5db', background: '#fff',
                                            color: '#374151', cursor: 'pointer'
                                        }}
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!amount || Number(amount) <= 0) {
                                                alert('请输入有效金额');
                                                return;
                                            }
                                            if (withdrawModal) {
                                                handleWithdraw();
                                            } else if (rechargeModal) {
                                                handleRecharge();
                                            } else if (silverModal) {
                                                if (paymentType === 'balance') {
                                                    handleSilverRecharge();
                                                } else {
                                                    handleSilverRecharge();
                                                }
                                            }
                                        }}
                                        disabled={isLoading || (withdrawModal && bankCards.filter(c => c.status === 1).length === 0)}
                                        style={{
                                            padding: '8px 20px', borderRadius: '6px',
                                            border: 'none', background: '#4f46e5',
                                            color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer',
                                            opacity: isLoading ? 0.7 : 1
                                        }}
                                    >
                                        {isLoading ? '处理中...' : (withdrawModal ? '提交申请' : (silverModal && paymentType === 'balance' ? '确认充值' : '下一步'))}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                                    请使用支付宝扫码支付
                                </div>
                                <div style={{
                                    width: '200px', height: '200px', background: '#f3f4f6',
                                    margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '8px', border: '1px solid #e5e7eb', flexDirection: 'column'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📱</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>扫码支付</div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                    订单号: {orderNumber}
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '24px' }}>
                                    ¥{parseFloat(amount || '0').toFixed(2)}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button
                                        onClick={closeModal}
                                        disabled={isLoading}
                                        style={{
                                            padding: '8px 20px', borderRadius: '6px',
                                            border: '1px solid #d1d5db', background: '#fff',
                                            color: '#374151', cursor: isLoading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        取消支付
                                    </button>
                                    <button
                                        onClick={confirmPayment}
                                        disabled={isLoading}
                                        style={{
                                            padding: '8px 20px', borderRadius: '6px',
                                            border: 'none', background: '#10b981',
                                            color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer',
                                            opacity: isLoading ? 0.8 : 1
                                        }}
                                    >
                                        {isLoading ? '确认中...' : '我已支付'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
