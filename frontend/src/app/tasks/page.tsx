'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchTasks } from '../../services/taskService';
import { fetchBuyerAccounts } from '../../services/userService';
import { MockTask } from '../../mocks/taskMock';
import { MockBuyerAccount } from '../../mocks/userMock';
import { isAuthenticated } from '../../services/authService';

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<MockTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskType, setTaskType] = useState('');
    const [terminal, setTerminal] = useState('');
    const [buynoId, setBuynoId] = useState('');
    const [buyerAccounts, setBuyerAccounts] = useState<MockBuyerAccount[]>([]);
    const [activeNav, setActiveNav] = useState<string | null>(null);

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
            setBuynoId(accountsResult[0].account); // Use account name as ID for consistency with OrderService mock for now
            // Or typically use accountsResult[0].id
        }
        setLoading(false);
    };

    const toggleNav = (nav: string) => {
        setActiveNav(activeNav === nav ? null : nav);
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
                            <option key={acc.id} value={acc.account}>
                                {acc.account} ({acc.platform})
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
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: '540px',
                margin: '0 auto',
                background: '#fff',
                borderTop: '1px solid #ddd',
                display: 'flex',
                height: '60px',
                zIndex: 1000
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    {activeNav === 'account' && (
                        <div style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fff',
                            border: '1px solid #ccc',
                            width: '120px',
                            textAlign: 'center'
                        }}>
                            <Link href="/profile/settings" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>基本信息</Link>
                            <Link href="/profile/payment" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>账户管理</Link>
                            <Link href="/profile/bind" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>买号管理</Link>
                            <Link href="/vip" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666' }}>会员VIP</Link>
                        </div>
                    )}
                    <div onClick={() => toggleNav('account')} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        color: activeNav === 'account' ? '#409eff' : '#606266'
                    }}>
                        <span style={{ fontSize: '22px' }}>👤</span>
                        <span style={{ fontSize: '11px', marginTop: '2px' }}>账号信息</span>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    {activeNav === 'tasks' && (
                        <div style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fff',
                            border: '1px solid #ccc',
                            width: '120px',
                            textAlign: 'center'
                        }}>
                            <Link href="/orders" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>继续任务</Link>
                            <Link href="/tasks" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#409eff', borderBottom: '1px solid #e5e5e5' }}>任务领取</Link>
                            <Link href="/orders" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666' }}>任务管理</Link>
                        </div>
                    )}
                    <div onClick={() => toggleNav('tasks')} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        background: '#ff976a',
                        color: 'white'
                    }}>
                        <span style={{ fontSize: '22px' }}>📋</span>
                        <span style={{ fontSize: '11px', marginTop: '2px' }}>任务大厅</span>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    {activeNav === 'funds' && (
                        <div style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fff',
                            border: '1px solid #ccc',
                            width: '120px',
                            textAlign: 'center'
                        }}>
                            <Link href="/profile/withdraw" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>本佣提现</Link>
                            <Link href="/profile/withdraw" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>提现记录</Link>
                            <Link href="/profile/withdraw" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>本金记录</Link>
                            <Link href="/profile/withdraw" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666' }}>银锭记录</Link>
                        </div>
                    )}
                    <div onClick={() => toggleNav('funds')} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        color: activeNav === 'funds' ? '#409eff' : '#606266'
                    }}>
                        <span style={{ fontSize: '22px' }}>💰</span>
                        <span style={{ fontSize: '11px', marginTop: '2px' }}>资金管理</span>
                    </div>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    {activeNav === 'invite' && (
                        <div style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#fff',
                            border: '1px solid #ccc',
                            width: '120px',
                            textAlign: 'center'
                        }}>
                            <Link href="/invite" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>邀请好友</Link>
                            <Link href="/invite" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666' }}>邀请记录</Link>
                        </div>
                    )}
                    <div onClick={() => toggleNav('invite')} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        cursor: 'pointer',
                        color: activeNav === 'invite' ? '#409eff' : '#606266'
                    }}>
                        <span style={{ fontSize: '22px' }}>🤝</span>
                        <span style={{ fontSize: '11px', marginTop: '2px' }}>好友邀请</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
