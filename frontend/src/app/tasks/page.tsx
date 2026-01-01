'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchTasks } from '../../services/taskService';
import { fetchBuyerAccounts } from '../../services/userService';
import { MockTask } from '../../mocks/taskMock';
import { MockBuyerAccount } from '../../mocks/userMock';
import { isAuthenticated } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<MockTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskType, setTaskType] = useState('');
    const [terminal, setTerminal] = useState('');
    const [buynoId, setBuynoId] = useState('');
    const [buyerAccounts, setBuyerAccounts] = useState<MockBuyerAccount[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [taskType, terminal, router]);

    const loadData = async () => {
        setLoading(true);
        const [tasksResult, accountsResult] = await Promise.all([
            fetchTasks({
                taskType: taskType || undefined,
                terminal: terminal || undefined
            }),
            fetchBuyerAccounts()
        ]);
        setTasks(tasksResult.list);
        setBuyerAccounts(accountsResult);

        // Auto-select first account if available and none selected
        if (accountsResult.length > 0 && !buynoId) {
            setBuynoId(accountsResult[0].accountName); // Use account name as ID for consistency with OrderService mock for now
            // Or typically use accountsResult[0].id
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5'
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>任务大厅</div>
                <div style={{ fontSize: '18px', cursor: 'pointer' }}>☰</div>
            </div>

            {/* 筛选区 - 紧凑版 */}
            <div style={{ background: '#fff', padding: '10px 15px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f9f9f9', paddingBottom: '8px' }}>
                    <div style={{ width: '80px', fontSize: '13px', color: '#666' }}>选择买号：</div>
                    <select
                        value={buynoId}
                        onChange={(e) => setBuynoId(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '13px',
                            background: '#fff'
                        }}
                    >
                        <option value="">请选择</option>
                        {buyerAccounts.map(acc => (
                            <option key={acc.id} value={acc.accountName}>
                                {acc.accountName} ({acc.platform})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f9f9f9', paddingBottom: '8px' }}>
                    <div style={{ width: '80px', fontSize: '13px', color: '#666' }}>返款方式：</div>
                    <select
                        value={terminal}
                        onChange={(e) => setTerminal(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '13px',
                            background: '#fff'
                        }}
                    >
                        <option value="">请选择</option>
                        <option value="1">本佣货返</option>
                        <option value="2">本立佣货</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '80px', fontSize: '13px', color: '#666' }}>任务类型：</div>
                    <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '6px',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            fontSize: '13px',
                            background: '#fff'
                        }}
                    >
                        <option value="">全部</option>
                        <option value="KEYWORD">关键词</option>
                        <option value="TAOKOULING">淘口令</option>
                        <option value="QR_CODE">二维码</option>
                    </select>
                </div>
            </div>

            {/* 任务列表 */}
            <div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        暂无任务
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} style={{
                            background: '#fff',
                            margin: '0 0 10px 0',
                            padding: '12px 15px',
                            borderBottom: '1px solid #f0f0f0'
                        }}>
                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>商家任务ID：{task.taskNumber?.slice(-6) || task.id.slice(-6)}</span>
                                    <span style={{ color: '#409eff' }}>可领取</span>
                                </div>
                                <div>商家：{task.sellerPhone?.slice(0, 4) || '****'}***</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>垫付资金：<span style={{ color: '#409eff', fontWeight: 'bold' }}>¥{task.goodsPrice || task.productPrice || 0}</span></span>
                                    <span>佣金：<span style={{ color: '#07c160', fontWeight: 'bold' }}>¥{task.commission}</span></span>
                                </div>
                                <div>任务领取进度：{task.claimCount ?? task.claimedCount ?? 0}/{task.totalCount}</div>
                            </div>
                            <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                <Link href={`/tasks/${task.id}`}>
                                    <button style={{
                                        background: '#07c160',
                                        border: 'none',
                                        borderRadius: '3px',
                                        padding: '6px 20px',
                                        color: 'white',
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}>
                                        添加任务单
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 底部导航 */}
            <BottomNav />
        </div>
    );
}
