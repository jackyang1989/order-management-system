'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated } from '../../../services/authService';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { BASE_URL } from '../../../../apiConfig';
import BottomNav from '../../../components/BottomNav';

interface UserBalance {
    balance: number;
    silver: number;
}

export default function ConvertPage() {
    const router = useRouter();
    const [balanceData, setBalanceData] = useState<UserBalance | null>(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        fetchBalance();
    }, [router]);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/user/balance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setBalanceData(data.data);
            }
        } catch (error) {
            console.error('获取余额失败', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setResult({ success: false, message: '请输入有效金额' });
            return;
        }
        if (balanceData && numAmount > balanceData.balance) {
            setResult({ success: false, message: '本金余额不足' });
            return;
        }

        setSubmitting(true);
        setResult(null);
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/user/convert-balance-to-silver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount: numAmount }),
            });
            const data = await res.json();
            setResult(data);
            if (data.success) {
                setAmount('');
                fetchBalance();
            }
        } catch (error) {
            setResult({ success: false, message: '转换失败，请重试' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickAmount = (value: number | 'all') => {
        if (value === 'all' && balanceData) {
            setAmount(String(balanceData.balance));
        } else if (typeof value === 'number') {
            setAmount(String(value));
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* 顶部导航 */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="text-base font-medium text-slate-800">本金转银锭</h1>
                </div>
            </header>

            <div className="mx-4 mt-4 space-y-4">
                {/* 余额卡片 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xl font-bold text-green-600">
                            ¥{balanceData?.balance?.toFixed(2) || '0.00'}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">本金余额</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                        <div className="text-xl font-bold text-amber-500">
                            {balanceData?.silver?.toFixed(2) || '0.00'}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">银锭余额</div>
                    </div>
                </div>

                {/* 兑换说明 */}
                <Card title="兑换说明">
                    <div className="text-sm text-slate-600 space-y-1">
                        <p>• 本金与银锭按 <span className="font-bold text-blue-600">1:1</span> 比例兑换</p>
                        <p>• 兑换后银锭可用于接单押金、购买VIP等</p>
                        <p>• 本操作不可逆，请确认后再兑换</p>
                    </div>
                </Card>

                {/* 兑换表单 */}
                <Card title="兑换金额">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">输入兑换金额</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="请输入金额"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">元</span>
                            </div>
                        </div>

                        {/* 快捷金额 */}
                        <div className="flex flex-wrap gap-2">
                            {[50, 100, 200, 500].map((val) => (
                                <button
                                    key={val}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                                    onClick={() => handleQuickAmount(val)}
                                    disabled={!balanceData || balanceData.balance < val}
                                >
                                    {val}元
                                </button>
                            ))}
                            <button
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                                onClick={() => handleQuickAmount('all')}
                                disabled={!balanceData || balanceData.balance <= 0}
                            >
                                全部
                            </button>
                        </div>

                        {/* 结果提示 */}
                        {result && (
                            <div className={`rounded-lg p-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {result.message}
                            </div>
                        )}

                        {/* 提交按钮 */}
                        <Button
                            className="w-full"
                            onClick={handleConvert}
                            disabled={submitting || !amount || parseFloat(amount) <= 0}
                        >
                            {submitting ? '兑换中...' : '确认兑换'}
                        </Button>
                    </div>
                </Card>
            </div>

            <BottomNav />
        </div>
    );
}
