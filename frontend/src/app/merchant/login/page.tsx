'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export default function MerchantLoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', phone: '', companyName: '' });

    const handleLogin = async () => {
        if (!loginForm.username || !loginForm.password) { setError('请输入用户名和密码'); return; }
        setLoading(true); setError('');
        try {
            const response = await fetch(`${BASE_URL}/merchant/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
            const data = await response.json();
            if (data.success) { localStorage.setItem('merchantToken', data.data.token); localStorage.setItem('merchant', JSON.stringify(data.data.merchant)); router.push('/merchant/dashboard'); }
            else setError(data.message || '登录失败');
        } catch { setError('网络错误，请重试'); }
        finally { setLoading(false); }
    };

    const handleRegister = async () => {
        if (!registerForm.username || !registerForm.password || !registerForm.phone) { setError('请填写完整信息'); return; }
        if (registerForm.password !== registerForm.confirmPassword) { setError('两次密码不一致'); return; }
        setLoading(true); setError('');
        try {
            const response = await fetch(`${BASE_URL}/merchant/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: registerForm.username, password: registerForm.password, phone: registerForm.phone, companyName: registerForm.companyName }) });
            const data = await response.json();
            if (data.success) { localStorage.setItem('merchantToken', data.data.token); localStorage.setItem('merchant', JSON.stringify(data.data.merchant)); router.push('/merchant/dashboard'); }
            else setError(data.message || '注册失败');
        } catch { setError('网络错误，请重试'); }
        finally { setLoading(false); }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
            <div className="flex min-h-[600px] w-[1000px] max-w-full overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-indigo-500/10">
                {/* Left Panel */}
                <div className="relative flex w-[480px] flex-col justify-center overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 px-12 py-16 text-white">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/20 text-4xl shadow-lg ring-4 ring-white/10 backdrop-blur-md">🏪</div>
                        <h1 className="mb-4 text-4xl font-black tracking-tight">商家工作台</h1>
                        <p className="mb-10 text-lg font-medium text-indigo-100 opacity-90">
                            专业的任务发布平台<br />
                            轻松管理订单，高效审核<br />
                            实时追踪任务进度
                        </p>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-3xl font-black">10000+</div>
                                <div className="text-sm font-bold text-indigo-200">活跃买手</div>
                            </div>
                            <div>
                                <div className="text-3xl font-black">99%</div>
                                <div className="text-sm font-bold text-indigo-200">好评率</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex flex-1 flex-col justify-center p-12">
                    <div className="mb-8">
                        <h2 className="mb-2 text-3xl font-black text-slate-900">{isLogin ? '欢迎回来' : '注册账号'}</h2>
                        <p className="font-bold text-slate-400">{isLogin ? '登录您的商家账号' : '创建新的商家账号'}</p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="mb-8 flex rounded-[16px] bg-slate-100 p-1.5">
                        <button onClick={() => { setIsLogin(true); setError(''); }} className={cn('flex-1 rounded-[12px] py-3 text-sm font-bold transition-all', isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>登录</button>
                        <button onClick={() => { setIsLogin(false); setError(''); }} className={cn('flex-1 rounded-[12px] py-3 text-sm font-bold transition-all', !isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>注册</button>
                    </div>

                    {/* Error Message */}
                    {error && <div className="mb-6 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-500 animate-in slide-in-from-top-2">{error}</div>}

                    {/* Form Fields */}
                    {isLogin ? (
                        <div className="space-y-5">
                            <Input
                                type="text"
                                placeholder="用户名"
                                value={loginForm.username}
                                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Input
                                type="password"
                                placeholder="密码"
                                value={loginForm.password}
                                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <div className="flex justify-end">
                                <span className="cursor-pointer text-xs font-bold text-slate-400 hover:text-indigo-600">忘记密码？</span>
                            </div>
                            <Button
                                onClick={handleLogin}
                                disabled={loading}
                                className={cn('h-12 w-full rounded-[16px] bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700', loading && 'cursor-not-allowed opacity-70')}
                            >
                                {loading ? '登录中...' : '登 录'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="用户名"
                                value={registerForm.username}
                                onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Input
                                type="text"
                                placeholder="手机号"
                                value={registerForm.phone}
                                onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Input
                                type="text"
                                placeholder="公司/店铺名称（选填）"
                                value={registerForm.companyName}
                                onChange={e => setRegisterForm({ ...registerForm, companyName: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="password"
                                    placeholder="密码"
                                    value={registerForm.password}
                                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <Input
                                    type="password"
                                    placeholder="确认密码"
                                    value={registerForm.confirmPassword}
                                    onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                    className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-5 font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <Button
                                onClick={handleRegister}
                                disabled={loading}
                                className={cn('mt-2 h-12 w-full rounded-[16px] bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700', loading && 'cursor-not-allowed opacity-70')}
                            >
                                {loading ? '注册中...' : '注 册'}
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <span onClick={() => router.push('/login')} className="cursor-pointer text-sm font-bold text-slate-400 transition-colors hover:text-indigo-600">← 我是买手，去买手登录</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
