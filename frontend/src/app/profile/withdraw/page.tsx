'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
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

    const getStatusText = (status: number) => {
        const configs: Record<number, { text: string; bg: string; textCol: string }> = {
            0: { text: '审核中', bg: 'bg-amber-50', textCol: 'text-amber-600' },
            1: { text: '已通过', bg: 'bg-emerald-50', textCol: 'text-emerald-600' },
            2: { text: '已拒绝', bg: 'bg-rose-50', textCol: 'text-rose-600' },
            3: { text: '已完成', bg: 'bg-slate-50', textCol: 'text-slate-500' },
        };
        return configs[status] || { text: '未知', bg: 'bg-slate-50', textCol: 'text-slate-500' };
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
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">提现中心</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Balance Display - More vibrant cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-100">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-100/70">本金余额</div>
                            <div className="mt-1 text-2xl font-black tracking-tight">¥{balance.principal.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl shadow-orange-100">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                        <div className="relative z-10">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-orange-100/70">银锭余额</div>
                            <div className="mt-1 text-2xl font-black tracking-tight">{balance.silver.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Modernized design */}
                <div className="flex w-full gap-2 rounded-[20px] bg-slate-100/50 p-1.5 shadow-inner">
                    {tabs.map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                            className={cn('flex-1 rounded-[16px] py-3 text-xs font-black uppercase tracking-wider transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                {activeTab !== 'records' ? (
                    <div className="space-y-6">
                        <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-100">
                            <form onSubmit={handleWithdrawClick} className="space-y-8">
                                {activeTab === 'silver' && (
                                    <div className="rounded-[20px] bg-amber-50/50 px-5 py-3 text-[10px] font-bold text-amber-600/90 leading-relaxed border border-amber-100/50">
                                        ✨ 温馨提示：银锭提现将扣除 {feeRate * 100}% 的手续费。
                                    </div>
                                )}

                                <div className="text-center">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">提现金额</label>
                                    <div className="relative mt-6 group">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full scale-75 group-focus-within:scale-100 transition-transform" />
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-blue-500/30 group-focus-within:text-blue-500/50 transition-colors">¥</span>
                                        <input
                                            type="number"
                                            className="relative w-full rounded-[28px] bg-slate-50/80 px-12 py-8 text-center text-5xl font-black text-slate-900 focus:outline-none shadow-inner border-2 border-transparent focus:border-blue-100 transition-all placeholder:text-slate-200"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">可提现: {getAvailableBalance().toFixed(2)}</span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                        <button
                                            type="button"
                                            onClick={() => setAmount(getAvailableBalance().toString())}
                                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
                                        >
                                            全部提现
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">选择到账银行卡</label>
                                    {bankCards.length > 0 ? (
                                        <div className="space-y-3">
                                            {bankCards.map(c => (
                                                <div key={c.id} onClick={() => setSelectedCard(c.id)}
                                                    className={cn('flex cursor-pointer items-center justify-between rounded-[24px] p-5 transition-all active:scale-[0.98] border-2',
                                                        selectedCard === c.id ? 'border-blue-500 bg-blue-600 text-white shadow-xl shadow-blue-100' : 'border-transparent bg-slate-50/50 text-slate-600 hover:bg-slate-100/80')}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl backdrop-blur-md text-sm font-black shadow-sm',
                                                            selectedCard === c.id ? 'bg-white/20' : 'bg-white')}>
                                                            {c.bankName.slice(0, 1)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black leading-tight">{c.bankName}</div>
                                                            <div className={cn('text-[10px] font-bold tracking-widest mt-0.5', selectedCard === c.id ? 'text-white/60' : 'text-slate-400')}>
                                                                **** **** **** {c.cardNumber.slice(-4)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedCard === c.id && (
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-blue-600 shadow-md">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div onClick={() => router.push('/profile/payment')} className="flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50/30 p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                            <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform">💳</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">尚未绑定银行卡，点击前往绑定</div>
                                        </div>
                                    )}
                                </div>

                                <button type="submit" disabled={bankCards.length === 0}
                                    className="w-full rounded-[28px] bg-gradient-to-r from-blue-600 to-indigo-600 py-6 text-base font-black text-white shadow-2xl shadow-blue-200 transition active:scale-95 disabled:from-slate-200 disabled:to-slate-300 disabled:shadow-none hover:brightness-110">
                                    立即申请提现
                                </button>
                            </form>
                        </Card>

                        {/* Tips - More stylized */}
                        <div className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
                            <div className="absolute right-0 top-0 h-16 w-16 bg-blue-50/50 rounded-bl-[40px] flex items-center justify-center text-blue-200 font-black text-2xl italic opacity-50">?</div>
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600">i</span>
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">提现须知</span>
                            </div>
                            <ul className="space-y-3 text-[10px] font-bold leading-relaxed text-slate-400">
                                <li className="flex gap-3"><span className="text-blue-500">01</span>单笔提现最低 {minWithdraw} 元起，上不封顶</li>
                                <li className="flex gap-3"><span className="text-blue-500">02</span>提现申请将在 1-3 个工作日内处理完成</li>
                                <li className="flex gap-3"><span className="text-blue-500">03</span>请确保银行卡信息真实有效，以免影响到账</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 bg-white p-6 rounded-[28px] shadow-sm ring-1 ring-slate-100">
                            <div className="flex items-center gap-2 flex-1">
                                <input type="date" className="flex-1 rounded-[16px] bg-slate-50 px-4 py-3 text-[10px] font-black text-slate-800 focus:outline-none shadow-inner"
                                    value={dateRange.from || ''} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
                                <span className="text-slate-300 font-black">—</span>
                                <input type="date" className="flex-1 rounded-[16px] bg-slate-50 px-4 py-3 text-[10px] font-black text-slate-800 focus:outline-none shadow-inner"
                                    value={dateRange.to || ''} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
                            </div>
                        </div>

                        {records.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-lg ring-1 ring-slate-100 opacity-50">📋</div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">暂无提现记录</h3>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-relaxed max-w-[200px] mx-auto">记录您的每一笔努力，快去完成任务赚取佣金吧</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {records.map(r => {
                                    const status = getStatusText(r.status);
                                    return (
                                        <div key={r.id} className="group relative rounded-[32px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98] ring-1 ring-slate-100">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1.5">
                                                    <div className="text-xl font-black text-slate-900 tracking-tight">¥{Number(r.amount).toFixed(2)}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                                                        {new Date(r.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn('rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm', status.bg, status.textCol)}>
                                                        {status.text}
                                                    </div>
                                                    {r.remark && <div className="mt-2 text-[9px] font-bold text-rose-500 max-w-[140px] truncate italic opacity-70">备注: {r.remark}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Modal - Premium design */}
            {showConfirm && withdrawData && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/60 backdrop-blur-md transition-all duration-300 sm:items-center p-4">
                    <div className="w-full max-w-[420px] animate-in slide-in-from-bottom-20 zoom-in-95 rounded-[36px] bg-white p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />

                        <div className="mb-10 text-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">预计实到金额</div>
                            <div className="mt-4 relative inline-block">
                                <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-full" />
                                <div className="relative text-5xl font-black text-blue-600 tracking-tighter">¥{calculateActual(withdrawData.amount).toFixed(2)}</div>
                            </div>
                            {activeTab === 'silver' && (
                                <div className="mt-4 inline-block rounded-full bg-slate-50 px-4 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    手续费: ¥{calculateFee(withdrawData.amount).toFixed(2)}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleConfirmWithdraw} className="space-y-8">
                            <div className="space-y-3">
                                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">图形验证码</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 rounded-[24px] bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 focus:outline-none shadow-inner border-2 border-transparent focus:border-blue-100"
                                        placeholder="输入验证码"
                                        value={captcha}
                                        onChange={(e) => setCaptcha(e.target.value)}
                                    />
                                    <div
                                        onClick={loadCaptcha}
                                        className="h-14 w-28 cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-md transition active:scale-95 flex items-center justify-center ring-1 ring-slate-100"
                                        dangerouslySetInnerHTML={{ __html: captchaSvg || '<div class="flex h-full items-center justify-center animate-pulse"><div class="h-1 w-12 bg-slate-100 rounded-full" /></div>' }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">支付密码</label>
                                <input
                                    type="password"
                                    className="w-full rounded-[24px] bg-slate-50 px-6 py-4 text-center text-sm font-black text-slate-900 tracking-[1em] focus:outline-none shadow-inner border-2 border-transparent focus:border-blue-100"
                                    placeholder="••••••"
                                    maxLength={6}
                                    value={payPassword}
                                    onChange={(e) => setPayPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => { setShowConfirm(false); setCaptcha(''); setPayPassword(''); loadCaptcha(); }}
                                    disabled={submitting} className="flex-1 rounded-[24px] bg-slate-50 py-4 text-sm font-black text-slate-400 transition active:scale-95 hover:bg-slate-100">
                                    取消
                                </button>
                                <button type="submit" disabled={submitting}
                                    className={cn('flex-1 rounded-[24px] py-4 text-sm font-black text-white shadow-xl transition active:scale-95',
                                        submitting ? 'bg-slate-200 shadow-none' : 'bg-blue-600 shadow-blue-100')}>
                                    {submitting ? '处理中...' : '提交提现'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
