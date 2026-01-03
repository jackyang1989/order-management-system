'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';
import {
    fetchUserReviewTasks,
    ReviewTask,
    ReviewTaskStatus,
    ReviewTaskStatusLabels
} from '../../../services/reviewTaskService';
import BottomNav from '../../../components/BottomNav';

function ReviewTasksContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialState = searchParams.get('state');

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState<number | undefined>(
        initialState !== null ? parseInt(initialState) : undefined
    );

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTasks();
    }, [router, activeTab]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const result = await fetchUserReviewTasks(activeTab, 1, 50);
            setTasks(result.list);
            setTotal(result.total);
        } catch (error) {
            console.error('Load tasks error:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { key: undefined, label: '全部' },
        { key: ReviewTaskStatus.APPROVED, label: '待追评' },
        { key: ReviewTaskStatus.UPLOADED, label: '待确认' },
        { key: ReviewTaskStatus.COMPLETED, label: '已完成' },
    ];

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f7',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                padding: '20px',
                color: 'white',
                textAlign: 'center'
            }}>
                <div onClick={() => router.back()} style={{
                    position: 'absolute',
                    left: '16px',
                    top: '20px',
                    fontSize: '20px',
                    cursor: 'pointer'
                }}>←</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>追评任务</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    完成追评可获得额外佣金
                </div>
            </div>

            {/* Tab 切换 */}
            <div style={{
                display: 'flex',
                background: 'white',
                borderBottom: '1px solid #eee',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                {tabs.map(tab => (
                    <div
                        key={tab.key ?? 'all'}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            padding: '14px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: activeTab === tab.key ? '#6366f1' : '#666',
                            borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* 任务列表 */}
            <div style={{ padding: '16px' }}>
                {tasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                        <div>暂无追评任务</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tasks.map(task => {
                            const statusInfo = ReviewTaskStatusLabels[task.state];
                            return (
                                <div
                                    key={task.id}
                                    onClick={() => router.push(`/profile/reviews/${task.id}`)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                追评任务
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                                {task.taskNumber}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: statusInfo.color + '20',
                                            color: statusInfo.color
                                        }}>
                                            {statusInfo.text}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '8px',
                                        fontSize: '13px'
                                    }}>
                                        <div>
                                            <span style={{ color: '#999' }}>佣金：</span>
                                            <span style={{ color: '#10b981', fontWeight: '600' }}>¥{Number(task.userMoney).toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#999' }}>任务金额：</span>
                                            <span style={{ color: '#333' }}>¥{Number(task.money).toFixed(2)}</span>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ color: '#999' }}>创建时间：</span>
                                            <span style={{ color: '#333' }}>{new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* 待追评状态的特殊提示 */}
                                    {task.state === ReviewTaskStatus.APPROVED && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '10px',
                                            background: '#eff6ff',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            color: '#3b82f6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span>📢</span>
                                            请尽快完成追评并上传截图
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {total > tasks.length && (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#999',
                        fontSize: '14px'
                    }}>
                        共 {total} 条记录
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default function ReviewTasksPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f7'
            }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        }>
            <ReviewTasksContent />
        </Suspense>
    );
}
