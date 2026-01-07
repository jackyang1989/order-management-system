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
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated, getCurrentUser } from '../../../services/authService';
import { fetchBankCards, fetchWithdrawals, createWithdrawal, BankCard, Withdrawal } from '../../../services/userService';
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

    const feeRate = 0.05;
    const minWithdraw = 10;

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
        loadCaptcha();
    }, [router, dateRange]);

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
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">提现</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Balance Card */}
                <Card className="mb-6 rounded-[24px] border-none bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <div className="grid grid-cols-2 gap-8 text-center">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">本金余额</div>
                            <div className="text-2xl font-black text-slate-900 tabular-nums">¥{balance.principal.toFixed(2)}</div>
                        </div>
                        <div className="space-y-1 border-l border-slate-50">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">银锭余额</div>
                            <div className="text-2xl font-black text-slate-900 tabular-nums">{balance.silver.toFixed(2)}</div>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="mb-6 flex w-full gap-2 rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex-1 rounded-full py-2.5 text-center text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key
                                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'principal' && (
                    <Card className="rounded-[24px] border-none bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <form onSubmit={handleWithdrawClick} className="space-y-6">
                            <div className="text-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">可提现本金</label>
                                <div className="mt-1 text-3xl font-black text-slate-900 tabular-nums">¥{getAvailableBalance().toFixed(2)}</div>
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">提现金额</label>
                                <input
                                    type="number"
                                    className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-5 text-center text-2xl font-black text-slate-900 shadow-inner placeholder:text-slate-200 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            {bankCards.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">选择银行卡</label>
                                    <div className="grid gap-2">
                                        {bankCards.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCard(c.id)}
                                                className={cn(
                                                    'flex cursor-pointer items-center rounded-[18px] border-2 px-4 py-4 transition-all',
                                                    selectedCard === c.id
                                                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                                        : 'border-slate-50 bg-slate-50/50 hover:bg-slate-100'
                                                )}
                                            >
                                                <div className="flex-1">
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.bankName}</div>
                                                    <div className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CARD •••• {c.cardNumber.slice(-4)}</div>
                                                </div>
                                                {selectedCard === c.id && (
                                                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <span className="text-white text-[10px]">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer rounded-[18px] bg-amber-50/50 p-4 text-center text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-100/50 active:scale-95 transition-transform"
                                    onClick={() => router.push('/profile/bank')}
                                >
                                    ⚠️ 请先绑定银行卡
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-[20px] bg-slate-900 py-8 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-transform active:scale-95" disabled={bankCards.length === 0}>
                                申请提现
                            </Button>
                        </form>
                    </Card>
                )}

                {activeTab === 'silver' && (
                    <Card className="rounded-[24px] border-none bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <form onSubmit={handleWithdrawClick} className="space-y-6">
                            <div className="rounded-[18px] bg-blue-50/50 p-5 text-[10px] font-bold text-blue-700 uppercase tracking-widest leading-relaxed">
                                <span className="mr-2 font-black">INFO:</span> 银锭提现手续费: {feeRate * 100}%
                            </div>

                            <div className="text-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">可提现银锭</label>
                                <div className="mt-1 text-3xl font-black text-slate-900 tabular-nums">{(balance.silver - balance.frozenSilver).toFixed(2)}</div>
                            </div>

                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">提现数量</label>
                                <input
                                    type="number"
                                    className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-5 text-center text-2xl font-black text-slate-900 shadow-inner placeholder:text-slate-200 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            {bankCards.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">选择银行卡</label>
                                    <div className="grid gap-2">
                                        {bankCards.map(c => (
                                            <div
                                                key={c.id}
                                                onClick={() => setSelectedCard(c.id)}
                                                className={cn(
                                                    'flex cursor-pointer items-center rounded-[18px] border-2 px-4 py-4 transition-all',
                                                    selectedCard === c.id
                                                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                                        : 'border-slate-50 bg-slate-50/50 hover:bg-slate-100'
                                                )}
                                            >
                                                <div className="flex-1">
                                                    <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.bankName}</div>
                                                    <div className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CARD •••• {c.cardNumber.slice(-4)}</div>
                                                </div>
                                                {selectedCard === c.id && (
                                                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <span className="text-white text-[10px]">✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer rounded-[18px] bg-amber-50/50 p-4 text-center text-[10px] font-black uppercase tracking-widest text-amber-600 border border-amber-100/50 active:scale-95 transition-transform"
                                    onClick={() => router.push('/profile/bank')}
                                >
                                    ⚠️ 请先绑定银行卡
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-[20px] bg-slate-900 py-8 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-transform active:scale-95" disabled={bankCards.length === 0}>
                                申请提现
                            </Button>
                        </form>
                    </Card>
                )}

                {activeTab === 'records' && (
                    <Card className="rounded-[24px] border-none bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                        <div className="flex items-center justify-end space-x-2 border-b border-slate-50 p-6">
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="rounded-full bg-slate-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-slate-100 transition-colors"
                                    value={dateRange.from || ''}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                />
                                <span className="text-slate-200">—</span>
                                <input
                                    type="date"
                                    className="rounded-full bg-slate-50/80 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none hover:bg-slate-100 transition-colors"
                                    value={dateRange.to || ''}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                />
                            </div>
                        </div>
                        {records.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="text-3xl mb-4">📭</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No records found</div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {records.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="text-sm font-black text-slate-900 tabular-nums">¥{Number(r.amount).toFixed(2)}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            {getStatusBadge(r.status)}
                                            {r.remark && <div className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">{r.remark}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </ProfileContainer>

            {/* Confirm Modal */}
            <Modal
                title="确认提现"
                open={showConfirm}
                onClose={() => { setShowConfirm(false); setCaptcha(''); setPayPassword(''); loadCaptcha(); }}
                className="rounded-[32px] p-8"
            >
                {withdrawData && (
                    <form onSubmit={handleConfirmWithdraw} className="space-y-8 py-4">
                        <div className="text-center space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">实际到账</div>
                            <div className="text-4xl font-black text-slate-900 tabular-nums">¥{calculateActual(withdrawData.amount).toFixed(2)}</div>
                            {activeTab === 'silver' && (
                                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">手续费: ¥{calculateFee(withdrawData.amount).toFixed(2)}</div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">图形验证码</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="CODE"
                                        value={captcha}
                                        onChange={(e) => setCaptcha(e.target.value)}
                                    />
                                    <div
                                        onClick={loadCaptcha}
                                        className="h-12 w-28 cursor-pointer overflow-hidden rounded-[16px] bg-slate-50 border border-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                                        dangerouslySetInnerHTML={{ __html: captchaSvg || '...' }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支付密码</label>
                                <input
                                    type="password"
                                    className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="PASSWORD"
                                    value={payPassword}
                                    onChange={(e) => setPayPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full rounded-[24px] bg-slate-900 py-8 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-transform active:scale-95" loading={submitting}>
                            确认并提交申请
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
