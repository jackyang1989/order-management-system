'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { TaskFormData, InitialTaskData } from './_components/types';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2ValueAdded from './_components/Step2ValueAdded';
import Step3Payment from './_components/Step3Payment';
import { cn } from '../../../../lib/utils';
import { Modal } from '../../../../components/ui/modal';
import { Button } from '../../../../components/ui/button';

interface MerchantProfile { balance: number; silver: number; merchantNo: string; }

export default function NewTaskPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<TaskFormData>(InitialTaskData);
    const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' }>({ open: false, title: '', message: '', type: 'success' });

    useEffect(() => { loadMerchantProfile(); }, []);
    useEffect(() => { calculateFees(); }, [data.goodsPrice, data.goodsList, data.count, data.orderPraiseConfigs, data.isTimingPublish, data.isTimingPay, data.isCycleTime, data.addReward, data.isFreeShipping, data.isNextDay, data.fastRefund, data.needRandomBrowse]);

    const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'warning') => {
        const titles = { success: '成功', error: '错误', warning: '提示' };
        setAlertModal({ open: true, title: titles[type], message, type });
    };

    const closeAlert = () => {
        setAlertModal({ open: false, title: '', message: '', type: 'success' });
    };

    const loadMerchantProfile = async () => {
        const token = localStorage.getItem('merchantToken'); if (!token) return;
        try { const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } }); const json = await res.json(); if (json.success) setMerchant(json.data); } catch (e) { console.error(e); }
    };

    const calculateFees = () => {
        const count = data.count || 1;
        const baseFeePerOrder = 5.0;

        // 新版：根据每单的好评类型分别计算好评费用
        let totalPraise = 0;
        if (data.orderPraiseConfigs && data.orderPraiseConfigs.length > 0) {
            data.orderPraiseConfigs.forEach(config => {
                if (config.type === 'text') totalPraise += 2.0;
                else if (config.type === 'image') totalPraise += 4.0;
                else if (config.type === 'video') totalPraise += 10.0;
            });
        }

        const timingPublishFeeUnit = data.isTimingPublish ? 1.0 : 0;
        const timingPayFeeUnit = data.isTimingPay ? 1.0 : 0;
        const cycleTimeUnit = (data.isCycleTime && data.cycleTime && data.cycleTime > 0) ? (data.cycleTime * 1) : 0;
        const addRewardUnit = Number(data.addReward || 0);
        const nextDayFeeUnit = data.isNextDay ? 0.5 : 0;
        const randomBrowseFeeUnit = data.needRandomBrowse ? 0.5 : 0;

        // 多商品模式：计算goodsList总价；兼容单商品模式
        const goodsListTotal = data.goodsList.reduce((sum, g) => sum + (g.price * g.quantity), 0);
        const singleGoodsTotal = (data.goodsPrice || 0);
        const perOrderGoodsPrice = goodsListTotal > 0 ? goodsListTotal : singleGoodsTotal;
        const totalGoodsMoney = perOrderGoodsPrice * count;

        // 多商品额外费用：每多一个商品加1元（原版为2银锭）
        const goodsMoreFeeUnit = data.goodsList.length > 1 ? (data.goodsList.length - 1) * 1 : 0;
        const isFreeShipping = data.isFreeShipping === 1;
        const postagePerOrder = isFreeShipping ? 0 : 10;
        const marginPerOrder = isFreeShipping ? 0 : 10;
        const totalPostage = postagePerOrder * count;
        const totalMargin = marginPerOrder * count;
        const totalDeposit = totalGoodsMoney + totalPostage + totalMargin;

        const totalBaseService = baseFeePerOrder * count;
        const totalTimingPublish = timingPublishFeeUnit * count;
        const totalTimingPay = timingPayFeeUnit * count;
        const totalCycle = cycleTimeUnit * count;
        const totalAddReward = addRewardUnit * count;
        const totalGoodsMoreFee = goodsMoreFeeUnit * count;
        const totalNextDayFee = nextDayFeeUnit * count;
        const totalRandomBrowseFee = randomBrowseFeeUnit * count;

        const totalCommission = totalBaseService + totalPraise + totalTimingPublish + totalTimingPay + totalCycle + totalAddReward + totalGoodsMoreFee + totalNextDayFee + totalRandomBrowseFee;

        if (totalDeposit !== data.totalDeposit || totalCommission !== data.totalCommission || goodsMoreFeeUnit !== data.goodsMoreFee || nextDayFeeUnit !== data.nextDayFee || randomBrowseFeeUnit !== data.randomBrowseFee) {
            setData(prev => ({
                ...prev,
                totalDeposit,
                totalCommission,
                baseServiceFee: baseFeePerOrder,
                praiseFee: totalPraise / count, // 平均每单的好评费用
                timingPublishFee: timingPublishFeeUnit,
                timingPayFee: timingPayFeeUnit,
                cycleTimeFee: cycleTimeUnit,
                addRewardFee: addRewardUnit,
                goodsMoreFee: goodsMoreFeeUnit,
                nextDayFee: nextDayFeeUnit,
                randomBrowseFee: randomBrowseFeeUnit,
                postageMoney: totalPostage,
                marginMoney: totalMargin
            }));
        }
    };

    const handleDataChange = (updates: Partial<TaskFormData>) => { setData(prev => ({ ...prev, ...updates })); };

    const handleSubmit = async () => {
        setLoading(true); 
        const token = localStorage.getItem('merchantToken');
        try {
            // 验证商品列表不能为空
            if (!data.goodsList || data.goodsList.length === 0) {
                showAlert('请至少添加一个商品！点击"添加商品"按钮或从商品库选择商品。', 'warning');
                setLoading(false);
                return;
            }

            // 口令验证校验：检查商品列表中是否有商品设置了verifyCode
            if (data.isPasswordEnabled) {
                const hasVerifyCode = data.goodsList.some(g => g.verifyCode && g.verifyCode.trim().length > 0);
                if (!hasVerifyCode) {
                    showAlert('开启口令验证后，请在第一步商品设置中至少为一个商品填写核对口令', 'warning');
                    setLoading(false);
                    return;
                }
            }

            // 新版：验证每单的好评配置
            if (data.orderPraiseConfigs && data.orderPraiseConfigs.length > 0) {
                for (let i = 0; i < data.orderPraiseConfigs.length; i++) {
                    const config = data.orderPraiseConfigs[i];
                    if (config.type === 'text' && (!config.text || config.text.trim() === '')) {
                        showAlert(`第 ${i + 1} 单选择了文字评价，请填写评价内容`, 'warning');
                        setLoading(false);
                        return;
                    }
                    if (config.type === 'image' && (!config.images || config.images.length === 0)) {
                        showAlert(`第 ${i + 1} 单选择了图文评价，请至少上传1张图片`, 'warning');
                        setLoading(false);
                        return;
                    }
                    if (config.type === 'video' && (!config.video || config.video.trim() === '')) {
                        showAlert(`第 ${i + 1} 单选择了视频图文评价，请上传视频`, 'warning');
                        setLoading(false);
                        return;
                    }
                }
            }
            
            const payload = { 
                ...data, 
                goodsPrice: Number(data.goodsPrice), 
                count: Number(data.count), 
                addReward: Number(data.addReward), 
                extraCommission: Number(data.addReward),
                // 自动根据商品数量计算hasSubProduct
                hasSubProduct: data.goodsList && data.goodsList.length > 1
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
                showAlert('任务发布成功！', 'success');
                setTimeout(() => {
                    router.push('/merchant/tasks');
                }, 1500); 
            } else {
                showAlert('发布失败: ' + (json.message || '未知错误'), 'error');
            }
        } catch { 
            showAlert('网络错误', 'error'); 
        } finally { 
            setLoading(false); 
        }
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

            {/* Alert Modal */}
            <Modal
                open={alertModal.open}
                onClose={closeAlert}
                className="max-w-md"
            >
                <div className="text-center">
                    <div className="mb-4">
                        {alertModal.type === 'success' && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><span className="text-2xl">✓</span></div>}
                        {alertModal.type === 'error' && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><span className="text-2xl">✕</span></div>}
                        {alertModal.type === 'warning' && <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100"><span className="text-2xl">⚠</span></div>}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{alertModal.title}</h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{alertModal.message}</p>
                    <div className="mt-6">
                        <Button
                            onClick={closeAlert}
                            className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                        >
                            确定
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
