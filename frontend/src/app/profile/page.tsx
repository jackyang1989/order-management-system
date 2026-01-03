'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken, logout } from '../../services/authService';
import BottomNav from '../../components/BottomNav';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================

// ========================
interface UserProfile {

    id: string;
    username: string;
    mobile: string;
    balance: number;
    vip: number;
    vip_time: number;


    reward: number;
    tj_award: number;
    tj_award_day: number;


    all_num_task: number;
    all_obtain_reward: number;
    wait_shop_issue: number;
    all_user_principal: number;
    freeze_reward: number;
    discounting: number;
    all_invite: number;
    day_invite: number;

    // 通知相关
    unread_msg_count: number;      // 未读消息数量
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tagShow, setTagShow] = useState(false);
    const [tagNum, setTagNum] = useState(0);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [router]);

    // ========================

    // ========================
    const loadProfile = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/index`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.code === 1) {
                setProfile(data.data);
                // 处理未读消息
                if (data.data.unread_msg_count > 0) {
                    setTagShow(true);
                    setTagNum(data.data.unread_msg_count);
                }
            } else {
                alertError(data.msg || '获取用户信息失败');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========================

    // ========================


    const maketask = () => {
        router.push('/tasks/continue');
    };


    const personmessage = () => {
        router.push('/profile/messages');
    };


    const tixiana = () => {
        router.push('/profile/withdraw');
    };


    const gochongzhi = () => {
        router.push('/profile/silver/recharge');
    };


    const tixianb = () => {
        router.push('/profile/withdraw?ydtx=1');
    };


    const goyaoqing = () => {
        router.push('/invite');
    };

    const handleLogout = () => {
        if (confirm('确定要退出登录吗？')) {
            logout();
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9ff' }}>
                <div style={{ color: '#86868b' }}>加载中...</div>
            </div>
        );
    }

    // 格式化VIP到期时间
    const formatVipTime = (timestamp: number) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp * 1000);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f5',
            paddingBottom: '100px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <button
                    onClick={maketask}
                    style={{
                        background: '#ff9500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    ✓ 继续任务
                </button>

                <button
                    onClick={personmessage}
                    style={{
                        background: '#ff9500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative'
                    }}
                >
                    ✓ 个人通知
                    {tagShow && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#f56c6c',
                            color: '#fff',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            minWidth: '16px',
                            textAlign: 'center'
                        }}>
                            {tagNum}
                        </span>
                    )}
                </button>
            </div>

            <div style={{
                margin: '16px',
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px'
                    }}>
                        👤
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                            用户名：<span style={{ color: '#409eff' }}>{profile?.username || '-'}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            绑定手机号：<span>{profile?.mobile || '-'}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            经验值：<span style={{ color: '#ff9500', fontWeight: '600' }}>{profile?.all_num_task || 0}</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: '12px',
                    background: profile?.vip === 1 ? 'linear-gradient(135deg, #fff5e6 0%, #ffe4c4 100%)' : '#f8f8f8',
                    borderRadius: '12px',
                    marginBottom: '12px'
                }}>
                    <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
                        会员状态：<span style={{ color: profile?.vip === 1 ? '#ff9500' : '#999', fontWeight: '600' }}>
                            {profile?.vip === 1 ? 'VIP会员' : '不是会员'}
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                        到期时间：<span>{formatVipTime(profile?.vip_time || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                        <span>累积赚取银锭：<span style={{ color: '#ffd700', fontWeight: '600' }}>{profile?.all_obtain_reward || 0}</span> 银锭</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        待商家发放银锭：<span style={{ color: '#ff9500', fontWeight: '600' }}>{profile?.wait_shop_issue || 0}</span> 银锭
                    </div>
                </div>
            </div>

            <div style={{ margin: '16px' }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#333',
                    marginBottom: '12px',
                    padding: '0 4px'
                }}>
                    提现入口
                </div>

                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>我的本金</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>💰</span>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#409eff' }}>
                            {profile?.balance || 0}元
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>(可提现本金)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>💰</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#666' }}>
                            {profile?.all_user_principal || 0}元
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>(总计垫付本金)</span>
                    </div>
                    <button
                        onClick={tixiana}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#409eff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        提现
                    </button>
                </div>

                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>我的银锭</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>🥇</span>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#ffd700' }}>
                            {profile?.reward || 0}银锭 = {profile?.discounting || 0}元
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>(总银锭)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>🥇</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#ff9500' }}>
                            {profile?.freeze_reward || 0}银锭
                        </span>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>(冻结银锭)</span>
                    </div>
                    <button
                        onClick={tixianb}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1989fa',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        提现
                    </button>
                </div>

                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>我的邀请</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>🏅</span>
                        <span style={{ fontSize: '14px', color: '#333' }}>
                            总计获得奖励：<span style={{ color: '#ffd700', fontWeight: '600' }}>{profile?.tj_award || 0}银锭</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>👥</span>
                        <span style={{ fontSize: '14px', color: '#333' }}>
                            总计邀请人数：<span style={{ color: '#409eff', fontWeight: '600' }}>{profile?.all_invite || 0}人</span>
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        今日获得奖励：<span style={{ color: '#ff9500' }}>{profile?.tj_award_day || 0}银锭</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                        今日邀请人数：<span style={{ color: '#409eff' }}>{profile?.day_invite || 0}人</span>
                    </div>
                    <button
                        onClick={goyaoqing}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#409eff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        邀请
                    </button>
                </div>

                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>历史记录</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        <button
                            onClick={() => router.push('/profile/records?type=principal')}
                            style={{
                                padding: '8px 16px',
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#409eff',
                                cursor: 'pointer'
                            }}
                        >
                            本金记录
                        </button>
                        <button
                            onClick={() => router.push('/profile/records?type=silver')}
                            style={{
                                padding: '8px 16px',
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#409eff',
                                cursor: 'pointer'
                            }}
                        >
                            银锭记录
                        </button>
                        <button
                            onClick={() => router.push('/profile/records?type=withdraw')}
                            style={{
                                padding: '8px 16px',
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#409eff',
                                cursor: 'pointer'
                            }}
                        >
                            提现记录
                        </button>
                        <button
                            onClick={() => router.push('/profile/vip-record')}
                            style={{
                                padding: '8px 16px',
                                background: '#f5f5f5',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#409eff',
                                cursor: 'pointer'
                            }}
                        >
                            会员记录
                        </button>
                    </div>
                </div>
            </div>

            {/* 功能菜单 */}
            <div style={{ margin: '16px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    {[
                        { icon: '💳', label: '买号管理', path: '/profile/buyno' },
                        { icon: '🏦', label: '银行卡管理', path: '/profile/payment' },
                        { icon: '📊', label: '资金记录', path: '/profile/records' },
                        { icon: '💰', label: '提现中心', path: '/profile/withdraw' },
                        { icon: '👥', label: '邀请好友', path: '/invite' },
                        { icon: '⚙️', label: '账户设置', path: '/profile/settings' },
                    ].map((item, index) => (
                        <div
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                borderBottom: index < 5 ? '1px solid #f5f5f5' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '22px', marginRight: '16px' }}>{item.icon}</span>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: '#333' }}>{item.label}</span>
                            <span style={{ color: '#c7c7cc', fontSize: '18px' }}>›</span>
                        </div>
                    ))}
                </div>

                {/* 退出登录 */}
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '16px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '15px',
                        fontWeight: '500',
                        color: '#ff3b30',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                >
                    退出登录
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
