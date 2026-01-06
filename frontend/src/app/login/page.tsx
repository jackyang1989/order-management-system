'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, NavBar } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { login } from '../../services/authService';
import { toastError, toastSuccess } from '../../lib/toast';

export default function LoginPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleLogin = async (values: { phone: string; password: string }) => {
        if (!values.phone || !values.password) {
            toastError('请输入手机号和密码');
            return;
        }

        setLoading(true);
        const result = await login(values.phone, values.password);
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
            <NavBar onBack={() => router.back()} className="border-b border-slate-200">
                登录
            </NavBar>

            <div className="px-6 py-10">
                <div className="mb-8">
                    <div className="text-2xl font-semibold text-slate-800">欢迎登录</div>
                    <div className="mt-2 text-sm text-slate-500">订单管理系统</div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleLogin}
                    footer={
                        <Button
                            block
                            type="submit"
                            color="primary"
                            size="large"
                            loading={loading}
                            className="rounded-full h-12 text-base font-medium"
                        >
                            登录
                        </Button>
                    }
                >
                    <Form.Item name="phone" label="手机号/用户名" rules={[{ required: true, message: '请输入手机号或用户名' }]}>
                        <Input placeholder="请输入手机号或用户名" clearable className="text-base" />
                    </Form.Item>

                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <div className="flex items-center">
                            <Input
                                placeholder="请输入密码"
                                type={passwordVisible ? 'text' : 'password'}
                                className="flex-1 text-base"
                            />
                            <button
                                type="button"
                                className="px-2 text-slate-500"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <EyeOutline fontSize={20} /> : <EyeInvisibleOutline fontSize={20} />}
                            </button>
                        </div>
                    </Form.Item>
                </Form>

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
