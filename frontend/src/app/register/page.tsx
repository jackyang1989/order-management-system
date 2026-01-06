'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { toastSuccess, toastError } from '../../lib/toast';
import { BASE_URL } from '../../../apiConfig';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Form state
    const [form, setForm] = useState({
        username: '',
        phone: '',
        smsCode: '',
        qq: '',
        invitationCode: '',
        password: '',
        confirmPassword: '',
    });

    const phoneReg = /^1[3-9]\d{9}$/;
    const passWordReg = /^[a-zA-Z0-9_-]{6,16}$/;

    useEffect(() => {
        const invite = searchParams.get('invite');
        if (invite) {
            setForm(f => ({ ...f, invitationCode: invite }));
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [searchParams]);

    const updateField = (key: keyof typeof form, value: string) => {
        setForm(f => ({ ...f, [key]: value }));
    };

    const sendYzm = async () => {
        if (!form.phone) {
            toastError('手机号码不能为空');
            return;
        }
        if (!phoneReg.test(form.phone)) {
            toastError('手机号码格式不正确');
            return;
        }

        try {
            await fetch(`${BASE_URL}/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: form.phone, type: 'register' }),
            });
        } catch (error) {
            // Continue anyway for demo
        }

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`${num}秒`);
        toastSuccess('验证码已发送');

        timerRef.current = setInterval(() => {
            num--;
            setYzmMsg(`${num}秒`);
            if (num <= 0) {
                clearInterval(timerRef.current!);
                setYzmMsg('重新发送');
                setYzmDisabled(false);
            }
        }, 1000);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username) { toastError('用户名不能为空'); return; }
        if (!form.phone) { toastError('手机号不能为空'); return; }
        if (!phoneReg.test(form.phone)) { toastError('手机号格式不正确'); return; }
        if (!form.smsCode) { toastError('短信验证码不能为空'); return; }
        if (!form.password) { toastError('请输入密码'); return; }
        if (!passWordReg.test(form.password)) { toastError('密码格式不正确'); return; }
        if (form.password !== form.confirmPassword) { toastError('两次密码不一致'); return; }
        if (!form.invitationCode) { toastError('请输入邀请码'); return; }

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    phone: form.phone,
                    password: form.password,
                    qq: form.qq || '',
                    invitationCode: form.invitationCode,
                    smsCode: form.smsCode,
                }),
            });
            const data = await response.json();

            if (data.success) {
                toastSuccess('注册成功');
                setTimeout(() => {
                    if (data.data?.accessToken) {
                        localStorage.setItem('token', data.data.accessToken);
                        if (data.data.user) localStorage.setItem('user', JSON.stringify(data.data.user));
                        router.push('/profile');
                    } else {
                        router.push('/login');
                    }
                }, 1500);
            } else {
                toastError(data.message || '注册失败');
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">
                    ← 返回
                </button>
                <h1 className="text-base font-medium text-slate-800">注册账号</h1>
            </div>

            <div className="px-6 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-slate-800">注册账号</h2>
                    <p className="mt-1 text-sm text-slate-500">加入订单管理系统</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">用户名</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="用户名 (3-20位字符)"
                            value={form.username}
                            onChange={(e) => updateField('username', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">手机号</label>
                        <input
                            type="tel"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="手机号"
                            maxLength={11}
                            value={form.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">短信验证码</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="短信验证码"
                                maxLength={6}
                                value={form.smsCode}
                                onChange={(e) => updateField('smsCode', e.target.value)}
                            />
                            <button
                                type="button"
                                disabled={yzmDisabled}
                                onClick={sendYzm}
                                className={cn(
                                    'whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-medium transition',
                                    yzmDisabled
                                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                        : 'border-primary bg-white text-primary hover:bg-primary/5'
                                )}
                            >
                                {yzmMsg}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">QQ号 (选填)</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="QQ号"
                            value={form.qq}
                            onChange={(e) => updateField('qq', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">邀请码</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="邀请码 (必填)"
                            value={form.invitationCode}
                            onChange={(e) => updateField('invitationCode', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
                        <div className="relative">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="6-16位字母数字下划线"
                                value={form.password}
                                onChange={(e) => updateField('password', e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">确认密码</label>
                        <div className="relative">
                            <input
                                type={confirmPasswordVisible ? 'text' : 'password'}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="确认密码"
                                value={form.confirmPassword}
                                onChange={(e) => updateField('confirmPassword', e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            >
                                {confirmPasswordVisible ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            'mt-4 w-full rounded-full bg-primary py-3 text-base font-medium text-white transition',
                            loading ? 'cursor-not-allowed opacity-70' : 'hover:bg-primary/90'
                        )}
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    已有账号？
                    <span className="cursor-pointer text-primary" onClick={() => router.push('/login')}>立即登录</span>
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
                    <span className="text-blue-500">ℹ️</span>
                    <p className="text-sm text-blue-700">
                        密码格式要求：6到16位，可包含字母、数字、下划线、减号
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
