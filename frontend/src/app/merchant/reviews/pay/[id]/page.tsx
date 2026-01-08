'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';

interface ReviewTask { id: string; taskNumber: string; money: number; userMoney: number; state: number; createdAt: string; }
interface MerchantBalance { balance: number; silver: number; }

export default function PayReviewPage() {
    const router = useRouter();
    const params = useParams();
    const reviewTaskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [task, setTask] = useState<ReviewTask | null>(null);
    const [balance, setBalance] = useState<MerchantBalance>({ balance: 0, silver: 0 });
    const [useReward, setUseReward] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadData(); }, [reviewTaskId]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) { router.push('/merchant/login'); return; }
        setLoading(true);
        try {
            const taskRes = await fetch(`${BASE_URL}/review-tasks/${reviewTaskId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const taskJson = await taskRes.json();
            if (!taskJson.success || !taskJson.data) { setError('追评任务不存在'); setLoading(false); return; }
            if (taskJson.data.state !== 0) { setError('该任务已支付或状态不正确'); setLoading(false); return; }
            setTask(taskJson.data);

            const profileRes = await fetch(`${BASE_URL}/merchants/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            const profileJson = await profileRes.json();
            if (profileJson.success && profileJson.data) setBalance({ balance: Number(profileJson.data.balance) || 0, silver: Number(profileJson.data.silver) || 0 });
        } catch (e) { console.error(e); setError('加载数据失败'); }
        finally { setLoading(false); }
    };

    const calculatePayment = () => {
        if (!task) return { silverDeduct: 0, balanceDeduct: 0, canPay: false };
        const total = Number(task.money);
        let silverDeduct = 0, balanceDeduct = 0;
        if (!useReward) { balanceDeduct = total; }
        else {
            if (total > balance.silver) { silverDeduct = balance.silver; balanceDeduct = total - balance.silver; }
            else { silverDeduct = total; }
        }
        const canPay = (silverDeduct + balanceDeduct) <= (balance.silver + balance.balance) && balanceDeduct <= balance.balance;
        return { silverDeduct, balanceDeduct, canPay };
    };

    const { silverDeduct, balanceDeduct, canPay } = calculatePayment();

    const handlePay = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !task) return;
        if (!canPay) { alert('余额不足，请充值'); return; }
        if (!confirm(`确认支付 ¥${Number(task.money).toFixed(2)}？`)) return;
        setPaying(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/pay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reviewTaskId: task.id, useReward }) });
            const json = await res.json();
            if (json.success) { alert('支付成功！等待管理员审核'); router.push('/merchant/reviews'); }
            else alert(json.message || '支付失败');
        } catch { alert('网络错误'); }
        finally { setPaying(false); }
    };

    if (loading) return <div className="py-12 text-center text-[#f9fafb]0">加载中...</div>;

    if (error) {
        return (
            <div className="py-12 text-center">
                <div className="mb-4 text-5xl">⚠️</div>
                <div className="mb-6 text-red-500">{error}</div>
                <Button variant="secondary" onClick={() => router.push('/merchant/reviews')}>返回</Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold">支付追评费用</h1>
                <p className="mt-2 text-sm text-[#f9fafb]0">任务编号: {task?.taskNumber}</p>
            </div>

            {/* Amount Card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 p-8 text-center text-white">
                <div className="mb-2 text-sm opacity-90">需支付</div>
                <div className="text-5xl font-bold">¥{task ? Number(task.money).toFixed(2) : '0.00'}</div>
                <div className="mt-2 text-sm opacity-80">买手佣金: ¥{task ? Number(task.userMoney).toFixed(2) : '0.00'}</div>
            </div>

            {/* Balance Card */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 font-semibold">账户余额</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-amber-50 p-4 text-center">
                        <div className="text-sm text-amber-800">银锭余额</div>
                        <div className="mt-1 text-2xl font-bold text-amber-600">{balance.silver.toFixed(2)}</div>
                    </div>
                    <div className="rounded-md bg-blue-50 p-4 text-center">
                        <div className="text-sm text-blue-800">押金余额</div>
                        <div className="mt-1 text-2xl font-bold text-blue-600">¥{balance.balance.toFixed(2)}</div>
                    </div>
                </div>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 font-semibold">支付方式</h2>

                <div onClick={() => setUseReward(false)} className={cn('mb-3 flex cursor-pointer items-center gap-3 rounded-md border-2 p-4', !useReward ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb]')}>
                    <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', !useReward ? 'border-primary-500' : 'border-[#d1d5db]')}>
                        {!useReward && <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
                    </div>
                    <div>
                        <div className="font-medium">纯押金支付</div>
                        <div className="mt-0.5 text-sm text-[#f9fafb]0">使用押金余额支付全部费用</div>
                    </div>
                </div>

                <div onClick={() => setUseReward(true)} className={cn('flex cursor-pointer items-center gap-3 rounded-md border-2 p-4', useReward ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb]')}>
                    <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border-2', useReward ? 'border-primary-500' : 'border-[#d1d5db]')}>
                        {useReward && <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />}
                    </div>
                    <div>
                        <div className="font-medium">银锭优先支付</div>
                        <div className="mt-0.5 text-sm text-[#f9fafb]0">优先使用银锭，不足部分用押金补足</div>
                    </div>
                </div>
            </Card>

            {/* Payment Details */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 font-semibold">支付明细</h2>
                <div className="text-sm">
                    {silverDeduct > 0 && (
                        <div className="mb-2 flex justify-between"><span className="text-[#f9fafb]0">银锭扣除</span><span className="font-medium text-amber-600">{silverDeduct.toFixed(2)} 银锭</span></div>
                    )}
                    {balanceDeduct > 0 && (
                        <div className="mb-2 flex justify-between"><span className="text-[#f9fafb]0">押金扣除</span><span className="font-medium text-blue-600">¥{balanceDeduct.toFixed(2)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-[#f3f4f6] pt-3 font-semibold">
                        <span>合计</span><span className="text-red-500">¥{task ? Number(task.money).toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </Card>

            {/* Insufficient Balance Warning */}
            {!canPay && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">⚠️ 余额不足，请先充值</div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.back()} className="flex-1">返回</Button>
                <Button onClick={handlePay} disabled={paying || !canPay} className={cn('flex-[2]', (paying || !canPay) && 'cursor-not-allowed opacity-50')}>
                    {paying ? '支付中...' : `确认支付 ¥${task ? Number(task.money).toFixed(2) : '0.00'}`}
                </Button>
            </div>
        </div>
    );
}
