'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserProfile } from '../../services/userService';
import { isAuthenticated, logout } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

interface UserStats {
    totalPaidPrincipal: number;      // 累计垫付本金
    monthlyRemainingTasks: number;   // 本月剩余任务数
    totalCompletedTasks: number;     // 累计完成任务数
    totalEarnedSilver: number;       // 累计赚取银锭
    pendingMerchantSilver: number;   // 待商家发放银锭
    frozenSilver: number;            // 冻结的银锭
    silverToYuan: number;            // 银锭折现金额
    todayInvited: number;            // 今日邀请人数
    totalInvited: number;            // 总邀请人数
    pendingOrders: number;           // 进行中订单数
    submittedOrders: number;         // 待审核订单数
}

interface BalanceOverview {
    balance: number;
    frozenBalance: number;
    silver: number;
    frozenSilver: number;
    totalAssets: number;
}

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
    realName?: string;
    qq?: string;
    stats?: UserStats;
    balanceOverview?: BalanceOverview;
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

    const stats = profile?.stats;
    const balanceOverview = profile?.balanceOverview;

    // 统计磁贴配置（对应原版个人中心）
    const statTiles = [
        { label: '累计垫付本金', value: `¥${(stats?.totalPaidPrincipal || 0).toFixed(2)}`, color: '#007aff' },
        { label: '本月剩余任务', value: `${stats?.monthlyRemainingTasks || 220}`, subLabel: '/220', color: '#34c759' },
        { label: '累计完成任务', value: `${stats?.totalCompletedTasks || 0}`, color: '#5856d6' },
        { label: '累计赚取银锭', value: `${(stats?.totalEarnedSilver || 0).toFixed(2)}`, color: '#ffd700' },
        { label: '待商家发放', value: `${(stats?.pendingMerchantSilver || 0).toFixed(2)}`, color: '#ff9500' },
        { label: '冻结银锭', value: `${(stats?.frozenSilver || 0).toFixed(2)}`, color: '#ff3b30' },
    ];

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
                            {profile?.realName && (
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                                    实名: {profile.realName}
                                </div>
                            )}
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
                                ¥{Number(balanceOverview?.balance || profile?.balance || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>可用银锭</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffd700' }}>
                                {Number(balanceOverview?.silver || profile?.silver || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>冻结本金</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' }}>
                                ¥{Number(balanceOverview?.frozenBalance || profile?.frozenBalance || 0).toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>总资产</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#34c759' }}>
                                ¥{Number(balanceOverview?.totalAssets || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 数据统计区域（对应原版个人中心） */}
            <div style={{ padding: '0 20px 20px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1d1d1f',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📈</span>
                        <span>数据统计</span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                    }}>
                        {statTiles.map((tile, index) => (
                            <div
                                key={index}
                                style={{
                                    background: '#f8f9ff',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: tile.color,
                                    marginBottom: '4px'
                                }}>
                                    {tile.value}
                                    {tile.subLabel && (
                                        <span style={{ fontSize: '12px', color: '#86868b' }}>{tile.subLabel}</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#86868b' }}>{tile.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* 邀请统计 */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #fff5e6 0%, #ffe4c4 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff9500' }}>
                                {stats?.todayInvited || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#86868b' }}>今日邀请</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(0,0,0,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff9500' }}>
                                {stats?.totalInvited || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#86868b' }}>总邀请</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(0,0,0,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#007aff' }}>
                                {stats?.pendingOrders || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#86868b' }}>进行中</div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(0,0,0,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#5856d6' }}>
                                {stats?.submittedOrders || 0}
                            </div>
                            <div style={{ fontSize: '11px', color: '#86868b' }}>待审核</div>
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
