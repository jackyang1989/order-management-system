'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Toast, NavBar, Image } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { login } from '../../services/authService';
import { BASE_URL } from '../../../apiConfig';

export default function LoginPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [captchaId, setCaptchaId] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');

    useEffect(() => {
        loadCaptcha();
    }, []);

    const loadCaptcha = async () => {
        try {
            const res = await fetch(`${BASE_URL}/captcha/generate`);
            const data = await res.json();
            if (data.captchaId && data.svg) {
                setCaptchaId(data.captchaId);
                setCaptchaSvg(data.svg);
            }
        } catch (e) {
            console.error('加载验证码失败', e);
        }
    };

    const handleLogin = async (values: { phone: string; password: string; captcha: string }) => {
        if (!values.phone || !values.password) {
            Toast.show({ content: '请输入手机号和密码', icon: 'fail' });
            return;
        }
        if (!values.captcha) {
            Toast.show({ content: '请输入验证码', icon: 'fail' });
            return;
        }

        // Verify captcha first
        try {
            const captchaRes = await fetch(`${BASE_URL}/captcha/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captchaId, code: values.captcha }),
            });
            const captchaData = await captchaRes.json();
            if (!captchaData.valid) {
                Toast.show({ content: '验证码错误', icon: 'fail' });
                loadCaptcha();
                return;
            }
        } catch (e) {
            Toast.show({ content: '验证码校验失败', icon: 'fail' });
            loadCaptcha();
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
                Toast.show({ content: '登录成功', icon: 'success' });
                router.push('/profile');
            } else {
                Toast.show({ content: '登录失败: Token缺失', icon: 'fail' });
            }
        } else {
            Toast.show({ content: result.message || '登录失败', icon: 'fail' });
            loadCaptcha();
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <NavBar onBack={() => router.back()} style={{ borderBottom: '1px solid #eee' }}>
                登录
            </NavBar>

            <div style={{ padding: '40px 24px' }}>
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 28, fontWeight: 600, color: '#333', marginBottom: 8 }}>欢迎登录</div>
                    <div style={{ fontSize: 14, color: '#999' }}>订单管理系统</div>
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
                            style={{ borderRadius: 24, height: 48, fontSize: 16, fontWeight: 500 }}
                        >
                            登录
                        </Button>
                    }
                >
                    <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                        <Input placeholder="请输入手机号" clearable style={{ '--font-size': '16px' }} />
                    </Form.Item>

                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Input
                                placeholder="请输入密码"
                                type={passwordVisible ? 'text' : 'password'}
                                style={{ flex: 1, '--font-size': '16px' }}
                            />
                            <div
                                style={{ padding: '0 8px', cursor: 'pointer' }}
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <EyeOutline fontSize={20} /> : <EyeInvisibleOutline fontSize={20} />}
                            </div>
                        </div>
                    </Form.Item>

                    <Form.Item name="captcha" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Input placeholder="请输入验证码" style={{ flex: 1, '--font-size': '16px' }} />
                            <div
                                onClick={loadCaptcha}
                                style={{
                                    width: 120,
                                    height: 40,
                                    background: '#f5f5f5',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                }}
                                dangerouslySetInnerHTML={{ __html: captchaSvg || '<span style="color:#999">点击加载</span>' }}
                            />
                        </div>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
                    还没有账号？
                    <span
                        style={{ color: '#1677ff', cursor: 'pointer' }}
                        onClick={() => router.push('/register')}
                    >
                        立即注册
                    </span>
                </div>

                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
                    <span
                        style={{ color: '#999', cursor: 'pointer' }}
                        onClick={() => router.push('/forgot-password')}
                    >
                        忘记密码？
                    </span>
                </div>
            </div>
        </div>
    );
}
