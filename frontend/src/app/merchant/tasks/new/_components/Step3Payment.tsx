'use client';

import { useMemo } from 'react';
import { TaskFormData } from './types';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Separator } from '../../../../../components/ui/separator';


interface StepProps {
    data: TaskFormData;
    merchant: { balance: number; silver: number; username: string } | null;
    onPrev: () => void;
    onSubmit: () => void;
    loading: boolean;
}

export default function Step3Payment({ data, merchant, onPrev, onSubmit, loading }: StepProps) {
    const f = (n: number | string | undefined | null): string => {
        const num = Number(n);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const canSubmit = merchant && merchant.balance >= data.totalDeposit && merchant.silver >= 0;

    // Calculate Goods Total (Multi-goods support)
    const goodsTotalInfo = useMemo(() => {
        if (data.goodsList.length > 0) {
            const total = data.goodsList.reduce((sum, g) => sum + (g.price * g.quantity), 0);
            return { price: total, isMulti: true, count: data.goodsList.length };
        }
        return { price: data.goodsPrice, isMulti: false, count: 1 };
    }, [data.goodsList, data.goodsPrice]);

    const FeeRow = ({ label, value, subLabel, isTotal = false, colorClass = "text-slate-600" }: { label: string; value: string; subLabel?: string; isTotal?: boolean; colorClass?: string }) => (
        <div className={cn("flex justify-between py-2 text-sm", isTotal ? "border-t border-dashed border-slate-200 mt-2 pt-4 font-bold" : "")}>
            <div className="flex flex-col">
                <span className={cn(isTotal ? "text-slate-900" : "text-slate-600")}>{label}</span>
                {subLabel && <span className="text-xs text-slate-400">{subLabel}</span>}
            </div>
            <span className={cn("font-medium", isTotal ? "text-lg" : "", colorClass)}>{value}</span>
        </div>
    );

    return (
        <div className="space-y-8 p-1">
            <h2 className="text-2xl font-black text-slate-900">第三步：费用确认与支付</h2>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Fee Detail List - Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-[32px] border-0 bg-white p-8 shadow-xl shadow-slate-200/50" noPadding>
                        <div className="p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-indigo-100 text-2xl">🧾</div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">费用清单</h3>
                                    <p className="text-sm text-slate-500">共 {data.count} 单任务</p>
                                </div>
                            </div>

                            <div className="grid gap-8 md:grid-cols-2">
                                {/* Deposit Part */}
                                <div className="rounded-[24px] bg-slate-50 p-6">
                                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">本金 / 押金部分</h4>
                                    <div className="space-y-1">
                                        {goodsTotalInfo.isMulti ? (
                                            <>
                                                <div className="mb-2 text-xs font-bold text-slate-500">商品明细 ({goodsTotalInfo.count}款):</div>
                                                {data.goodsList.map((g, i) => (
                                                    <div key={g.id} className="flex justify-between pl-2 text-xs text-slate-400">
                                                        <span className="truncate max-w-[120px]">{i + 1}. {g.name}</span>
                                                        <span>¥{f(g.price)} × {g.quantity}</span>
                                                    </div>
                                                ))}
                                                <FeeRow label={`商品本金小计`} subLabel={`${data.count} 单`} value={`¥${f(goodsTotalInfo.price * data.count)}`} />
                                            </>
                                        ) : (
                                            <FeeRow label="商品本金" subLabel={`¥${f(data.goodsPrice)} × ${data.count}`} value={`¥${f(data.goodsPrice * data.count)}`} />
                                        )}
                                        <FeeRow label="运费" subLabel={`¥${f(data.postageMoney / data.count || 0)} × ${data.count}`} value={`¥${f(data.postageMoney)}`} />
                                        <FeeRow label="商家保证金" subLabel={`¥10.00 × ${data.count}`} value={`¥${f(data.marginMoney)}`} />
                                        <FeeRow isTotal label="押金总计" value={`¥${f(data.totalDeposit)}`} colorClass="text-emerald-500" />
                                    </div>
                                </div>

                                {/* Commission Part */}
                                <div className="rounded-[24px] bg-slate-50 p-6">
                                    <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">佣金 / 服务费部分</h4>
                                    <div className="space-y-1">
                                        <FeeRow label="基础服务费" subLabel={`¥${f(data.baseServiceFee)} × ${data.count}`} value={`¥${f(data.baseServiceFee * data.count)}`} />
                                        {data.praiseFee > 0 && <FeeRow label="好评增值费" subLabel={`¥${f(data.praiseFee)} × ${data.count}`} value={`¥${f(data.praiseFee * data.count)}`} />}
                                        {data.timingPublishFee > 0 && <FeeRow label="定时发布费" subLabel={`¥1.00 × ${data.count}`} value={`¥${f(data.timingPublishFee * data.count)}`} />}
                                        {data.timingPayFee > 0 && <FeeRow label="定时付款费" subLabel={`¥1.00 × ${data.count}`} value={`¥${f(data.timingPayFee * data.count)}`} />}
                                        {data.addRewardFee > 0 && <FeeRow label="额外悬赏费" subLabel={`¥${f(data.addReward)} × ${data.count}`} value={`¥${f(data.addRewardFee * data.count)}`} />}
                                        {data.cycleTimeFee > 0 && <FeeRow label="周期延长费" subLabel={`¥${f(data.cycleTimeFee)} × ${data.count}`} value={`¥${f(Number(data.cycleTimeFee) * Number(data.count))}`} />}
                                        {data.goodsMoreFee > 0 && <FeeRow label="多商品费用" subLabel={`¥${f(data.goodsMoreFee)} × ${data.count}`} value={`¥${f(data.goodsMoreFee * data.count)}`} />}
                                        {data.nextDayFee > 0 && <FeeRow label="隔天任务费" subLabel={`¥0.50 × ${data.count}`} value={`¥${f(data.nextDayFee * data.count)}`} />}
                                        <FeeRow isTotal label="银锭/佣金总计" value={`¥${f(data.totalCommission)}`} colorClass="text-amber-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Balance Panel - Sidebar */}
                <div className="space-y-6">
                    <Card className="rounded-[32px] border-0 bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/20" noPadding>
                        <div className="p-8">
                            <h3 className="mb-6 text-lg font-bold">账户余额</h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="mb-1 text-sm text-slate-400">可用本金余额</div>
                                    <div className="flex items-end justify-between">
                                        <div className="text-3xl font-black text-white">¥{merchant ? f(merchant.balance) : '0.00'}</div>
                                    </div>
                                    {merchant && merchant.balance < data.totalDeposit && (
                                        <div className="mt-2 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400">
                                            余额不足，需充值 ¥{f(data.totalDeposit - merchant.balance)}
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-white/10" />

                                <div>
                                    <div className="mb-1 text-sm text-slate-400">可用银锭</div>
                                    <div className="flex items-end justify-between">
                                        <div className="text-3xl font-black text-amber-400">{merchant ? f(merchant.silver) : '0.00'}</div>
                                    </div>
                                    {merchant && merchant.silver < data.totalCommission && (
                                        <div className="mt-2 rounded-lg bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400">
                                            银锭不足，需充值 {f(data.totalCommission - merchant.silver)}
                                        </div>
                                    )}
                                </div>

                                <Button className="w-full rounded-[16px] bg-white h-12 text-slate-900 font-bold hover:bg-slate-100">立即充值</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-6 z-10">
                <div className="flex items-center justify-between rounded-[24px] bg-white/80 p-4 shadow-2xl backdrop-blur-md ring-1 ring-slate-200/50">
                    <Button
                        variant="secondary"
                        onClick={onPrev}
                        disabled={loading}
                        className="h-12 w-32 rounded-[16px] bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                    >
                        上一步
                    </Button>

                    <div className="flex items-center gap-6">
                        <div className="hidden text-right sm:block">
                            <div className="text-xs font-bold text-slate-500">实付总额</div>
                            <div className="text-2xl font-black text-red-500">¥{f(data.totalDeposit + data.totalCommission)}</div>
                        </div>
                        <Button
                            onClick={onSubmit}
                            disabled={loading || !canSubmit}
                            className={cn(
                                'h-14 rounded-[20px] bg-primary-600 px-12 text-lg font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:scale-105 hover:bg-primary-700 active:scale-95',
                                (!canSubmit || loading) && 'cursor-not-allowed bg-slate-300 shadow-none hover:scale-100 hover:bg-slate-300'
                            )}
                        >
                            {loading ? '提交中...' : '确认发布'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
