'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, isAuthenticated } from '../../services/authService';
import { fetchUserProfile, fetchInviteStats, UserProfile, InviteStats } from '../../services/userService';
import { getUnreadCount } from '../../services/messageService';
import BottomNav from '../../components/BottomNav';

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        try {
            const [profileData, statsData, msgCount] = await Promise.all([
                fetchUserProfile(),
                fetchInviteStats(),
                getUnreadCount()
            ]);
            setProfile(profileData);
            setInviteStats(statsData);
            setUnreadCount(msgCount);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>加载中...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>加载失败，请刷新重试</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e5e5e5'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => router.push('/orders')} style={{
                        background: '#ff976a',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer'
                    }}>
                        继续任务
                    </button>
                    <Link href="/messages" style={{
                        background: '#ff976a',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        position: 'relative',
                        textDecoration: 'none'
                    }}>
                        个人通知
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                background: 'red',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 5px',
                                borderRadius: '10px'
                            }}>{unreadCount}</span>
                        )}
                    </Link>
                </div>
                <div style={{ width: '30px', height: '30px', background: '#ddd', borderRadius: '50%' }}></div>
                <div style={{ fontSize: '18px', cursor: 'pointer' }} onClick={() => router.push('/profile/settings')}>☰</div>
            </div>

            {/* 用户信息区 - 蓝色背景 */}
            <div style={{
                background: '#5b9bd5',
                padding: '40px 15px 20px',
                position: 'relative'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#fff',
                    margin: '0 auto 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    border: '3px solid rgba(255,255,255,0.5)'
                }}>
                    👤
                </div>

                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.8' }}>
                    <div>用户名：{profile.username}</div>
                    <div>绑定手机号：{profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} 经验值：{profile.experience || 100}</div>
                </div>

                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.8', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                    <div>会员状态：<span style={{ color: profile.vip ? '#ffeb3b' : '#ddd' }}>{profile.vip ? 'VIP会员' : '不是会员'}</span></div>
                    <div>到期时间：{profile.vip && profile.vipExpireAt ? new Date(profile.vipExpireAt).toLocaleDateString() : '--'}</div>
                    <div>累积赚取银锭：<span style={{ color: '#ffeb3b' }}>{profile.totalEarned || profile.silver}银锭</span> 待商家发放银锭：{profile.pendingReward || 0}银锭</div>
                </div>
            </div>

            {/* 提现入口标题 */}
            <div style={{
                background: '#fff',
                padding: '10px 15px',
                borderBottom: '2px solid #409eff',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#409eff'
            }}>
                提现入口
            </div>

            {/* 我的本金 */}
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>我的本金</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#409eff', fontWeight: 'bold' }}>{Number(profile.balance || 0).toFixed(2)}元</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(可提现本金)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#666', fontWeight: 'bold' }}>{Number(profile.frozenBalance || 0).toFixed(2)}元</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(冻结本金)</div>
                    </div>
                </div>
                <button onClick={() => router.push('/profile/withdraw')} style={{
                    width: '100%',
                    background: '#409eff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '8px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer'
                }}>提现</button>
            </div>

            {/* 我的银锭 */}
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>我的银锭</div>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#409eff', fontWeight: 'bold' }}>{profile.silver || 0}银锭</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(总银锭)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#666', fontWeight: 'bold' }}>{profile.frozenSilver || 0}银锭</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(冻结银锭)</div>
                    </div>
                </div>
                <button onClick={() => router.push('/profile/withdraw')} style={{
                    width: '100%',
                    background: '#07c160',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '8px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer'
                }}>提现</button>
            </div>

            {/* 我的邀请 */}
            <div style={{ background: '#fff', padding: '15px', margin: '10px 0', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>我的邀请</div>
                <div style={{ fontSize: '13px', color: '#409eff', lineHeight: '1.6' }}>
                    <div>总计获得奖励：{inviteStats?.totalReward || 0}银锭</div>
                    <div>总计邀请人数：{inviteStats?.totalInvited || 0}人</div>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e5e5e5' }}>
                        <div>今日获得奖励：{inviteStats?.todayReward || 0}银锭</div>
                        <div>今日邀请人数：{inviteStats?.todayInvited || 0}人</div>
                    </div>
                </div>
                <Link href="/invite" style={{
                    display: 'block',
                    textAlign: 'center',
                    width: '100%',
                    background: '#409eff',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '8px',
                    color: 'white',
                    fontSize: '13px',
                    textDecoration: 'none',
                    marginTop: '12px'
                }}>邀请</Link>
            </div>

            {/* 历史记录 */}
            <div style={{
                background: '#fff',
                padding: '12px 15px',
                fontSize: '13px',
                color: '#666'
            }}>
                <span>历史记录：</span>
                <Link href="/profile/records?type=principal" style={{ color: '#409eff', marginLeft: '8px' }}>本金记录</Link>
                <Link href="/profile/records?type=silver" style={{ color: '#409eff', marginLeft: '8px' }}>银锭记录</Link>
                <Link href="/profile/withdraw?tab=records" style={{ color: '#409eff', marginLeft: '8px' }}>提现记录</Link>
                <Link href="/vip?tab=records" style={{ color: '#409eff', marginLeft: '8px' }}>会员记录</Link>
            </div>

            {/* 退出登录 */}
            <div style={{ padding: '15px' }}>
                <button onClick={handleLogout} style={{
                    width: '100%',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    padding: '10px',
                    color: '#e74c3c',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}>
                    退出登录
                </button>
            </div>

            {/* 底部导航 */}
            <BottomNav />
        </div>
    );
}
