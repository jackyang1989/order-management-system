'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/authService';
import { toastError, toastSuccess } from '../../lib/toast';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || !password) {
            toastError('请输入手机号和密码');
            return;
        }

        setLoading(true);
        const result = await login(phone, password);
        setLoading(false);

        if (result.success) {
            if (result.data && result.data.accessToken) {
                localStorage.setItem('token', result.data.accessToken);
                if (result.data.user) {
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                }
                toastSuccess('登录成功');
                setTimeout(() => router.push('/profile'), 1000);
            } else {
                toastError('登录失败: Token缺失');
            }
        } else {
            toastError(result.message || '登录失败');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* NavBar */}
            <header className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-slate-200 bg-white">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="absolute left-4 text-xl text-slate-600"
                >
                    ‹
                </button>
                <span className="text-base font-medium text-slate-800">登录</span>
            </header>

            <div className="px-6 py-10">
                <div className="mb-8">
                    <div className="text-2xl font-semibold text-slate-800">欢迎登录</div>
                    <div className="mt-2 text-sm text-slate-500">订单管理系统</div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="手机号/用户名"
                        placeholder="请输入手机号或用户名"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            密码
                        </label>
                        <div className="relative flex items-center">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                placeholder="请输入密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400',
                                    'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                                )}
                            />
                            <button
                                type="button"
                                className="absolute right-3 text-slate-400"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        loading={loading}
                        className="h-12 w-full rounded-full text-base font-medium"
                    >
                        登录
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                    还没有账号？
                    <button
                        type="button"
                        className="ml-1 text-blue-600"
                        onClick={() => router.push('/register')}
                    >
                        立即注册
                    </button>
                </div>

                <div className="mt-3 text-center text-sm">
                    <button
                        type="button"
                        className="text-slate-500"
                        onClick={() => router.push('/forgot-password')}
                    >
                        忘记密码？
                    </button>
                </div>
            </div>
        </div>
    );
}
