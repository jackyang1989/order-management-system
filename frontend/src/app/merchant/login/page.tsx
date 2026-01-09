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
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f4f6] p-0">
            <div className="flex min-h-[550px] w-[900px] max-w-[95%] overflow-hidden rounded-2xl bg-white">
                {/* Left Panel */}
                <div className="flex w-[450px] min-w-[450px] flex-col justify-center bg-gradient-to-br from-primary-500 to-purple-600 px-10 py-16 text-white">
                    <div className="mb-5 text-6xl">🏪</div>
                    <h1 className="mb-4 text-3xl font-bold">商家工作台</h1>
                    <p className="leading-relaxed opacity-90">
                        专业的任务发布平台<br />
                        轻松管理订单，高效审核<br />
                        实时追踪任务进度
                    </p>
                    <div className="mt-10 flex gap-8">
                        <div><div className="text-3xl font-bold">10000+</div><div className="text-sm opacity-80">活跃买手</div></div>
                        <div><div className="text-3xl font-bold">50000+</div><div className="text-sm opacity-80">完成订单</div></div>
                        <div><div className="text-3xl font-bold">99%</div><div className="text-sm opacity-80">好评率</div></div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex-1 p-12">
                    <div className="mb-8">
                        <h2 className="mb-2 text-2xl font-bold text-[#3b4559]">{isLogin ? '欢迎回来' : '注册账号'}</h2>
                        <p className="text-sm text-[#6b7280]">{isLogin ? '登录您的商家账号' : '创建新的商家账号'}</p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="mb-6 flex rounded-md bg-[#f3f4f6] p-1">
                        <button onClick={() => { setIsLogin(true); setError(''); }} className={cn('flex-1 rounded-md py-2.5 text-sm font-medium transition-all', isLogin ? 'bg-white text-primary-600' : 'text-[#6b7280]')}>登录</button>
                        <button onClick={() => { setIsLogin(false); setError(''); }} className={cn('flex-1 rounded-md py-2.5 text-sm font-medium transition-all', !isLogin ? 'bg-white text-primary-600' : 'text-[#6b7280]')}>注册</button>
                    </div>

                    {/* Error Message */}
                    {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger-500">{error}</div>}

                    {/* Form Fields */}
                    {isLogin ? (
                        <div className="space-y-4">
                            <Input type="text" placeholder="用户名" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
                            <Input type="password" placeholder="密码" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                            <Button onClick={handleLogin} disabled={loading} className={cn('w-full text-base', loading && 'cursor-not-allowed opacity-50')}>{loading ? '登录中...' : '登 录'}</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input type="text" placeholder="用户名" value={registerForm.username} onChange={e => setRegisterForm({ ...registerForm, username: e.target.value })} />
                            <Input type="text" placeholder="手机号" value={registerForm.phone} onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                            <Input type="text" placeholder="公司/店铺名称（选填）" value={registerForm.companyName} onChange={e => setRegisterForm({ ...registerForm, companyName: e.target.value })} />
                            <Input type="password" placeholder="密码" value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                            <Input type="password" placeholder="确认密码" value={registerForm.confirmPassword} onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} />
                            <Button onClick={handleRegister} disabled={loading} className={cn('w-full text-base', loading && 'cursor-not-allowed opacity-50')}>{loading ? '注册中...' : '注 册'}</Button>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <span onClick={() => router.push('/login')} className="cursor-pointer text-sm text-primary-600">← 我是买手，去买手登录</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
