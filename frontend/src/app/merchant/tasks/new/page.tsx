'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { TaskFormData, InitialTaskData } from './_components/types';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2ValueAdded from './_components/Step2ValueAdded';
import Step3Payment from './_components/Step3Payment';
import { cn } from '../../../../lib/utils';
import { Card } from '../../../../components/ui/card';

interface MerchantProfile { balance: number; silver: number; username: string; }

export default function NewTaskPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<TaskFormData>(InitialTaskData);
    const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadMerchantProfile(); }, []);
    useEffect(() => { calculateFees(); }, [data.goodsPrice, data.goodsList, data.count, data.isPraise, data.praiseType, data.isTimingPublish, data.isTimingPay, data.isCycleTime, data.addReward, data.isFreeShipping, data.isNextDay, data.fastRefund]);

    const loadMerchantProfile = async () => {
        const token = localStorage.getItem('merchantToken'); if (!token) return;
        try { const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } }); const json = await res.json(); if (json.success) setMerchant(json.data); } catch (e) { console.error(e); }
    };

    const calculateFees = () => {
        const count = data.count || 1; const baseFeePerOrder = 5.0;
        let praiseFeeUnit = 0; if (data.isPraise) { if (data.praiseType === 'text') praiseFeeUnit = 2.0; if (data.praiseType === 'image') praiseFeeUnit = 4.0; if (data.praiseType === 'video') praiseFeeUnit = 10.0; }
        const timingPublishFeeUnit = data.isTimingPublish ? 1.0 : 0; const timingPayFeeUnit = data.isTimingPay ? 1.0 : 0;
        const cycleTimeUnit = (data.isCycleTime && data.cycleTime && data.cycleTime > 0) ? (data.cycleTime * 1) : 0;
        const addRewardUnit = Number(data.addReward || 0);
        const nextDayFeeUnit = data.isNextDay ? 0.5 : 0;
        const goodsListTotal = data.goodsList.reduce((sum, g) => sum + (g.price * g.quantity), 0);
        const singleGoodsTotal = (data.goodsPrice || 0);
        const perOrderGoodsPrice = goodsListTotal > 0 ? goodsListTotal : singleGoodsTotal;
        const totalGoodsMoney = perOrderGoodsPrice * count;
        const goodsMoreFeeUnit = data.goodsList.length > 1 ? (data.goodsList.length - 1) * 1 : 0;
        const isFreeShipping = data.isFreeShipping === 1; const postagePerOrder = isFreeShipping ? 0 : 10; const marginPerOrder = isFreeShipping ? 0 : 10;
        const totalPostage = postagePerOrder * count; const totalMargin = marginPerOrder * count; const totalDeposit = totalGoodsMoney + totalPostage + totalMargin;
        const totalBaseService = baseFeePerOrder * count; const totalPraise = praiseFeeUnit * count; const totalTimingPublish = timingPublishFeeUnit * count; const totalTimingPay = timingPayFeeUnit * count; const totalCycle = cycleTimeUnit * count; const totalAddReward = addRewardUnit * count; const totalGoodsMoreFee = goodsMoreFeeUnit * count; const totalNextDayFee = nextDayFeeUnit * count;
        const totalCommission = totalBaseService + totalPraise + totalTimingPublish + totalTimingPay + totalCycle + totalAddReward + totalGoodsMoreFee + totalNextDayFee;
        if (totalDeposit !== data.totalDeposit || totalCommission !== data.totalCommission || goodsMoreFeeUnit !== data.goodsMoreFee || nextDayFeeUnit !== data.nextDayFee) { setData(prev => ({ ...prev, totalDeposit, totalCommission, baseServiceFee: baseFeePerOrder, praiseFee: praiseFeeUnit, timingPublishFee: timingPublishFeeUnit, timingPayFee: timingPayFeeUnit, cycleTimeFee: cycleTimeUnit, addRewardFee: addRewardUnit, goodsMoreFee: goodsMoreFeeUnit, nextDayFee: nextDayFeeUnit, postageMoney: totalPostage, marginMoney: totalMargin })); }
    };

    const handleDataChange = (updates: Partial<TaskFormData>) => { setData(prev => ({ ...prev, ...updates })); };

    const handleSubmit = async () => {
        setLoading(true); const token = localStorage.getItem('merchantToken');
        try {
            if (data.isPasswordEnabled) {
                if (!data.checkPassword || data.checkPassword.trim().length === 0) { alert('开启口令验证后必须填写口令'); setLoading(false); return; }
                if (data.checkPassword.length < 4 || data.checkPassword.length > 10) { alert('口令需为4-10个详情页文字'); setLoading(false); return; }
            }
            if (data.isPraise && data.praiseType === 'text') { const filled = data.praiseList.filter(s => s && s.trim().length > 0); if (filled.length !== data.count) { alert(`请填写所有 ${data.count} 条好评内容`); setLoading(false); return; } }
            const payload = { ...data, goodsPrice: Number(data.goodsPrice), count: Number(data.count), addReward: Number(data.addReward), extraCommission: Number(data.addReward) };
            const res = await fetch(`${BASE_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json(); if (json.success) { alert('任务发布成功！'); router.push('/merchant/tasks'); } else alert('发布失败: ' + (json.message || '未知错误'));
        } catch { alert('网络错误'); } finally { setLoading(false); }
    };

    const steps = [{ num: 1, label: '基础信息' }, { num: 2, label: '增值服务' }, { num: 3, label: '支付确认' }];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-900">发布新任务</h1>

            {/* Steps Progress */}
            <Card className="rounded-[32px] border-0 bg-white px-8 py-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="mx-auto flex max-w-4xl items-center">
                    {steps.map((s, i) => (
                        <div key={s.num} className={cn('flex items-center', i === 2 ? 'flex-none' : 'flex-1')}>
                            <div className="relative flex flex-col items-center gap-3">
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-all duration-300',
                                    step >= s.num ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-100 text-slate-400'
                                )}>
                                    {step > s.num ? '✓' : s.num}
                                </div>
                                <div className={cn('text-sm font-bold transition-colors duration-300', step >= s.num ? 'text-primary-700' : 'text-slate-400')}>{s.label}</div>
                            </div>
                            {i < 2 && (
                                <div className="mx-4 mb-8 h-1 flex-1 rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
                                        style={{ width: step > s.num ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Content */}
            <div className="mx-auto min-h-[600px] max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {step === 1 && <Step1BasicInfo data={data} onChange={handleDataChange} onNext={() => setStep(2)} />}
                {step === 2 && <Step2ValueAdded data={data} onChange={handleDataChange} onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
                {step === 3 && <Step3Payment data={data} merchant={merchant} onPrev={() => setStep(2)} onSubmit={handleSubmit} loading={loading} />}
            </div>
        </div>
    );
}

