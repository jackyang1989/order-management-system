'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { isAuthenticated, getCurrentUser } from '../../../services/authService';
import { fetchBankCards, fetchWithdrawals, createWithdrawal, BankCard, Withdrawal } from '../../../services/userService';
import { fetchSystemConfig, getWithdrawFeeRate } from '../../../services/systemConfigService';
import { BASE_URL } from '../../../../apiConfig';

export default function WithdrawPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('principal');
    const [balance, setBalance] = useState({ principal: 0, silver: 0, frozenSilver: 0 });
    const [records, setRecords] = useState<Withdrawal[]>([]);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [captchaId, setCaptchaId] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');

    const [amount, setAmount] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [payPassword, setPayPassword] = useState('');
    const [withdrawData, setWithdrawData] = useState<{ amount: number; type: string } | null>(null);
    const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

    const [feeRate, setFeeRate] = useState(0.05);
    const [minWithdraw, setMinWithdraw] = useState(10);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadSystemConfig();
        loadData();
        loadCaptcha();
    }, [router, dateRange]);

    const loadSystemConfig = async () => {
        const config = await fetchSystemConfig();
        if (config) {
            setFeeRate(getWithdrawFeeRate(config));
            setMinWithdraw(Number(config.userMinMoney) || 10);
        }
    };

    const loadCaptcha = async () => {
        try {
            const res = await fetch(`${BASE_URL}/captcha/generate`);
            const data = await res.json();
            if (data.captchaId && data.svg) { setCaptchaId(data.captchaId); setCaptchaSvg(data.svg); }
        } catch (e) { console.error('加载验证码失败', e); }
    };

    const loadData = async () => {
        try {
            const user = getCurrentUser();
            if (user) { setBalance({ principal: Number(user.balance) || 0, silver: Number(user.silver) || 0, frozenSilver: Number(user.frozenSilver) || 0 }); }
            const cards = await fetchBankCards();
            setBankCards(cards);
            if (cards.length > 0) { const defaultCard = cards.find(c => c.isDefault) || cards[0]; setSelectedCard(defaultCard.id); }
            const withdrawals = await fetchWithdrawals(dateRange.from, dateRange.to);
            setRecords(withdrawals);
        } catch (error) { console.error('Load data error:', error); } finally { setLoading(false); }
    };

    const getAvailableBalance = () => activeTab === 'principal' ? balance.principal : (balance.silver - balance.frozenSilver);
    const calculateFee = (amt: number) => activeTab === 'principal' ? 0 : amt * feeRate;
    const calculateActual = (amt: number) => amt - calculateFee(amt);

    const handleWithdrawClick = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt < minWithdraw) { toastError(`最低提现金额 ${minWithdraw} 元`); return; }
        if (amt > getAvailableBalance()) { toastError('提现金额超过可用余额'); return; }
        if (!selectedCard) { toastError('请选择银行卡'); return; }
        setWithdrawData({ amount: amt, type: activeTab });
        setShowConfirm(true);
    };

    const handleConfirmWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!captcha) { toastError('请输入验证码'); return; }
        if (!payPassword) { toastError('请输入支付密码'); return; }
        if (!withdrawData) return;

        try {
            const captchaRes = await fetch(`${BASE_URL}/captcha/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captchaId, code: captcha }),
            });
            const captchaData = await captchaRes.json();
            if (!captchaData.valid) { toastError('验证码错误'); loadCaptcha(); return; }
        } catch (e) { toastError('验证码校验失败'); loadCaptcha(); return; }

        setSubmitting(true);
        try {
            await createWithdrawal({
                amount: withdrawData.amount,
                bankCardId: selectedCard,
                type: activeTab === 'principal' ? 1 : 2,
            });
            toastSuccess('提现申请已提交');
            setShowConfirm(false);
            setAmount('');
            setCaptcha('');
            setPayPassword('');
            loadData();
            loadCaptcha();
        } catch (error: any) {
            toastError(error.message || '提现失败');
            loadCaptcha();
        } finally { setSubmitting(false); }
    };

    const getStatusBadge = (status: number) => {
        const configs: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
            0: { text: '审核中', color: 'amber' },
            1: { text: '已通过', color: 'green' },
            2: { text: '已拒绝', color: 'red' },
            3: { text: '已完成', color: 'slate' },
        };
        const conf = configs[status] || { text: '未知', color: 'slate' };
        return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
    };

    const tabs = [
        { key: 'principal', label: '本金提现' },
        { key: 'silver', label: '银锭提现' },
        { key: 'records', label: '提现记录' },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-20 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">提现</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Balance Card */}
                <div className="mb-6 rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-black text-slate-900">¥{balance.principal.toFixed(2)}</div>
                            <div className="mt-1 text-xs font-bold text-slate-400">本金余额</div>
                        </div>
                        <div className="border-l border-slate-100">
                            <div className="text-2xl font-black text-slate-900">{balance.silver.toFixed(2)}</div>
                            <div className="mt-1 text-xs font-bold text-slate-400">银锭余额</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 rounded-[20px] bg-white p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn('flex-1 rounded-[16px] py-3 text-sm font-bold transition-all', activeTab === tab.key ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-transparent text-slate-500 hover:bg-slate-50')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'principal' && (
                    <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <form onSubmit={handleWithdrawClick} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold text-slate-500">可提现本金</label>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">¥{getAvailableBalance().toFixed(2)}</div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold text-slate-500">提现金额</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">¥</div>
                                    <input
                                        type="number"
                                        className="w-full rounded-[16px] border-none bg-slate-50 px-4 pl-8 py-4 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            {bankCards.length > 0 ? (
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-slate-500">选择银行卡</label>
                                    <div className="space-y-3">
                                        {bankCards.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCard(c.id)}
                                                className={cn(
                                                    'flex cursor-pointer items-center rounded-[16px] border-2 p-4 transition-all active:scale-[0.98]',
                                                    selectedCard === c.id
                                                        ? 'border-primary-500 bg-primary-50'
                                                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                                                )}
                                            >
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-900">{c.bankName}</div>
                                                    <div className="text-xs font-medium text-slate-500">**** **** **** {c.cardNumber.slice(-4)}</div>
                                                </div>
                                                {selectedCard === c.id && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">✓</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer rounded-[20px] bg-amber-50 p-4 text-center text-sm font-bold text-amber-600 transition-all active:scale-95"
                                    onClick={() => router.push('/profile/payment')}
                                >
                                    ⚠️ 暂无收款账户，请先绑定
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-[16px] py-6 text-base font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-transform bg-primary-600 hover:bg-primary-700 disabled:opacity-50" disabled={bankCards.length === 0}>
                                申请提现
                            </Button>
                        </form>
                    </div>
                )
                }

                {
                    activeTab === 'silver' && (
                        <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <form onSubmit={handleWithdrawClick} className="space-y-6">
                                <div className="rounded-[16px] bg-blue-50 p-3 text-xs font-bold text-blue-600 flex items-center gap-2">
                                    <span>ℹ️</span> 银锭提现手续费: {feeRate * 100}%
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold text-slate-500">可提现银锭</label>
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">{(balance.silver - balance.frozenSilver).toFixed(2)}</div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold text-slate-500">提现数量</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-[16px] border-none bg-slate-50 px-4 py-4 text-center text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                {bankCards.length > 0 ? (
                                    <div>
                                        <label className="mb-2 block text-xs font-bold text-slate-500">选择银行卡</label>
                                        <div className="space-y-3">
                                            {bankCards.map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => setSelectedCard(c.id)}
                                                    className={cn(
                                                        'flex cursor-pointer items-center rounded-[16px] border-2 p-4 transition-all active:scale-[0.98]',
                                                        selectedCard === c.id
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                                                    )}
                                                >
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-slate-900">{c.bankName}</div>
                                                        <div className="text-xs font-medium text-slate-500">**** **** **** {c.cardNumber.slice(-4)}</div>
                                                    </div>
                                                    {selectedCard === c.id && <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">✓</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="cursor-pointer rounded-[20px] bg-amber-50 p-4 text-center text-sm font-bold text-amber-600 transition-all active:scale-95"
                                        onClick={() => router.push('/profile/payment')}
                                    >
                                        ⚠️ 暂无收款账户，请先绑定
                                    </div>
                                )}

                                <Button type="submit" className="w-full rounded-[16px] py-6 text-base font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-transform bg-primary-600 hover:bg-primary-700 disabled:opacity-50" disabled={bankCards.length === 0}>
                                    申请提现
                                </Button>
                            </form>
                        </div>
                    )
                }

                {
                    activeTab === 'records' && (
                        <div className="rounded-[24px] bg-white overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            {activeTab === 'records' && (
                                <>
                                    <div className="flex items-center justify-end space-x-2 border-b border-slate-50 p-4 bg-slate-50/50">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="date"
                                                className="rounded-lg border-none bg-white px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20"
                                                value={dateRange.from || ''}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                            />
                                            <span className="text-slate-300 font-bold">-</span>
                                            <input
                                                type="date"
                                                className="rounded-lg border-none bg-white px-3 py-1.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary-500/20"
                                                value={dateRange.to || ''}
                                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    {records.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <div className="mb-4 text-5xl opacity-30 grayscale">🧾</div>
                                            <div className="text-sm font-bold text-slate-300">暂无提现记录</div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {records.map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-5 transition-colors hover:bg-slate-50">
                                                    <div>
                                                        <div className="text-lg font-black text-slate-900">¥{Number(r.amount).toFixed(2)}</div>
                                                        <div className="mt-1 text-[10px] font-medium text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <div className="scale-90 origin-right">{getStatusBadge(r.status)}</div>
                                                        {r.remark && <div className="mt-1 text-[10px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">{r.remark}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                }
            </ProfileContainer >

            {/* Confirm Modal */}
            < Modal
                title="确认提现"
                open={showConfirm}
                onClose={() => { setShowConfirm(false); setCaptcha(''); setPayPassword(''); loadCaptcha(); }}
            >
                {withdrawData && (
                    <form onSubmit={handleConfirmWithdraw} className="space-y-5">
                        <div className="text-center py-4 bg-slate-50 rounded-[20px] mb-6">
                            <div className="text-4xl font-black text-slate-900 tracking-tight">¥{calculateActual(withdrawData.amount).toFixed(2)}</div>
                            {activeTab === 'silver' && (
                                <div className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-400 shadow-sm border border-slate-100">手续费: ¥{calculateFee(withdrawData.amount).toFixed(2)}</div>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-500">图形验证码</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    className="flex-1 rounded-[16px] border-none bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                    placeholder="请输入验证码"
                                    value={captcha}
                                    onChange={(e) => setCaptcha(e.target.value)}
                                />
                                <div
                                    onClick={loadCaptcha}
                                    className="h-11 w-28 cursor-pointer overflow-hidden rounded-[16px] bg-slate-100 transition-opacity hover:opacity-80"
                                    dangerouslySetInnerHTML={{ __html: captchaSvg || '<div class="flex h-full items-center justify-center text-[10px] text-slate-400">加载中...</div>' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-500">支付密码</label>
                            <input
                                type="password"
                                className="w-full rounded-[16px] border-none bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                placeholder="请输入支付密码"
                                value={payPassword}
                                onChange={(e) => setPayPassword(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full rounded-[16px] py-6 text-base font-bold shadow-lg shadow-primary-600/20 active:scale-95 transition-transform bg-primary-600 hover:bg-primary-700" loading={submitting}>
                            确认提现
                        </Button>
                    </form>
                )}
            </Modal >
        </div >
    );
}
