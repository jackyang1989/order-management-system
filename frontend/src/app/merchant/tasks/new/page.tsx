'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { TaskFormData, InitialTaskData } from './_components/types';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2ValueAdded from './_components/Step2ValueAdded';
import Step3Payment from './_components/Step3Payment';
import { cn } from '../../../../lib/utils';

interface MerchantProfile { balance: number; silver: number; username: string; }

export default function NewTaskPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<TaskFormData>(InitialTaskData);
    const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadMerchantProfile(); }, []);
    useEffect(() => { calculateFees(); }, [data.goodsPrice, data.count, data.isPraise, data.praiseType, data.isTimingPublish, data.isTimingPay, data.isCycleTime, data.addReward, data.isFreeShipping]);

    const loadMerchantProfile = async () => {
        const token = localStorage.getItem('merchantToken'); if (!token) return;
        try { const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } }); const json = await res.json(); if (json.success) setMerchant(json.data); } catch (e) { console.error(e); }
    };

    const calculateFees = () => {
        const count = data.count || 1; const baseFeePerOrder = 5.0;
        let praiseFeeUnit = 0; if (data.isPraise) { if (data.praiseType === 'text') praiseFeeUnit = 2.0; if (data.praiseType === 'image') praiseFeeUnit = 4.0; if (data.praiseType === 'video') praiseFeeUnit = 10.0; }
        const timingPublishFeeUnit = data.isTimingPublish ? 1.0 : 0; const timingPayFeeUnit = data.isTimingPay ? 1.0 : 0;
        const cycleTimeUnit = (data.isCycleTime && data.cycleTime && data.cycleTime > 0) ? (data.cycleTime * 1) : 0;
        const addRewardUnit = Number(data.addReward || 0); const totalGoodsMoney = (data.goodsPrice || 0) * count;
        const isFreeShipping = data.isFreeShipping === 1; const postagePerOrder = isFreeShipping ? 0 : 10; const marginPerOrder = isFreeShipping ? 0 : 10;
        const totalPostage = postagePerOrder * count; const totalMargin = marginPerOrder * count; const totalDeposit = totalGoodsMoney + totalPostage + totalMargin;
        const totalBaseService = baseFeePerOrder * count; const totalPraise = praiseFeeUnit * count; const totalTimingPublish = timingPublishFeeUnit * count; const totalTimingPay = timingPayFeeUnit * count; const totalCycle = cycleTimeUnit * count; const totalAddReward = addRewardUnit * count;
        const totalCommission = totalBaseService + totalPraise + totalTimingPublish + totalTimingPay + totalCycle + totalAddReward;
        if (totalDeposit !== data.totalDeposit || totalCommission !== data.totalCommission) { setData(prev => ({ ...prev, totalDeposit, totalCommission, baseServiceFee: baseFeePerOrder, praiseFee: praiseFeeUnit, timingPublishFee: timingPublishFeeUnit, timingPayFee: timingPayFeeUnit, cycleTimeFee: cycleTimeUnit, addRewardFee: addRewardUnit, postageMoney: totalPostage, marginMoney: totalMargin })); }
    };

    const handleDataChange = (updates: Partial<TaskFormData>) => { setData(prev => ({ ...prev, ...updates })); };

    const handleSubmit = async () => {
        setLoading(true); const token = localStorage.getItem('merchantToken');
        try {
            if (data.isPraise && data.praiseType === 'text') { const filled = data.praiseList.filter(s => s && s.trim().length > 0); if (filled.length !== data.count) { alert(`请填写所有 ${data.count} 条好评内容`); setLoading(false); return; } }
            const payload = { ...data, goodsPrice: Number(data.goodsPrice), count: Number(data.count), addReward: Number(data.addReward), extraCommission: Number(data.addReward) };
            const res = await fetch(`${BASE_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json(); if (json.success) { alert('任务发布成功！'); router.push('/merchant/tasks'); } else alert('发布失败: ' + (json.message || '未知错误'));
        } catch { alert('网络错误'); } finally { setLoading(false); }
    };

    const steps = [{ num: 1, label: '基础信息' }, { num: 2, label: '增值服务' }, { num: 3, label: '支付确认' }];

    return (
        <div>
            {/* Steps Progress */}
            <div className="mb-2 border-b border-slate-200 bg-white px-8 py-6">
                <div className="mx-auto flex max-w-[800px] items-center">
                    {steps.map((s, i) => (
                        <div key={s.num} className={cn('flex items-center', i === 2 ? 'flex-none' : 'flex-1')}>
                            <div className={cn('flex items-center gap-2', step >= s.num ? 'opacity-100' : 'opacity-40')}>
                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full font-bold', step >= s.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500')}>{s.num}</div>
                                <div className={cn('text-slate-800', step >= s.num ? 'font-semibold' : 'font-normal')}>{s.label}</div>
                            </div>
                            {i < 2 && <div className={cn('mx-4 h-0.5 flex-1', step > s.num ? 'bg-indigo-600' : 'bg-slate-200')} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto my-6 min-h-[600px] max-w-[1000px] rounded-xl bg-white">
                {step === 1 && <Step1BasicInfo data={data} onChange={handleDataChange} onNext={() => setStep(2)} />}
                {step === 2 && <Step2ValueAdded data={data} onChange={handleDataChange} onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
                {step === 3 && <Step3Payment data={data} merchant={merchant} onPrev={() => setStep(2)} onSubmit={handleSubmit} loading={loading} />}
            </div>
        </div>
    );
}
