'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

interface UserStats {
    totalCompletedOrders: number;
    invitationUnlockThreshold: number;
    isUnlocked: boolean;
    referralCode: string;
    referralLink: string;
}

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [copied, setCopied] = useState(false);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const fetchInviteStatus = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`${BASE_URL}/users/invite-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('获取邀请状态失败:', error);
        } finally {
            setLoading(false);
        }
    }, [getToken, router]);

    useEffect(() => {
        fetchInviteStatus();
    }, [fetchInviteStatus]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                加载中...
            </div>
        );
    }

    const remainingOrders = stats
        ? stats.invitationUnlockThreshold - stats.totalCompletedOrders
        : 0;

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '20px' }}>
            {/* 顶部导航 */}
            <div style={{
                background: '#fff',
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #e5e5e5',
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', width: '30px' }}>‹</div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>邀请好友</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 主要内容 */}
            <div style={{ padding: '20px' }}>
                {stats?.isUnlocked ? (
                    /* 已解锁状态 */
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px',
                        padding: '30px 20px',
                        color: 'white',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎉</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                            邀请功能已解锁
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '15px',
                        }}>
                            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>您的邀请码</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
                                {stats.referralCode}
                            </div>
                        </div>

                        <button
                            onClick={() => copyToClipboard(stats.referralLink)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? '✓ 已复制' : '复制邀请链接'}
                        </button>

                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '15px' }}>
                            分享链接给好友，好友注册后您可获得奖励
                        </div>
                    </div>
                ) : (
                    /* 未解锁状态 */
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '40px 20px',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#f5f5f5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: '36px',
                        }}>
                            🔒
                        </div>

                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                            邀请功能暂未解锁
                        </div>

                        <div style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                            完成更多任务即可解锁邀请功能
                        </div>

                        <div style={{
                            background: '#f0f5ff',
                            borderRadius: '12px',
                            padding: '20px',
                        }}>
                            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                还需完成
                            </div>
                            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#409eff' }}>
                                {remainingOrders > 0 ? remainingOrders : 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                单即可解锁
                            </div>

                            <div style={{
                                marginTop: '15px',
                                background: '#e0e0e0',
                                borderRadius: '4px',
                                height: '8px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${Math.min(100, (stats?.totalCompletedOrders || 0) / (stats?.invitationUnlockThreshold || 1) * 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #409eff, #67c23a)',
                                    transition: 'width 0.3s ease',
                                }}></div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                                已完成 {stats?.totalCompletedOrders || 0} / {stats?.invitationUnlockThreshold || 0} 单
                            </div>
                        </div>
                    </div>
                )}

                {/* 邀请规则 */}
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '20px',
                }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                        邀请规则
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '2' }}>
                        <p>1. 完成 {stats?.invitationUnlockThreshold || 0} 单任务后解锁邀请功能</p>
                        <p>2. 好友通过您的邀请链接注册成功后，您可获得奖励</p>
                        <p>3. 邀请奖励将自动发放到您的账户</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
