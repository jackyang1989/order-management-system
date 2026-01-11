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
    useEffect(() => { calculateFees(); }, [data.goodsPrice, data.goodsList, data.count, data.isPraise, data.praiseType, data.isTimingPublish, data.isTimingPay, data.isCycleTime, data.addReward, data.isFreeShipping, data.isNextDay]);

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
        // 多商品模式：计算goodsList总价；兼容单商品模式
        const goodsListTotal = data.goodsList.reduce((sum, g) => sum + (g.price * g.quantity), 0);
        const singleGoodsTotal = (data.goodsPrice || 0);
        const perOrderGoodsPrice = goodsListTotal > 0 ? goodsListTotal : singleGoodsTotal;
        const totalGoodsMoney = perOrderGoodsPrice * count;
        // 多商品额外费用：每多一个商品加1元（原版为2银锭）
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
            // 口令验证校验
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
        <div>
            {/* Steps Progress */}
            <div className="mb-2 border-b border-[#e5e7eb] bg-white px-8 py-6">
                <div className="mx-auto flex max-w-7xl items-center">
                    {steps.map((s, i) => (
                        <div key={s.num} className={cn('flex items-center', i === 2 ? 'flex-none' : 'flex-1')}>
                            <div className={cn('flex items-center gap-2', step >= s.num ? 'opacity-100' : 'opacity-40')}>
                                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full font-bold', step >= s.num ? 'bg-primary-600 text-white' : 'bg-[#e5e7eb] text-[#6b7280]')}>{s.num}</div>
                                <div className={cn('text-[#3b4559]', step >= s.num ? 'font-semibold' : 'font-normal')}>{s.label}</div>
                            </div>
                            {i < 2 && <div className={cn('mx-4 h-0.5 flex-1', step > s.num ? 'bg-primary-600' : 'bg-[#e5e7eb]')} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto my-6 min-h-[600px] max-w-7xl rounded-md bg-white">
                {step === 1 && <Step1BasicInfo data={data} onChange={handleDataChange} onNext={() => setStep(2)} />}
                {step === 2 && <Step2ValueAdded data={data} onChange={handleDataChange} onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
                {step === 3 && <Step3Payment data={data} merchant={merchant} onPrev={() => setStep(2)} onSubmit={handleSubmit} loading={loading} />}
            </div>
        </div>
    );
}
