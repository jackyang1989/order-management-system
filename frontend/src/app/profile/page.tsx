'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, isAuthenticated, MockUser } from '../../services/authService';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<MockUser | null>(null);
    const [unreadCount] = useState(1);
    const [activeNav, setActiveNav] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        setUser(getCurrentUser());
    }, [router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const toggleNav = (nav: string) => {
        setActiveNav(activeNav === nav ? null : nav);
    };

    if (!user) return null;

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
                        ✓ 继续任务
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
                        ✓ 个人通知
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
                    <div>用户名：{user.username}</div>
                    <div>绑定手机号：{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} 经验值：100</div>
                </div>

                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.8', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                    <div>会员状态：<span style={{ color: user.vip ? '#ffeb3b' : '#ddd' }}>{user.vip ? 'VIP会员' : '不是会员'}</span></div>
                    <div>到期时间：{user.vip ? user.vipExpireAt.split('T')[0] : '--'}</div>
                    <div>累积赚取银锭：<span style={{ color: '#ffeb3b' }}>{user.reward}银锭</span> 待商家发放银锭：0银锭</div>
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
                        <div style={{ fontSize: '16px', color: '#409eff', fontWeight: 'bold' }}>0.00元</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(可提现本金)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#666', fontWeight: 'bold' }}>0.00元</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(总计垫付本金)</div>
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
                        <div style={{ fontSize: '16px', color: '#409eff', fontWeight: 'bold' }}>{user.reward}银锭</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>(总银锭)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', color: '#666', fontWeight: 'bold' }}>0银锭</div>
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
                    <div>总计获得奖励：0银锭</div>
                    <div>总计邀请人数：0人</div>
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e5e5e5' }}>
                        <div>今日获得奖励：0银锭</div>
                        <div>今日邀请人数：0人</div>
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
                <Link href="#" style={{ color: '#409eff', marginLeft: '8px' }}>本金记录</Link>
                <Link href="#" style={{ color: '#409eff', marginLeft: '8px' }}>银锭记录</Link>
                <Link href="#" style={{ color: '#409eff', marginLeft: '8px' }}>提现记录</Link>
                <Link href="#" style={{ color: '#409eff', marginLeft: '8px' }}>会员记录</Link>
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
                {/* 账号信息 */}
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
                            <Link href="/profile/bind" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>买号管理</Link>
                            <Link href="/vip" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>会员VIP</Link>
                            <Link href="/help" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666' }}>帮助中心</Link>
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

                {/* 任务大厅 */}
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

                {/* 资金管理 */}
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
                            <Link href="/profile/payment" style={{ display: 'block', padding: '10px', fontSize: '13px', color: '#666', borderBottom: '1px solid #e5e5e5' }}>收款账户</Link>
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

                {/* 好友邀请 */}
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
