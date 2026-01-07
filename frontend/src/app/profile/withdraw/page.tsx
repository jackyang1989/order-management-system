'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { Badge } from '../../../components/ui/badge';
import { toastSuccess, toastError } from '../../../lib/toast';
import { isAuthenticated } from '../../../services/authService';
import { fetchUserProfile, UserProfile } from '../../../services/userService';
import { fetchBankCards, BankCard } from '../../../services/bankCardService';
import { createWithdrawal, fetchWithdrawalRecords, WithdrawalRecord } from '../../../services/withdrawalService';
import { fetchCaptcha, verifyCaptcha } from '../../../services/captchaService';

export default function WithdrawPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [activeTab, setActiveTab] = useState<'withdraw' | 'records'>('withdraw');
    const [amount, setAmount] = useState('');
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [payPassword, setPayPassword] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaImg, setCaptchaImg] = useState('');
    const [captchaKey, setCaptchaKey] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [records, setRecords] = useState<WithdrawalRecord[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            const [p, cards] = await Promise.all([fetchUserProfile(), fetchBankCards()]);
            setProfile(p);
            setBankCards(cards);
            if (cards.length > 0) {
                const def = cards.find(c => c.isDefault) || cards[0];
                setSelectedCardId(def.id);
            }
            refreshCaptcha();
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const refreshCaptcha = async () => {
        try {
            const data = await fetchCaptcha();
            setCaptchaImg(data.img);
            setCaptchaKey(data.key);
        } catch (error) { console.error('Refresh captcha failed'); }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) { toastError('请输入正确的金额'); return; }
        if (!selectedCardId) { toastError('请选择银行卡'); return; }
        if (!payPassword) { toastError('请输入支付密码'); return; }
        if (!captchaCode) { toastError('请输入图形验证码'); return; }

        setSubmitting(true);
        try {
            const capOk = await verifyCaptcha(captchaKey, captchaCode);
            if (!capOk) { toastError('验证码错误'); refreshCaptcha(); setSubmitting(false); return; }

            const res = await createWithdrawal({
                bankCardId: selectedCardId,
                amount: Number(amount),
                payPassword,
                withdrawalType: 'CASH'
            });

            if (res.success) {
                toastSuccess('提现申请已提交');
                router.push('/profile/records');
            } else {
                toastError(res.message || '提现失败');
            }
        } catch (error: any) {
            toastError(error.message || '系统错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">提现中心</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-4">
                {/* Balance Summary Header */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[28px] bg-blue-600 p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">本金余额</span>
                        <div className="mt-3 text-2xl font-black tracking-tight leading-none text-white">¥ {Number(profile?.balance || 0).toFixed(2)}</div>
                    </div>
                    <div className="rounded-[28px] bg-emerald-500 p-6 text-white shadow-xl shadow-emerald-100 relative overflow-hidden text-right">
                        <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">银锭余额</span>
                        <div className="mt-3 text-2xl font-black tracking-tight leading-none text-white">{Number(profile?.silver || 0).toFixed(0)}</div>
                    </div>
                </div>

                {/* Main Form */}
                <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">提现金额</h3>
                            <button onClick={() => setAmount(String(profile?.balance || 0))} className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-none p-0 bg-transparent">全部提现</button>
                        </div>
                        <div className="relative flex items-center">
                            <span className="absolute left-6 text-2xl font-black text-slate-900 tracking-tight">¥</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full rounded-[24px] bg-slate-50 py-7 pl-12 pr-6 text-3xl font-black text-slate-900 shadow-inner focus:outline-none placeholder:text-slate-200 border-none"
                            />
                        </div>
                    </div>

                    {/* Bank Card Selection */}
                    <div className="space-y-4">
                        <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">选择收款账户</h3>
                        <div className="space-y-3">
                            {bankCards.length === 0 ? (
                                <button onClick={() => router.push('/profile/payment')} className="w-full rounded-[24px] bg-slate-50/50 p-6 border border-dashed border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group transition-all active:scale-95">
                                    + 尚未绑定银行卡，点击前往绑定
                                </button>
                            ) : (
                                bankCards.map(card => (
                                    <button key={card.id} onClick={() => setSelectedCardId(card.id)}
                                        className={cn('w-full rounded-[24px] p-5 flex items-center justify-between transition-all active:scale-95',
                                            selectedCardId === card.id
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-50 ring-2 ring-blue-100'
                                                : 'bg-slate-50 text-slate-600')}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn('h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm shadow-inner',
                                                selectedCardId === card.id ? 'bg-white/20' : 'bg-white')}>🏦</div>
                                            <div className="text-left">
                                                <div className="text-xs font-black tracking-tight">{card.bankName}</div>
                                                <div className={cn('text-[9px] font-bold uppercase tracking-widest mt-0.5',
                                                    selectedCardId === card.id ? 'opacity-60' : 'opacity-40')}>
                                                    **** **** **** {card.cardNo.slice(-4)}
                                                </div>
                                            </div>
                                        </div>
                                        {selectedCardId === card.id && <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-[10px] text-blue-600">✓</div>}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Confirm Section */}
                    <div className="space-y-5 pt-4 border-t border-slate-50">
                        <div className="space-y-2">
                            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">支付密码</label>
                            <input
                                type="password"
                                value={payPassword}
                                onChange={(e) => setPayPassword(e.target.value)}
                                placeholder="请输入 6 位数字支付密码"
                                maxLength={6}
                                className="w-full rounded-[20px] bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:outline-none border-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">图形验证码</label>
                            <div className="flex gap-3">
                                <input
                                    className="flex-1 rounded-[20px] bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:outline-none border-none uppercase"
                                    placeholder="验证码"
                                    value={captchaCode}
                                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                                />
                                <button type="button" onClick={refreshCaptcha} className="h-14 w-24 overflow-hidden rounded-[20px] bg-slate-100 shadow-sm transition active:scale-95 flex items-center justify-center p-0.5">
                                    <img src={captchaImg} alt="captcha" className="h-full w-full object-cover" />
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Precautions */}
                <div className="rounded-[40px] bg-amber-50/50 p-10 border border-amber-100/50">
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        提现注意事项
                    </h3>
                    <ul className="space-y-4 text-[10px] font-bold leading-relaxed text-amber-800/60 uppercase tracking-wide">
                        <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] text-amber-600 font-black italic">1</span>单笔提现最低金额为 ¥100.00，最高可提现当日全部余额</li>
                        <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] text-amber-600 font-black italic">2</span>提现手续费统一为 1%，VIP 会员每月专享 3 次免费提现机会</li>
                        <li className="flex gap-4"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] text-amber-600 font-black italic">3</span>审核通过后，资金将在 24 小时内达到您的银行账户</li>
                    </ul>
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl border-t border-slate-50">
                <button onClick={handleWithdraw} disabled={submitting}
                    className="w-full rounded-[28px] bg-blue-600 py-6 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                    {submitting ? <Spinner size="sm" /> : '立即申请提现'}
                </button>
            </div>
        </div>
    );
}
