'use client';

import { TaskFormData } from './types';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';

interface StepProps { data: TaskFormData; merchant: { balance: number; silver: number; username: string } | null; onPrev: () => void; onSubmit: () => void; loading: boolean; }

export default function Step3Payment({ data, merchant, onPrev, onSubmit, loading }: StepProps) {
    const f = (n: number | string | undefined | null): string => { const num = Number(n); return isNaN(num) ? '0.00' : num.toFixed(2); };
    const canSubmit = merchant && merchant.balance >= data.totalDeposit && merchant.silver >= 0;

    return (
        <div className="p-6">
            <h2 className="mb-6 text-lg font-bold text-[#3b4559]">第三步：费用确认与支付</h2>

            <div className="mb-8 flex gap-6">
                {/* Fee List */}
                <div className="flex-1 rounded-md border border-[#e5e7eb] bg-white p-6">
                    <h3 className="mb-5 border-b border-[#f3f4f6] pb-3 text-base font-semibold">费用清单 ({data.count} 单)</h3>

                    {/* Deposit Section */}
                    <div className="mb-6">
                        <div className="mb-3 text-sm font-medium text-[#374151]">本金/押金部分</div>
                        <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>商品本金 ({data.goodsPrice} × {data.count})</span><span>¥{f(data.goodsPrice * data.count)}</span></div>
                        <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>运费 ({data.postageMoney / data.count} × {data.count})</span><span>¥{f(data.postageMoney)}</span></div>
                        <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>商家保证金 (10.00 × {data.count})</span><span>¥{f(data.marginMoney)}</span></div>
                        <div className="mt-3 flex justify-between border-t border-dashed border-[#e5e7eb] pt-3 font-semibold text-[#3b4559]"><span>押金总计</span><span className="text-lg text-success-400">¥{f(data.totalDeposit)}</span></div>
                    </div>

                    {/* Commission Section */}
                    <div>
                        <div className="mb-3 text-sm font-medium text-[#374151]">佣金/服务费部分</div>
                        <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>基础服务费 ({data.baseServiceFee} × {data.count})</span><span>¥{f(data.baseServiceFee * data.count)}</span></div>
                        {data.praiseFee > 0 && <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>好评增值费 ({data.praiseFee} × {data.count})</span><span>¥{f(data.praiseFee * data.count)}</span></div>}
                        {data.timingPublishFee > 0 && <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>定时发布费 (1.00 × {data.count})</span><span>¥{f(data.timingPublishFee * data.count)}</span></div>}
                        {data.timingPayFee > 0 && <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>定时付款费 (1.00 × {data.count})</span><span>¥{f(data.timingPayFee * data.count)}</span></div>}
                        {data.addRewardFee > 0 && <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>额外悬赏费 ({data.addReward} × {data.count})</span><span>¥{f(data.addRewardFee * data.count)}</span></div>}
                        {data.cycleTimeFee > 0 && <div className="mb-2 flex justify-between text-sm text-[#6b7280]"><span>周期延长费 ({f(data.cycleTimeFee)} × {data.count})</span><span>¥{f(Number(data.cycleTimeFee) * Number(data.count))}</span></div>}
                        <div className="mt-3 flex justify-between border-t border-dashed border-[#e5e7eb] pt-3 font-semibold text-[#3b4559]"><span>银锭/佣金总计</span><span className="text-lg text-warning-500">¥{f(data.totalCommission)}</span></div>
                    </div>
                </div>

                {/* Balance Panel */}
                <div className="w-[300px] rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-6">
                    <h3 className="mb-5 text-base font-semibold">账户余额</h3>
                    <div className="mb-4">
                        <div className="mb-1 text-[13px] text-[#6b7280]">可用本金余额</div>
                        <div className="text-2xl font-bold text-[#3b4559]">¥{merchant ? f(merchant.balance) : '0.00'}</div>
                        {merchant && merchant.balance < data.totalDeposit && <div className="mt-1 text-xs text-danger-500">余额不足，需充值 {f(data.totalDeposit - merchant.balance)}</div>}
                    </div>
                    <div className="mb-8">
                        <div className="mb-1 text-[13px] text-[#6b7280]">可用银锭</div>
                        <div className="text-2xl font-bold text-[#3b4559]">{merchant ? f(merchant.silver) : '0.00'}</div>
                        {merchant && merchant.silver < data.totalCommission && <div className="mt-1 text-xs text-danger-500">银锭不足，需充值 {f(data.totalCommission - merchant.silver)}</div>}
                    </div>
                    <button className="mb-3 w-full rounded-md border border-[#d1d5db] bg-white px-2.5 py-2.5">💰 去充值</button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-6">
                <Button variant="secondary" onClick={onPrev} disabled={loading}>上一步</Button>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-xs text-[#6b7280]">实付总额</div>
                        <div className="text-xl font-bold text-danger-500">¥{f(data.totalDeposit + data.totalCommission)}</div>
                    </div>
                    <Button onClick={onSubmit} disabled={loading || !canSubmit} className={cn('flex items-center gap-2 px-12 text-base font-semibold', (!canSubmit || loading) && 'cursor-not-allowed bg-[#9ca3af]')}>{loading ? '提交中...' : '确认发布'}</Button>
                </div>
            </div>
        </div>
    );
}
