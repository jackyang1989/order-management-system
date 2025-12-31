'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchTasks } from '../../../services/taskService'; // Re-using for mock data finding
import { createOrder } from '../../../services/orderService';
import { fetchBuyerAccounts } from '../../../services/userService';
import { MockTask } from '../../../mocks/taskMock';
import { MockBuyerAccount } from '../../../mocks/userMock';
import { isAuthenticated } from '../../../services/authService';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use()
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
        setBuyerAccounts(accounts.filter(acc => acc.status === 'APPROVED')); // 只显示审核通过的
    };

    const loadTask = async () => {
        setLoading(true);
        // optimizing: in a real app, we would have a fetchTaskById API
        // here we reuse fetchTasks and find the item
        const result = await fetchTasks();
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
            const success = await createOrder(task.id, buyerAccount);
            if (success) {
                alert('领取成功！请前往订单列表查看');
                router.push('/orders');
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

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    if (!task) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5'
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', width: '30px' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>任务详情</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 任务信息卡片 */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                    任务基本信息
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                    <div>任务编号：{task.taskNumber}</div>
                    <div>任务类型：{task.taskType === 'KEYWORD' ? '关键词搜索' : '其他'}</div>
                    <div>返款方式：{task.terminal}</div>
                    <div>商品价格：<span style={{ color: '#f56c6c' }}>¥{task.goodsPrice}</span></div>
                    <div>任务佣金：<span style={{ color: '#07c160' }}>¥{task.commission}</span></div>
                    <div>剩余数量：{task.totalCount - (task.claimCount || 0)} 单</div>
                </div>
            </div>

            {/* 操作要求 */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                    任务要求
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                    <p>1. 必须使用指定的买号进行操作。</p>
                    <p>2. 请严格按照搜索关键词找到商品。</p>
                    <p>3. 浏览主图、详情页需满3分钟。</p>
                    <p>4. 禁止秒拍，聊天下单需先进行假聊。</p>
                    <div style={{ marginTop: '10px', padding: '10px', background: '#fdf6ec', color: '#e6a23c', borderRadius: '4px' }}>
                        注意：未按要求操作可能导致无法审核通过或佣金扣除。
                    </div>
                </div>
            </div>

            {/* 领取操作 */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '14px', marginBottom: '10px' }}>选择接单买号</div>
                <select
                    value={buyerAccount}
                    onChange={(e) => setBuyerAccount(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        background: '#fff',
                        marginBottom: '15px'
                    }}
                >
                    <option value="">请选择买号...</option>
                    {buyerAccounts.map(acc => (
                        <option key={acc.id} value={acc.accountName}>
                            {acc.accountName} ({acc.platform})
                        </option>
                    ))}
                </select>
            </div>

            {/* 底部固定按钮 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: '540px',
                margin: '0 auto',
                padding: '10px 15px',
                background: '#fff',
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: '10px'
            }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        flex: 1,
                        background: '#fff',
                        border: '1px solid #dcdfe6',
                        color: '#606266',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                >
                    取消
                </button>
                <button
                    onClick={handleClaim}
                    disabled={submitting}
                    style={{
                        flex: 2,
                        background: submitting ? '#a0cfff' : '#409eff',
                        border: 'none',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    {submitting ? '领取中...' : '立即领取'}
                </button>
            </div>
        </div>
    );
}
