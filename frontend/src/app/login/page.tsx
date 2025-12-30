'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../services/authService';

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) {
            alert('请输入手机号和密码');
            return;
        }

        setLoading(true);
        const result = await login(phone, password);
        setLoading(false);

        if (result.success) {
            // 保存 token (authService 已处理 token 存储逻辑? 需确认)
            // Checking authService.ts: login returns { success, message, user, token }
            // But authService.ts (real implementation) does NOT save to localStorage automatically unless I added logic?
            // Wait, previous mock implementation did. Real implementation returns JSON.
            // I need to save token here!
            if (result.data && result.data.accessToken) {
                localStorage.setItem('token', result.data.accessToken);
                if (result.data.user) {
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                }
                router.push('/profile');
            } else {
                alert('登录失败: Token缺失');
            }
        } else {
            alert(result.message || '登录失败');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 30px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>欢迎登录</div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '40px' }}>订单管理系统</div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ marginBottom: '40px' }}>
                <input
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                />
            </div>

            <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                    width: '100%',
                    background: loading ? '#ccc' : '#409eff',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '25px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(64, 158, 255, 0.3)',
                    marginBottom: '20px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? '登录中...' : '登录'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                还没有账号？
                <Link href="/register" style={{ color: '#409eff', textDecoration: 'none' }}>立即注册</Link>
            </div>
        </div>
    );
}
