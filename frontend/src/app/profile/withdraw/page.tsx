'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
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

    const tabs = [
        { key: 'principal', label: '本金提现' },
        { key: 'silver', label: '银锭提现' },
        { key: 'records', label: '提现记录' },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
    );

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <ProfileContainer className="flex items-center py-3">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">← 返回</button>
                    <h1 className="text-base font-medium text-slate-800">提现</h1>
                </ProfileContainer>
            </div>

            <ProfileContainer className="py-4">
                {/* Balance Card */}
                <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">¥{balance.principal.toFixed(2)}</div>
                            <div className="mt-1 text-xs opacity-80">本金余额</div>
                        </div>
                        <div className="border-l border-white/30 pl-4">
                            <div className="text-2xl font-bold">{balance.silver.toFixed(2)}</div>
                            <div className="mt-1 text-xs opacity-80">银锭余额</div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Fixed layout with grid-cols-3 */}
                <div className="mb-4 grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-200 p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'w-full rounded-md px-2 py-2.5 text-center text-sm font-medium transition-colors',
                                activeTab === tab.key
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'principal' && (
                    <Card className="bg-white p-6 shadow-sm">
                        <form onSubmit={handleWithdrawClick} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-600">
                                    可提现本金
                                </label>
                                <div className="flex items-baseline gap-1 text-slate-800">
                                    <span className="text-sm font-semibold">¥</span>
                                    <span className="text-3xl font-bold">{getAvailableBalance().toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs text-slate-500">提现金额</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            {bankCards.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-600">选择接收银行卡</label>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {bankCards.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setSelectedCard(c.id)}
                                                className={cn(
                                                    'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                                                    selectedCard === c.id
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                                )}
                                            >
                                                <div className="text-sm font-semibold text-slate-900">{c.bankName}</div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    尾号 {c.cardNumber.slice(-4)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700 border border-amber-100"
                                    onClick={() => router.push('/profile/bank')}
                                >
                                    ⚠️ 请先绑定银行卡再进行提现
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-xl py-4 text-base font-bold shadow-lg shadow-primary/20" disabled={bankCards.length === 0}>
                                提交提现申请
                            </Button>
                        </form>
                    </Card>
                )}

                {activeTab === 'silver' && (
                    <Card className="bg-white p-6 shadow-sm">
                        <form onSubmit={handleWithdrawClick} className="space-y-6">
                            <div className="rounded-xl bg-blue-50/50 p-4 text-sm text-blue-700 border border-blue-100">
                                <div className="flex items-center gap-2 font-semibold">
                                    <span>ℹ️</span> 银锭提现规则
                                </div>
                                <p className="mt-1 text-xs opacity-90">当前手续费率: {feeRate * 100}%，申请后预计 1-3 个工作日到账。</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">总计银锭</label>
                                    <div className="flex items-baseline gap-1 text-slate-800">
                                        <span className="text-lg font-bold">{balance.silver.toFixed(2)}</span>
                                        <span className="text-[10px] opacity-60">枚</span>
                                    </div>
                                </div>
                                <div className="border-l border-slate-100 pl-4">
                                    <label className="block text-xs text-slate-500 mb-1">可用提现</label>
                                    <div className="flex items-baseline gap-1 text-emerald-600">
                                        <span className="text-lg font-bold">{(balance.silver - balance.frozenSilver).toFixed(2)}</span>
                                        <span className="text-[10px] opacity-60">枚</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs text-slate-500">提现数量</label>
                                <input
                                    type="number"
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold text-slate-900 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            {bankCards.length > 0 ? (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-600">接收账户</label>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {bankCards.map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setSelectedCard(c.id)}
                                                className={cn(
                                                    'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                                                    selectedCard === c.id
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                                )}
                                            >
                                                <div className="text-sm font-semibold text-slate-900">{c.bankName}</div>
                                                <div className="mt-1 text-xs text-slate-500">
                                                    尾号 {c.cardNumber.slice(-4)}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="cursor-pointer rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700 border border-amber-100"
                                    onClick={() => router.push('/profile/bank')}
                                >
                                    ⚠️ 请先绑定银行卡再进行提现
                                </div>
                            )}

                            <Button type="submit" className="w-full rounded-xl py-4 text-base font-bold shadow-lg shadow-primary/20" disabled={bankCards.length === 0}>
                                提交银锭提现
                            </Button>
                        </form>
                    </Card>
                )}

                {activeTab === 'records' && (
                    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[120px]">提现金额</th>
                                        <th className="px-4 py-3 min-w-[150px]">申请时间</th>
                                        <th className="px-4 py-3 min-w-[100px]">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-12 text-center text-slate-400">暂无提现记录</td>
                                        </tr>
                                    ) : (
                                        records.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-4 font-bold text-slate-900">¥{Number(r.amount).toFixed(2)}</td>
                                                <td className="px-4 py-4 text-slate-500">{new Date(r.createdAt).toLocaleString('zh-CN')}</td>
                                                <td className="px-4 py-4 text-slate-500">{getStatusBadge(r.status)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </ProfileContainer>

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
