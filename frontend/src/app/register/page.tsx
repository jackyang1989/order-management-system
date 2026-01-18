'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { toastSuccess, toastError } from '../../lib/toast';
import { BASE_URL } from '../../../apiConfig';
import { getRegistrationConfig } from '../../services/authService';
import { getProvinces, getCities, getDistricts } from '../../data/chinaRegions';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [checkingConfig, setCheckingConfig] = useState(true);
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Form state
    const [form, setForm] = useState({
        phone: '',
        smsCode: '',
        wechat: '',
        invitationCode: '',
        password: '',
        confirmPassword: '',
        province: '',
        city: '',
        district: '',
    });

    const phoneReg = /^1[3-9]\d{9}$/;
    const passWordReg = /^[a-zA-Z0-9_-]{6,16}$/;

    // 地区数据
    const provinces = getProvinces();
    const cities = form.province ? getCities(form.province) : [];
    const districts = form.province && form.city ? getDistricts(form.province, form.city) : [];

    useEffect(() => {
        // 检查注册配置
        const checkConfig = async () => {
            try {
                const config = await getRegistrationConfig();
                setRegistrationEnabled(config.userRegistrationEnabled);
            } catch (error) {
                console.error('检查注册配置失败:', error);
                // 默认允许注册
                setRegistrationEnabled(true);
            } finally {
                setCheckingConfig(false);
            }
        };
        checkConfig();

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
        if (!form.phone) { toastError('手机号不能为空'); return; }
        if (!phoneReg.test(form.phone)) { toastError('手机号格式不正确'); return; }
        if (!form.smsCode) { toastError('短信验证码不能为空'); return; }
        if (!form.province || !form.city || !form.district) { toastError('请选择所在地区'); return; }
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
                    phone: form.phone,
                    password: form.password,
                    wechat: form.wechat || '',
                    invitationCode: form.invitationCode,
                    smsCode: form.smsCode,
                    province: form.province,
                    city: form.city,
                    district: form.district,
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

    // 如果正在检查配置,显示加载状态
    if (checkingConfig) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    // 如果注册功能关闭,显示提示信息
    if (!registrationEnabled) {
        return (
            <div className="min-h-screen bg-white">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
                    <button onClick={() => router.push('/login')} className="mr-4 text-slate-600">
                        ← 返回
                    </button>
                    <h1 className="text-base font-medium text-slate-800">注册账号</h1>
                </div>

                <div className="flex flex-col items-center justify-center px-6 py-20">
                    <div className="mb-6 text-6xl">🚫</div>
                    <h2 className="mb-3 text-2xl font-bold text-slate-800">注册功能暂时关闭</h2>
                    <p className="mb-8 text-center text-slate-500">
                        抱歉,用户注册功能暂时关闭。<br />
                        如需帮助,请联系管理员。
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="rounded-full bg-primary px-8 py-3 text-base font-medium text-white transition hover:bg-primary/90"
                    >
                        返回登录
                    </button>
                </div>
            </div>
        );
    }

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
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">微信号 (选填)</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="微信号"
                            value={form.wechat}
                            onChange={(e) => updateField('wechat', e.target.value)}
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
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">所在地区</label>
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={form.province}
                                onChange={(e) => {
                                    updateField('province', e.target.value);
                                    updateField('city', '');
                                    updateField('district', '');
                                }}
                            >
                                <option value="">省份</option>
                                {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <select
                                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={form.city}
                                onChange={(e) => {
                                    updateField('city', e.target.value);
                                    updateField('district', '');
                                }}
                                disabled={!form.province}
                            >
                                <option value="">城市</option>
                                {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <select
                                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={form.district}
                                onChange={(e) => updateField('district', e.target.value)}
                                disabled={!form.city}
                            >
                                <option value="">区县</option>
                                {districts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">用于匹配您所在地区的任务</p>
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
                    <span className="text-primary-500">ℹ️</span>
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
