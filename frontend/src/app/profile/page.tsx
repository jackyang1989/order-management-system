'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile } from '../../services/userService';
import { isAuthenticated, logout } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

interface UserProfile {
    id: string;
    username: string;
    phone: string;
    balance: number;
    frozenBalance: number;
    silver: number;
    frozenSilver: number;
    vip: boolean;
    vipExpireAt?: string;
    totalEarned: number;
    pendingReward: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const data = await fetchUserProfile();
            setProfile(data);
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
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

    const menuItems = [
        { icon: '💳', label: '买号管理', path: '/profile/buyno' },
        { icon: '🏦', label: '银行卡管理', path: '/profile/payment' },
        { icon: '📊', label: '资金记录', path: '/profile/records' },
        { icon: '💰', label: '提现中心', path: '/profile/withdraw' },
        { icon: '👥', label: '邀请好友', path: '/invite' },
        { icon: '⚙️', label: '账户设置', path: '/profile/settings' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #1d1d1f 0%, #2c2c2e 100%)',
            paddingBottom: '100px'
        }}>
            {/* 黑金身份卡 */}
            <div style={{ padding: '60px 20px 30px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #2c2c2e 0%, #1d1d1f 100%)',
                    borderRadius: '24px',
                    padding: '28px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                    {/* 用户信息 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px'
                        }}>
                            👤
                        </div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                                {profile?.username || '用户'}
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                {profile?.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定手机'}
                            </div>
                        </div>
                        {profile?.vip && (
                            <div style={{
                                marginLeft: 'auto',
                                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#1d1d1f'
                            }}>
                                VIP
                            </div>
                        )}
                    </div>

                    {/* 资产磁贴 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                    }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>可用本金</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                                ¥{Number(profile?.balance || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>可用银锭</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffd700' }}>
                                {Number(profile?.silver || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>冻结本金</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' }}>
                                ¥{Number(profile?.frozenBalance || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>累计收益</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#34c759' }}>
                                ¥{Number(profile?.totalEarned || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 功能菜单 */}
            <div style={{ padding: '0 20px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                }}>
                    {menuItems.map((item, index) => (
                        <div
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '18px 20px',
                                cursor: 'pointer',
                                borderBottom: index < menuItems.length - 1 ? '1px solid #f5f5f7' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '22px', marginRight: '16px' }}>{item.icon}</span>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: '#1d1d1f' }}>{item.label}</span>
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
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    退出登录
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
