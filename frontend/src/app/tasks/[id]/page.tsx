'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTaskList } from '../../../services/taskService';
import { createOrder } from '../../../services/orderService';
import { fetchBuyerAccounts } from '../../../services/userService';
import { MockTask } from '../../../mocks/taskMock';
import { MockBuyerAccount } from '../../../mocks/userMock';
import { isAuthenticated } from '../../../services/authService';
import { cn } from '../../../lib/utils';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [task, setTask] = useState<MockTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [buyerAccount, setBuyerAccount] = useState('');
    const [buyerAccounts, setBuyerAccounts] = useState<MockBuyerAccount[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTask();
        loadBuyerAccounts();
    }, [id, router]);

    const loadBuyerAccounts = async () => {
        const accounts = await fetchBuyerAccounts();
        setBuyerAccounts(accounts.filter(acc => acc.status === 'APPROVED'));
    };

    const loadTask = async () => {
        setLoading(true);
        const result = await fetchTaskList();
        const found = result.list.find(t => t.id === id);
        if (found) {
            setTask(found);
        } else {
            alert('任务不存在');
            router.back();
        }
        setLoading(false);
    };

    const handleClaim = async () => {
        if (!buyerAccount) {
            alert('请选择买号');
            return;
        }
        if (!task) return;

        if (!confirm(`确认使用买号 ${buyerAccount} 领取该任务吗？`)) return;

        setSubmitting(true);
        try {
            const result = await createOrder(task.id, buyerAccount);
            if (result && result.orderId) {
                alert('领取成功！立即开始任务');
                router.push(`/orders/${result.orderId}/execute`);
            } else {
                alert('领取失败，请稍后重试');
            }
        } catch (e) {
            console.error(e);
            alert('领取出错');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <span className="text-sm text-slate-500">加载中...</span>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
                <button onClick={() => router.back()} className="w-7 cursor-pointer text-xl">‹</button>
                <span className="text-base font-bold text-slate-800">任务详情</span>
                <div className="w-7" />
            </header>

            {/* Task Info Card */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-2.5 text-sm font-bold text-slate-800">
                    任务基本信息
                </div>
                <div className="space-y-1 text-xs leading-relaxed text-slate-500">
                    <div>任务编号：{task.taskNumber}</div>
                    <div>任务类型：{task.taskType === 'KEYWORD' ? '关键词搜索' : '其他'}</div>
                    <div>返款方式：{task.terminal}</div>
                    <div>商品价格：<span className="text-red-500">¥{task.goodsPrice}</span></div>
                    <div>任务佣金：<span className="text-green-500">¥{task.commission}</span></div>
                    <div>剩余数量：{task.totalCount - (task.claimCount || 0)} 单</div>
                </div>
            </div>

            {/* Task Requirements */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-2.5 text-sm font-bold text-slate-800">
                    任务要求
                </div>
                <div className="space-y-1 text-xs leading-relaxed text-slate-500">
                    <p>1. 必须使用指定的买号进行操作。</p>
                    <p>2. 请严格按照搜索关键词找到商品。</p>
                    <p>3. 浏览主图、详情页需满3分钟。</p>
                    <p>4. 禁止秒拍，聊天下单需先进行假聊。</p>
                    <div className="mt-2.5 rounded bg-amber-50 p-2.5 text-amber-600">
                        注意：未按要求操作可能导致无法审核通过或佣金扣除。
                    </div>
                </div>
            </div>

            {/* Buyer Account Selection */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-2.5 text-sm">选择接单买号</div>
                <select
                    value={buyerAccount}
                    onChange={(e) => setBuyerAccount(e.target.value)}
                    className="mb-4 w-full rounded border border-slate-200 bg-white p-2.5 text-sm"
                >
                    <option value="">请选择买号...</option>
                    {buyerAccounts.map(acc => (
                        <option key={acc.id} value={acc.accountName}>
                            {acc.accountName} ({acc.platform})
                        </option>
                    ))}
                </select>
            </div>

            {/* Fixed Bottom Button Bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-md gap-2.5 px-4 py-2.5">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-600"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleClaim}
                        disabled={submitting}
                        className={cn(
                            'flex-[2] rounded px-2.5 py-2.5 text-sm font-bold text-white',
                            submitting ? 'bg-blue-300' : 'bg-blue-500'
                        )}
                    >
                        {submitting ? '领取中...' : '立即领取'}
                    </button>
                </div>
            </div>
        </div>
    );
}
