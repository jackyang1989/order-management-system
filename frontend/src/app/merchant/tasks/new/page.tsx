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
        const cycleTimeFeeUnit = data.isCycleTime ? 1.0 : 0; // Mock 1.0/month
        const addRewardUnit = data.addReward || 0;

        // New Fees
        const genderFeeUnit = (data.gender === 'male' || data.gender === 'female') ? 1.0 : 0;
        const buyLimitFeeUnit = (data.buyLimit && data.buyLimit > 0) ? 0.5 : 0;

        // 3. Totals
        const totalBaseService = baseFeePerOrder * count;
        const totalPraise = praiseFeeUnit * count;
        const totalTimingPublish = timingPublishFeeUnit * count;
        const totalTimingPay = timingPayFeeUnit * count;
        const totalCycle = cycleTimeFeeUnit * count;
        const totalAddReward = addRewardUnit * count;
        const totalGender = genderFeeUnit * count;
        const totalBuyLimit = buyLimitFeeUnit * count;

        const totalCommission =
            totalBaseService +
            totalPraise +
            totalTimingPublish +
            totalTimingPay +
            totalCycle +
            totalAddReward +
            totalGender +
            totalBuyLimit;

        // 4. Deposit
        const goodsMoney = (data.goodsPrice || 0) * count;

        // Margin rule: Free shipping ? 0 : 10 (But wait, Task.php logic: if logistics!=1 => margin=0. if logistics==1 => if free_shipping==1 => margin=0 else margin=10)
        // Let's assume logistics=1 means "Seller ships".
        // Our UI has "isFreeShipping": 1 (Yes)
        // Task.php line 563: if is_free_shipping==1 margin=0.
        // So Margin is 0 if free shipping is checked.
        // But previously I set it to 10.
        // Current UI: "商家包邮 (默认)" which means isFreeShipping=1. So margin should be 0? 
        // Wait, Task.php line 566: else margin=10.
        // If user selects "Not Free Shipping" (isFreeShipping=2), then margin=10.
        // Our UI currently Only has '1'. I should add logic or keep it 0.
        // But backend Mock might expect 10 for safety if not strictly copying legacy.
        // Let's stick to Legacy: Free Shipping -> Margin = 0.
        // Wait, normally platforms require margin.
        // Let's re-read Task.php line 563.
        /*
           if (data['is_free_shiping'] == 1) { data['margin'] = 0; } else { data['margin'] = 10; }
        */
        const marginUnit = data.isFreeShipping === 1 ? 0 : 10.0;
        const postageUnit = data.isFreeShipping === 1 ? 0 : 10.0; // Mock postage if not free

        const totalMargin = marginUnit * count;
        const totalPostage = postageUnit * count;

        const totalDeposit = goodsMoney + totalMargin + totalPostage;

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
                cycleTimeFee: cycleTimeFeeUnit,
                addRewardFee: addRewardUnit,
                genderFee: genderFeeUnit,
                buyLimitFee: buyLimitFeeUnit,
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
                gender: data.gender,
                ageMin: Number(data.ageMin || 0),
                ageMax: Number(data.ageMax || 0),
                buyLimit: Number(data.buyLimit || 0),
                repurchaseLimit: Number(data.repurchaseLimit || 1),

                // Steps
                needHuobi: data.needHuobi,
                needShoucang: data.needShoucang,
                needJiagou: data.needJiagou,
                needJialiao: data.needJialiao,
                needGuanzhu: data.needGuanzhu,
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
