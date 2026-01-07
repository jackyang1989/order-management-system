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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
            <div className="w-full max-w-[400px] rounded-xl bg-white p-10">
                <div className="mb-8 text-center">
                    <div className="mb-2 text-2xl font-bold text-slate-800">
                        管理后台
                    </div>
                    <div className="text-sm text-slate-400">
                        订单管理系统 - 管理员登录
                    </div>
                </div>

                {error && (
                    <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <div className="mb-5">
                    <label className="mb-2 block text-sm text-slate-700">
                        用户名
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入用户名"
                        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <div className="mb-8">
                    <label className="mb-2 block text-sm text-slate-700">
                        密码
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="请输入密码"
                        className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={cn(
                        'w-full rounded-md py-3 text-base font-bold text-white transition-all',
                        loading
                            ? 'cursor-not-allowed bg-slate-300'
                            : 'cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    )}
                >
                    {loading ? '登录中...' : '登录'}
                </button>

                <div className="mt-5 text-center text-xs text-slate-400">
                    仅限管理员使用
                </div>
            </div>
        </div>
    );
}
