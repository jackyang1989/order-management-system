'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!username || !password) {
            setError('请输入用户名和密码');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/admin-users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success && result.data?.token) {
                localStorage.setItem('adminToken', result.data.token);
                localStorage.setItem('adminUser', JSON.stringify(result.data.admin));
                router.push('/admin/dashboard');
            } else {
                setError(result.message || '登录失败');
            }
        } catch (err) {
            setError('网络错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                        管理后台
                    </div>
                    <div style={{ fontSize: '14px', color: '#999' }}>
                        订单管理系统 - 管理员登录
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: '6px',
                        padding: '10px 15px',
                        marginBottom: '20px',
                        color: '#ff4d4f',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                        用户名
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入用户名"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                        密码
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入密码"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '登录中...' : '登录'}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                    仅限管理员使用
                </div>
            </div>
        </div>
    );
}
