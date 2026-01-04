'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { TaskFormData, InitialTaskData } from './_components/types';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2ValueAdded from './_components/Step2ValueAdded';
import Step3Payment from './_components/Step3Payment';

interface MerchantProfile {
    balance: number;
    silver: number;
    username: string;
}

export default function NewTaskPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<TaskFormData>(InitialTaskData);
    const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMerchantProfile();
    }, []);

    // Recalculate fees whenever relevant data changes
    useEffect(() => {
        calculateFees();
    }, [
        data.goodsPrice,
        data.count,
        data.isPraise,
        data.praiseType,
        data.isTimingPublish,
        data.isTimingPay,
        data.isCycleTime,
        data.addReward,
        data.isFreeShipping
    ]);

    const loadMerchantProfile = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setMerchant(json.data);
        } catch (e) {
            console.error(e);
        }
    };

    const calculateFees = () => {
        const count = data.count || 1;

        // 1. Basic Fees
        const baseFeePerOrder = 5.0; // Mock: based on tier

        // 2. Value Added Fees (Unit Price)
        let praiseFeeUnit = 0;
        if (data.isPraise) {
            if (data.praiseType === 'text') praiseFeeUnit = 2.0;
            if (data.praiseType === 'image') praiseFeeUnit = 4.0;
            if (data.praiseType === 'video') praiseFeeUnit = 10.0;
        }
        const timingPublishFeeUnit = data.isTimingPublish ? 1.0 : 0;
        const timingPayFeeUnit = data.isTimingPay ? 1.0 : 0;
        const cycleTimeUnit = (data.isCycleTime && data.cycleTime && data.cycleTime > 0) ? (data.cycleTime * 1) : 0; // Assumption
        const addRewardUnit = Number(data.addReward || 0);

        const totalGoodsMoney = (data.goodsPrice || 0) * count;
        // Postage Logic: Free Shipping = 0 margin, else 10 margin. 
        // Postage Fee: Free=0, NotFree=10.
        // Postage Fee: Free=0 (1), NotFree=10 (2 or undefined).
        const isFreeShipping = data.isFreeShipping === 1; // Default true (1)
        const postagePerOrder = isFreeShipping ? 0 : 10;
        const marginPerOrder = isFreeShipping ? 0 : 10;

        const totalPostage = postagePerOrder * count;
        const totalMargin = marginPerOrder * count;

        const totalDeposit = totalGoodsMoney + totalPostage + totalMargin;

        const totalBaseService = baseFeePerOrder * count;
        const totalPraise = praiseFeeUnit * count;
        const totalTimingPublish = timingPublishFeeUnit * count;
        const totalTimingPay = timingPayFeeUnit * count;
        const totalCycle = cycleTimeUnit * count;
        const totalAddReward = addRewardUnit * count;

        const totalCommission =
            totalBaseService +
            totalPraise +
            totalTimingPublish +
            totalTimingPay +
            totalCycle +
            totalAddReward;

        // Update State
        if (
            totalDeposit !== data.totalDeposit ||
            totalCommission !== data.totalCommission
        ) {
            setData(prev => ({
                ...prev,
                totalDeposit,
                totalCommission,
                baseServiceFee: baseFeePerOrder,
                praiseFee: praiseFeeUnit,
                timingPublishFee: timingPublishFeeUnit,
                timingPayFee: timingPayFeeUnit,
                cycleTimeFee: cycleTimeUnit,
                addRewardFee: addRewardUnit,
                postageMoney: totalPostage,
                marginMoney: totalMargin
            }));
        }
    };

    const handleDataChange = (updates: Partial<TaskFormData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem('merchantToken');
        try {
            // Validate Praise List
            if (data.isPraise && data.praiseType === 'text') {
                // Filter empty
                const filled = data.praiseList.filter(s => s && s.trim().length > 0);
                if (filled.length !== data.count) {
                    alert(`请填写所有 ${data.count} 条好评内容`);
                    setLoading(false);
                    return;
                }
            }

            // Strict DTO Mapping
            const payload = {
                ...data,
                // Ensure number types
                goodsPrice: Number(data.goodsPrice),
                count: Number(data.count),
                addReward: Number(data.addReward),
                extraCommission: Number(data.addReward), // Map addReward to extraCommission (MerchantTaskDto field)

                // Detailed fields

                // Steps removed
            };

            const res = await fetch(`${BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                alert('任务发布成功！');
                router.push('/merchant/tasks');
            } else {
                alert('发布失败: ' + (json.message || '未知错误'));
            }
        } catch (error) {
            alert('网络错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Steps Progress */}
            <div style={{ background: '#fff', padding: '24px 32px', borderBottom: '1px solid #e5e7eb', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    {[1, 2, 3].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i === 2 ? 0 : 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step >= s ? 1 : 0.4 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: step >= s ? '#4f46e5' : '#e5e7eb',
                                    color: step >= s ? '#fff' : '#6b7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>{s}</div>
                                <div style={{ fontWeight: step >= s ? '600' : '400', color: '#1f2937' }}>
                                    {s === 1 ? '基础信息' : s === 2 ? '增值服务' : '支付确认'}
                                </div>
                            </div>
                            {i < 2 && (
                                <div style={{ flex: 1, height: '2px', background: step > s ? '#4f46e5' : '#e5e7eb', margin: '0 16px' }}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1000px', margin: '24px auto', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '600px' }}>
                {step === 1 && (
                    <Step1BasicInfo
                        data={data}
                        onChange={handleDataChange}
                        onNext={() => setStep(2)}
                    />
                )}
                {step === 2 && (
                    <Step2ValueAdded
                        data={data}
                        onChange={handleDataChange}
                        onPrev={() => setStep(1)}
                        onNext={() => setStep(3)}
                    />
                )}
                {step === 3 && (
                    <Step3Payment
                        data={data}
                        merchant={merchant}
                        onPrev={() => setStep(2)}
                        onSubmit={handleSubmit}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
