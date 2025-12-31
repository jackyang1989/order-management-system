'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

export default function MerchantLoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        phone: '',
        companyName: ''
    });

    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) {
            setError('请输入用户名和密码');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/merchant/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginForm)
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('merchantToken', data.data.token);
                localStorage.setItem('merchant', JSON.stringify(data.data.merchant));
                router.push('/merchant/dashboard');
            } else {
                setError(data.message || '登录失败');
            }
        } catch {
            setError('网络错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!registerForm.username || !registerForm.password || !registerForm.phone) {
            setError('请填写完整信息');
            return;
        }
        if (registerForm.password !== registerForm.confirmPassword) {
            setError('两次密码不一致');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_URL}/merchant/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: registerForm.username,
                    password: registerForm.password,
                    phone: registerForm.phone,
                    companyName: registerForm.companyName
                })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('merchantToken', data.data.token);
                localStorage.setItem('merchant', JSON.stringify(data.data.merchant));
                router.push('/merchant/dashboard');
            } else {
                setError(data.message || '注册失败');
            }
        } catch {
            setError('网络错误，请重试');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        fontSize: '15px',
        marginBottom: '16px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s'
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px',
        background: loading ? '#ccc' : '#4f46e5',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s'
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#f3f4f6', // 浅灰色背景
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // 更柔和的阴影
                overflow: 'hidden',
                width: '900px',
                maxWidth: '95%',
                minHeight: '550px'
            }}>
                {/* 左侧介绍区 */}
                <div style={{
                    width: '450px',
                    minWidth: '450px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    padding: '60px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏪</div>


                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 16px' }}>商家工作台</h1>
                    <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                        专业的任务发布平台<br />
                        轻松管理订单，高效审核<br />
                        实时追踪任务进度
                    </p>
                    <div style={{ marginTop: '40px', display: 'flex', gap: '30px' }}>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>10000+</div>
                            <div style={{ fontSize: '14px', opacity: 0.8 }}>活跃买手</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>50000+</div>
                            <div style={{ fontSize: '14px', opacity: 0.8 }}>完成订单</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>99%</div>
                            <div style={{ fontSize: '14px', opacity: 0.8 }}>好评率</div>
                        </div>
                    </div>
                </div>

                {/* 右侧表单区 */}
                <div style={{ flex: 1, padding: '50px 40px' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px' }}>
                            {isLogin ? '欢迎回来' : '注册账号'}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                            {isLogin ? '登录您的商家账号' : '创建新的商家账号'}
                        </p>
                    </div>

                    {/* 切换标签 */}
                    <div style={{ display: 'flex', marginBottom: '24px', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => { setIsLogin(true); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                background: isLogin ? '#fff' : 'transparent',
                                color: isLogin ? '#4f46e5' : '#6b7280',
                                boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            登录
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                background: !isLogin ? '#fff' : 'transparent',
                                color: !isLogin ? '#4f46e5' : '#6b7280',
                                boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            注册
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px',
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}

                    {isLogin ? (
                        <div>
                            <input
                                type="text"
                                placeholder="用户名"
                                value={loginForm.username}
                                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="password"
                                placeholder="密码"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                style={inputStyle}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                            <button onClick={handleLogin} disabled={loading} style={buttonStyle}>
                                {loading ? '登录中...' : '登 录'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <input
                                type="text"
                                placeholder="用户名"
                                value={registerForm.username}
                                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                placeholder="手机号"
                                value={registerForm.phone}
                                onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="text"
                                placeholder="公司/店铺名称（选填）"
                                value={registerForm.companyName}
                                onChange={e => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="password"
                                placeholder="密码"
                                value={registerForm.password}
                                onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                type="password"
                                placeholder="确认密码"
                                value={registerForm.confirmPassword}
                                onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                style={inputStyle}
                            />
                            <button onClick={handleRegister} disabled={loading} style={buttonStyle}>
                                {loading ? '注册中...' : '注 册'}
                            </button>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <span
                            onClick={() => router.push('/login')}
                            style={{ fontSize: '14px', color: '#4f46e5', cursor: 'pointer' }}
                        >
                            ← 我是买手，去买手登录
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
