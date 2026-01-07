'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { toastSuccess, toastError } from '../../../lib/toast';
import { isAuthenticated } from '../../../services/authService';
import { fetchVipPackages, purchaseVip, VipPackage } from '../../../services/vipService';

export default function VipPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<VipPackage[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadPlans();
    }, [router]);

    const loadPlans = async () => {
        try {
            const data = await fetchVipPackages();
            setPlans(data);
            if (data.length > 0) setSelectedPlanId(data[0].id);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handlePurchase = async () => {
        if (!selectedPlanId) return;
        setSubmitting(true);
        try {
            const result = await purchaseVip(selectedPlanId);
            if (result.success) {
                toastSuccess('购买成功，VIP 已激活');
                router.refresh();
                router.push('/profile');
            } else {
                toastError(result.message || '购买失败');
            }
        } catch (error: any) {
            toastError(error.message || '网络错误，请稍后重试');
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
        <div className="min-h-screen bg-[#F8FAFC] pb-40">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">VIP 会员中心</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-10 px-4 py-8">
                {/* Hero Card */}
                <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-10 text-white shadow-2xl shadow-slate-200">
                    <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">👑</span>
                            <h2 className="text-2xl font-black text-amber-400 tracking-tight">专享会员特权</h2>
                        </div>
                        <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">激活 VIP 即可开启更高收益的任务大门<br />享受更低的手续费与专属身份标识</p>
                    </div>
                </div>

                {/* Plans Selection */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">选择会员套餐</h3>
                        <span className="text-[10px] font-bold text-blue-600 italic">限时优惠中</span>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        {plans.map((plan) => (
                            <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
                                className={cn('relative flex flex-col items-center rounded-[32px] p-8 transition-all',
                                    selectedPlanId === plan.id
                                        ? 'bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)] ring-2 ring-blue-600 animate-in zoom-in-95 duration-200'
                                        : 'bg-white/40 shadow-sm opacity-60')}>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{plan.name}</span>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-sm font-black text-slate-900">¥</span>
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{plan.discountPrice || plan.price}</span>
                                </div>
                                <span className="mt-2 text-[9px] font-bold text-slate-400 italic">有效期 {plan.days} 天</span>
                                {selectedPlanId === plan.id && (
                                    <div className="absolute -top-2 right-4 rounded-full bg-blue-600 px-3 py-1 text-[8px] font-black text-white shadow-lg">SELECTED</div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Benefits List */}
                <div className="space-y-6">
                    <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-center">专属核心权益</h3>
                    <Card className="rounded-[40px] border-none bg-white p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-10">
                        <div className="flex gap-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-amber-50 text-2xl">📈</div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900">更高任务收益</h4>
                                <p className="mt-1 text-[10px] font-bold text-slate-400 leading-relaxed italic">VIP 用户可优先获取高佣金任务，任务平均收益较普通用户提升 20%-50% 以上。</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-blue-50 text-2xl">⚡</div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900">提现急速到账</h4>
                                <p className="mt-1 text-[10px] font-bold text-slate-400 leading-relaxed italic">专享 VIP 提现通道，审核优先级最高，最快可在 10 分钟内完成资金划转。</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-50 text-2xl">🎭</div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900">尊贵身份标识</h4>
                                <p className="mt-1 text-[10px] font-bold text-slate-400 leading-relaxed italic">全站点亮金色 VIP 皇冠标识，尽显尊贵身份，更有不定期专属节日礼包等你来拿。</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Sticky Bottom Purchase Bar */}
            <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl border-t border-slate-50 flex items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">应付总额</div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-slate-900 uppercase">RMB</span>
                        <span className="text-2xl font-black text-slate-900">{plans.find(p => p.id === selectedPlanId)?.price || '0.00'}</span>
                    </div>
                </div>
                <button onClick={handlePurchase} disabled={submitting || !selectedPlanId}
                    className="flex-1 rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                    {submitting ? <Spinner size="sm" /> : '立即激活 VIP'}
                </button>
            </div>
        </div>
    );
}
