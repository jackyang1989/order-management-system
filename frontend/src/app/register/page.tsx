'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../services/authService';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const invite = searchParams.get('invite');
        if (invite) {
            setInvitationCode(invite);
        }
    }, [searchParams]);

    const handleRegister = async () => {
        if (!username) { alert('请输入用户名'); return; }
        if (!phone) { alert('请输入手机号'); return; }
        if (!password) { alert('请输入密码'); return; }
        if (password !== confirmPassword) { alert('两次密码不一致'); return; }
        if (!invitationCode) { alert('请输入邀请码'); return; }

        setLoading(true);
        // 调用 authService.register
        const result = await register({
            username,
            phone,
            password,
            invitationCode
        });
        setLoading(false);

        if (result.success) {
            alert('注册成功');
            // 如果后端注册返回了 token
            if (result.data && result.data.accessToken) {
                localStorage.setItem('token', result.data.accessToken);
                if (result.data.user) {
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                }
                router.push('/profile');
            } else {
                router.push('/login');
            }
        } else {
            alert(result.message || '注册失败');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 30px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>注册账号</div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '40px' }}>加入订单管理系统</div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="用户名 (3-20位字符)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="手机号"
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

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="邀请码 (必填)"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
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

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="password"
                    placeholder="设置密码 (6位以上)"
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

            <div style={{ marginBottom: '40px' }}>
                <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={handleRegister}
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
                {loading ? '注册中...' : '注册'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                已有账号？
                <Link href="/login" style={{ color: '#409eff', textDecoration: 'none' }}>立即登录</Link>
            </div>
        </div>
    );
}
