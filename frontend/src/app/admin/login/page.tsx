'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';

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
                credentials: 'include', // 重要：允许发送和接收cookie
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                // 登录成功，cookie已自动设置，直接跳转
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600 p-5">
            <div className="w-full max-w-[400px] rounded-md bg-white p-10">
                <div className="mb-8 text-center">
                    <div className="mb-2 text-2xl font-bold text-[#3b4559]">
                        管理后台
                    </div>
                    <div className="text-sm text-[#9ca3af]">
                        订单管理系统 - 管理员登录
                    </div>
                </div>

                {error && (
                    <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-danger-400">
                        {error}
                    </div>
                )}

                <div className="mb-5">
                    <label className="mb-2 block text-sm text-[#374151]">
                        用户名
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入用户名"
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <div className="mb-8">
                    <label className="mb-2 block text-sm text-[#374151]">
                        密码
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入密码"
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={cn(
                        'w-full rounded-md py-3 text-base font-bold text-white transition-all',
                        loading
                            ? 'cursor-not-allowed bg-[#d1d5db]'
                            : 'cursor-pointer bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700'
                    )}
                >
                    {loading ? '登录中...' : '登录'}
                </button>

                <div className="mt-5 text-center text-xs text-[#9ca3af]">
                    仅限管理员使用
                </div>
            </div>
        </div>
    );
}
