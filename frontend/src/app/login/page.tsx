'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, sendLoginCode, smsLogin, getRegistrationConfig } from '../../services/authService';
import { toastError, toastSuccess } from '../../lib/toast';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function LoginPage() {
    const router = useRouter();
    const [loginType, setLoginType] = useState<'password' | 'sms'>('password');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [sendingCode, setSendingCode] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);

    useEffect(() => {
        // 检查注册配置
        const checkConfig = async () => {
            try {
                const config = await getRegistrationConfig();
                setRegistrationEnabled(config.userRegistrationEnabled);
            } catch (error) {
                console.error('检查注册配置失败:', error);
                setRegistrationEnabled(true);
            }
        };
        checkConfig();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (!phone) {
            toastError('请输入手机号');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            toastError('请输入正确的手机号');
            return;
        }

        setSendingCode(true);
        try {
            const result = await sendLoginCode(phone);
            if (result.success) {
                toastSuccess('验证码已发送');
                setCountdown(60);
            } else {
                toastError(result.message || '发送失败');
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSendingCode(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loginType === 'password') {
            if (!phone || !password) {
                toastError('请输入手机号和密码');
                return;
            }

            setLoading(true);
            const result = await login(phone, password);
            setLoading(false);

            if (result.success) {
                // 登录成功，确保token已保存后再跳转
                toastSuccess('登录成功');
                // 验证token已保存
                const savedToken = localStorage.getItem('token');
                console.log('[Login] Token saved:', !!savedToken);
                setTimeout(() => {
                    window.location.href = '/profile'; // 使用完整页面刷新确保token生效
                }, 1000);
            } else {
                toastError(result.message || '登录失败');
            }
        } else {
            if (!phone || !smsCode) {
                toastError('请输入手机号和验证码');
                return;
            }

            setLoading(true);
            try {
                const result = await smsLogin(phone, smsCode);
                if (result.success) {
                    // 登录成功，cookie已自动设置，直接跳转
                    toastSuccess('登录成功');
                    setTimeout(() => router.push('/profile'), 1000);
                } else {
                    toastError(result.message || '登录失败');
                }
            } catch (error) {
                toastError('网络错误');
            } finally {
                setLoading(false);
            }
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

                {/* Login Type Tabs */}
                <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setLoginType('password')}
                        className={cn(
                            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                            loginType === 'password' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                        )}
                    >
                        密码登录
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginType('sms')}
                        className={cn(
                            'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                            loginType === 'sms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                        )}
                    >
                        验证码登录
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="手机号"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    {loginType === 'password' ? (
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
                    ) : (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                验证码
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="请输入验证码"
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value)}
                                    maxLength={6}
                                    className={cn(
                                        'flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400',
                                        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || sendingCode}
                                    className={cn(
                                        'whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                                        countdown > 0 || sendingCode
                                            ? 'bg-slate-200 text-slate-400'
                                            : 'bg-primary-500 text-white hover:bg-primary-600'
                                    )}
                                >
                                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                                </button>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        loading={loading}
                        className="h-12 w-full rounded-full text-base font-medium"
                    >
                        登录
                    </Button>
                </form>

                {registrationEnabled && (
                    <div className="mt-6 text-center text-sm text-slate-600">
                        还没有账号？
                        <button
                            type="button"
                            className="ml-1 text-primary-600"
                            onClick={() => router.push('/register')}
                        >
                            立即注册
                        </button>
                    </div>
                )}

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
