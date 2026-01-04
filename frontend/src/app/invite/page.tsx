'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../../services/authService';
import { fetchInviteStats, fetchInviteRecords, InviteStats, InviteRecord } from '../../services/userService';

// 推荐任务类型
interface RecommendedTask {
    id: string;
    orderId: string;
    taskTitle: string;
    username: string;
    completedAt: string;
    commissionAmount: number;
    month: string;
}

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invite' | 'records' | 'tasks'>('invite');
    const [stats, setStats] = useState<InviteStats>({ totalInvited: 0, todayInvited: 0, totalReward: 0, todayReward: 0 });
    const [records, setRecords] = useState<InviteRecord[]>([]);
    const [recommendedTasks, setRecommendedTasks] = useState<RecommendedTask[]>([]);
    const [copied, setCopied] = useState(false);
    const [inviteCode, setInviteCode] = useState('ADMIN'); // Default fallback

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const user = getCurrentUser();
            if (user && user.invitationCode) {
                setInviteCode(user.invitationCode);
            }

            // 获取邀请统计和记录
            const [statsData, recordsData] = await Promise.all([
                fetchInviteStats(),
                fetchInviteRecords()
            ]);
            setStats(statsData);
            setRecords(recordsData);

            // 获取推荐任务
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/invite/tasks', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data && result.data.list) {
                        setRecommendedTasks(result.data.list);
                    }
                }
            } catch (e) {
                console.error('Load recommended tasks error:', e);
            }
        } catch (error) {
            console.error('Load invite data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const inviteLink = typeof window !== 'undefined'
        ? `${window.location.origin}/register?invite=${inviteCode}`
        : `https://example.com/register?invite=${inviteCode}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = inviteLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#fff' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>邀请好友</div>
            </div>

            {/* 统计卡片 */}
            <div style={{
                background: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
                padding: '20px 15px 30px',
                color: '#fff'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>{stats.totalInvited}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>累计邀请(人)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>{stats.totalReward}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>累计奖励(银锭)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>{stats.todayInvited}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>今日邀请(人)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>{stats.todayReward}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>今日奖励(银锭)</div>
                    </div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => setActiveTab('invite')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'invite' ? '#409eff' : '#666',
                        position: 'relative'
                    }}
                >
                    邀请链接
                    {activeTab === 'invite' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#409eff' }}></div>}
                </div>
                <div
                    onClick={() => setActiveTab('records')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'records' ? '#409eff' : '#666',
                        position: 'relative'
                    }}
                >
                    邀请记录
                    {activeTab === 'records' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#409eff' }}></div>}
                </div>
                <div
                    onClick={() => setActiveTab('tasks')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'tasks' ? '#409eff' : '#666',
                        position: 'relative'
                    }}
                >
                    推荐任务
                    {activeTab === 'tasks' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#409eff' }}></div>}
                </div>
            </div>

            {/* 邀请链接 */}
            {activeTab === 'invite' && (
                <div>
                    {/* 邀请说明 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                            复制您的 <span style={{ color: '#409eff', fontWeight: 'bold' }}>专属邀请链接</span>，邀请好友成功注册后，好友完成任务您即可获得邀请奖励！
                        </div>
                    </div>

                    {/* 邀请链接 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                            <span style={{ color: '#409eff' }}>买手</span> 邀请链接
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    color: '#666',
                                    background: '#f5f5f5'
                                }}
                            />
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    padding: '10px 20px',
                                    background: copied ? '#67c23a' : '#409eff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {copied ? '已复制' : '复制链接'}
                            </button>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                            邀请码：<span style={{ color: '#409eff', fontWeight: 'bold' }}>{inviteCode}</span>
                        </div>
                    </div>

                    {/* 注意事项 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#e6a23c' }}>
                            <span style={{ marginRight: '5px' }}>⚠️</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>请注意</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <p>1. 邀请链接只能发布于聊天工具中（微信、QQ等），禁止推广于外部网站。</p>
                            <p>2. 邀请好友只能是朋友、亲戚、同事等熟人，不可向陌生人发送链接。</p>
                            <p>3. 严禁自己邀请自己获取奖励，一经发现将永久封号。</p>
                        </div>
                    </div>

                    {/* 奖励规则 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>🎁 邀请奖励</div>
                        <div style={{
                            background: '#f5f7fa',
                            borderRadius: '8px',
                            padding: '15px'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#409eff', marginBottom: '10px' }}>买手完成任务奖励</div>
                            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                                <p>• 邀请好友每完成一单任务（完结后），您可获得 <span style={{ color: '#f56c6c', fontWeight: 'bold' }}>1</span> 银锭奖励</p>
                                <p>• 每邀请一个好友可获得奖励上限 <span style={{ color: '#f56c6c', fontWeight: 'bold' }}>1000</span> 银锭</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                            注：奖励由平台承担，不会扣除好友的任务佣金
                        </div>
                    </div>
                </div>
            )}

            {/* 邀请记录 */}
            {activeTab === 'records' && (
                <div style={{ background: '#fff', marginTop: '10px' }}>
                    {records.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>👥</div>
                            暂无邀请记录
                        </div>
                    ) : (
                        records.map((record, index) => (
                            <div
                                key={record.id}
                                style={{
                                    padding: '15px',
                                    borderBottom: index < records.length - 1 ? '1px solid #f5f5f5' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: '#e0e0e0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '10px',
                                            fontSize: '16px'
                                        }}>👤</div>
                                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{record.username}</span>
                                    </div>
                                    <span style={{ fontSize: '14px', color: '#409eff', fontWeight: 'bold' }}>
                                        +{record.reward} 银锭
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginLeft: '46px' }}>
                                    <div>注册时间：{record.registerTime}</div>
                                    <div>已完成任务：{record.completedTasks} 单</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 推荐任务 */}
            {activeTab === 'tasks' && (
                <div style={{ background: '#fff', marginTop: '10px' }}>
                    {recommendedTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
                            暂无推荐任务记录
                        </div>
                    ) : (
                        recommendedTasks.map((task, index) => (
                            <div
                                key={task.id}
                                style={{
                                    padding: '15px',
                                    borderBottom: index < recommendedTasks.length - 1 ? '1px solid #f5f5f5' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: '#e6f7ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: '10px',
                                            fontSize: '16px'
                                        }}>✅</div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{task.username}</div>
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{task.taskTitle}</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '14px', color: '#67c23a', fontWeight: 'bold' }}>
                                        +{task.commissionAmount} 银锭
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', marginLeft: '46px' }}>
                                    <div>完成时间：{task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}</div>
                                    <div>所属月份：{task.month}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
