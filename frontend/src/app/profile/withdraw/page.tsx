'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs } from '../../../components/ui/tabs';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
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

    // Form state
    const [amount, setAmount] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [payPassword, setPayPassword] = useState('');
    const [withdrawData, setWithdrawData] = useState<{ amount: number; type: string } | null>(null);

    const feeRate = 0.05;
    const minWithdraw = 10;

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
        loadCaptcha();
    }, [router]);

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
            const withdrawals = await fetchWithdrawals();
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

        // Verify captcha
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

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center border-b border-slate-200 bg-white px-4 py-3">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">← 返回</button>
                <h1 className="text-base font-medium text-slate-800">提现</h1>
            </div>

            {/* Balance Card */}
            <div className="p-4">
                <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
                    <div className="flex justify-around text-center">
                        <div>
                            <div className="text-2xl font-bold">¥{balance.principal.toFixed(2)}</div>
                            <div className="mt-1 text-xs opacity-80">本金余额</div>
                        </div>
                        <div className="border-l border-white/30 pl-6">
                            <div className="text-2xl font-bold">{balance.silver.toFixed(2)}</div>
                            <div className="mt-1 text-xs opacity-80">银锭余额</div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'principal', label: '本金提现' },
                    { key: 'silver', label: '银锭提现' },
                    { key: 'records', label: '提现记录' },
                ]}
            />

            <div className="p-4">
                {activeTab === 'principal' && (
                    <form onSubmit={handleWithdrawClick} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm text-slate-600">
                                可提现: <span className="font-medium text-slate-800">¥{getAvailableBalance().toFixed(2)}</span>
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="输入提现金额"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        {bankCards.length > 0 ? (
                            <div>
                                <label className="mb-1.5 block text-sm text-slate-600">选择银行卡</label>
                                <div className="flex flex-wrap gap-2">
                                    {bankCards.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedCard(c.id)}
                                            className={cn(
                                                'rounded-lg border px-4 py-2 text-sm transition',
                                                selectedCard === c.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-slate-200 bg-white text-slate-600'
                                            )}
                                        >
                                            {c.bankName} *{c.cardNumber.slice(-4)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="cursor-pointer rounded-lg bg-amber-50 p-3 text-sm text-amber-700"
                                onClick={() => router.push('/profile/bank')}
                            >
                                ⚠️ 请先绑定银行卡
                            </div>
                        )}

                        <Button type="submit" className="mt-4 w-full rounded-full py-3" disabled={bankCards.length === 0}>
                            申请提现
                        </Button>
                    </form>
                )}

                {activeTab === 'silver' && (
                    <form onSubmit={handleWithdrawClick} className="space-y-4">
                        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                            ℹ️ 银锭提现手续费: {feeRate * 100}%
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm text-slate-600">
                                可提现银锭: <span className="font-medium text-slate-800">{(balance.silver - balance.frozenSilver).toFixed(2)}</span>
                            </label>
                            <input
                                type="number"
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-xl font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="输入提现银锭数量"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        {bankCards.length > 0 ? (
                            <div>
                                <label className="mb-1.5 block text-sm text-slate-600">选择银行卡</label>
                                <div className="flex flex-wrap gap-2">
                                    {bankCards.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setSelectedCard(c.id)}
                                            className={cn(
                                                'rounded-lg border px-4 py-2 text-sm transition',
                                                selectedCard === c.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-slate-200 bg-white text-slate-600'
                                            )}
                                        >
                                            {c.bankName} *{c.cardNumber.slice(-4)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div
                                className="cursor-pointer rounded-lg bg-amber-50 p-3 text-sm text-amber-700"
                                onClick={() => router.push('/profile/bank')}
                            >
                                ⚠️ 请先绑定银行卡
                            </div>
                        )}

                        <Button type="submit" className="mt-4 w-full rounded-full py-3" disabled={bankCards.length === 0}>
                            申请提现
                        </Button>
                    </form>
                )}

                {activeTab === 'records' && (
                    <div className="space-y-3">
                        {records.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">暂无提现记录</div>
                        ) : (
                            records.map(r => (
                                <Card key={r.id} className="bg-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800">¥{Number(r.amount).toFixed(2)}</div>
                                            <div className="mt-0.5 text-xs text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                        </div>
                                        {getStatusBadge(r.status)}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <Modal
                title="确认提现"
                open={showConfirm}
                onClose={() => { setShowConfirm(false); setCaptcha(''); setPayPassword(''); loadCaptcha(); }}
            >
                {withdrawData && (
                    <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">¥{calculateActual(withdrawData.amount).toFixed(2)}</div>
                            {activeTab === 'silver' && (
                                <div className="mt-1 text-xs text-slate-500">手续费: ¥{calculateFee(withdrawData.amount).toFixed(2)}</div>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">图形验证码</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="验证码"
                                    value={captcha}
                                    onChange={(e) => setCaptcha(e.target.value)}
                                />
                                <div
                                    onClick={loadCaptcha}
                                    className="h-9 w-24 cursor-pointer overflow-hidden rounded bg-slate-100"
                                    dangerouslySetInnerHTML={{ __html: captchaSvg || '加载中...' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">支付密码</label>
                            <input
                                type="password"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="请输入支付密码"
                                value={payPassword}
                                onChange={(e) => setPayPassword(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" loading={submitting}>
                            确认提现
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
