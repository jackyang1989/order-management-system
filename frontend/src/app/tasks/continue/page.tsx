'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================

// 显示用户已接但未完成的任务列表
// ========================

interface TaskItem {
    id: string;
    terminal: number;       // 1=本佣货返, 2=本立佣货
    task_type: string;      // 任务类型
    seller: string;         // 商家账号
    principal: number;      // 垫付本金
    commission: number;     // 佣金
    user_divided: number;   // 银锭分成
    user_buyno_wangwang: string; // 接手买号
    task_step: number;      // 当前步骤
    is_ys: number;          // 是否验收
}

export default function ContinueTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTasks();
    }, [router]);

    // ========================

    // ========================
    const loadTasks = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/maketask`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.code === 1) {
                setTasks(data.data?.list || []);
            } else {
                alertError(data.msg || '获取任务失败');
            }
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========================

    // ========================
    const gostep = (index: number) => {
        const task = tasks[index];
        const id = task.id;
        const taskStep = task.task_step;
        const ys = task.is_ys;


        if (ys === 1 && taskStep === 4) {
            router.push(`/task/${id}/wk`);
        } else {
            // 存储当前步骤到 sessionStorage
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('active', String(taskStep));
            }
            router.push(`/task/${id}/step`);
        }
    };

    // ========================

    // POST mobile/task/del_task
    // ========================
    const cancelActive = async (index: number) => {
        const confirmMsg = '是否放弃此条订单，每人每天前2单任务自行放弃不扣银锭，超出订单冻结的银锭将不会返还';

        if (confirm(confirmMsg)) {
            try {
                const task = tasks[index];
                const token = getToken();
                const response = await fetch(`${BASE_URL}/mobile/task/del_task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ id: task.id }),
                });
                const data = await response.json();

                if (data.code === 1) {
                    alertSuccess(data.msg || '放弃成功');
                    setTimeout(() => {
                        if (data.url) {
                            router.push(data.url);
                        } else {
                            loadTasks();
                        }
                    }, 2000);
                } else {
                    alertError(data.msg || '操作失败');
                }
            } catch (error) {
                alertError('网络错误');
            }
        }
    };


    const filterPhone = (val: string) => {
        if (!val || val.length < 11) return val;
        return val.substring(0, 3) + '****' + val.substring(7);
    };

    // 获取返款方式文本
    const getTerminalText = (terminal: number) => {
        return terminal === 1 ? '本佣货返' : terminal === 2 ? '本立佣货' : '-';
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>

            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>做任务</div>
                    <div
                        onClick={() => router.push('/tasks')}
                        style={{ fontSize: '14px', cursor: 'pointer', color: '#ff9500' }}
                    >
                        任务大厅
                    </div>
                </div>
            </div>


            <div style={{
                background: '#fff',
                padding: '14px 16px',
                borderBottom: '1px solid #e5e5e5',
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: '600',
                color: '#409eff'
            }}>
                做任务
            </div>


            <div style={{ padding: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : tasks.length === 0 ? (
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '40px',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>📋</div>
                        <div style={{ fontSize: '14px' }}>暂无待完成任务</div>
                        <button
                            onClick={() => router.push('/tasks')}
                            style={{
                                marginTop: '20px',
                                padding: '10px 24px',
                                background: '#409eff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '20px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            去接单
                        </button>
                    </div>
                ) : (
                    tasks.map((task, index) => (
                        <div key={task.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            marginBottom: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>

                            <div style={{ padding: '16px' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>商家账号：</span>
                                    <span style={{ color: '#333' }}>{filterPhone(task.seller)}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>任务类型：</span>
                                    <span style={{ color: '#333' }}>{task.task_type}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>接手买号：</span>
                                    <span style={{ color: '#333' }}>{task.user_buyno_wangwang}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>垫付本金：</span>
                                    <span style={{ color: '#409eff', fontWeight: '600' }}>¥{task.principal}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '10px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>任务佣金：</span>
                                    <span style={{ color: '#1677ff', fontWeight: '600' }}>
                                        {task.commission}<span style={{ color: '#ffd700' }}>+{task.user_divided}银锭</span>
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: '#666' }}>返款方式：</span>
                                    <span style={{ color: '#333' }}>{getTerminalText(task.terminal)}</span>
                                </div>
                            </div>


                            <div style={{
                                background: 'linear-gradient(135deg, #f8f9ff 0%, #f5f5f7 100%)',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '13px', color: '#666' }}>操作：</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => gostep(index)}
                                        style={{
                                            padding: '8px 20px',
                                            background: '#07c160',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        去完成
                                    </button>
                                    <button
                                        onClick={() => cancelActive(index)}
                                        style={{
                                            padding: '8px 20px',
                                            background: '#ff9500',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        放弃
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 分页信息 */}
            {!loading && tasks.length > 0 && (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    共 {tasks.length} 条待完成任务
                </div>
            )}

            <BottomNav />
        </div>
    );
}
