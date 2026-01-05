'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Toast, NavBar, NoticeBar } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline, InformationCircleOutline } from 'antd-mobile-icons';
import { BASE_URL } from '../../../apiConfig';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const phoneReg = /^1[3-9]\d{9}$/;
    const passWordReg = /^[a-zA-Z0-9_-]{6,16}$/;

    useEffect(() => {
        const invite = searchParams.get('invite');
        if (invite) {
            form.setFieldValue('invitationCode', invite);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [searchParams, form]);

    const sendYzm = async () => {
        const phone = form.getFieldValue('phone');
        if (!phone) {
            Toast.show({ content: '手机号码不能为空', icon: 'fail' });
            return;
        }
        if (!phoneReg.test(phone)) {
            Toast.show({ content: '手机号码格式不正确', icon: 'fail' });
            return;
        }

        try {
            await fetch(`${BASE_URL}/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, type: 'register' }),
            });
        } catch (error) {
            // Continue anyway for demo
        }

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`${num}秒`);
        Toast.show({ content: '验证码已发送', icon: 'success' });

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

    const handleRegister = async (values: any) => {
        if (!values.username) { Toast.show({ content: '用户名不能为空', icon: 'fail' }); return; }
        if (!values.phone) { Toast.show({ content: '手机号不能为空', icon: 'fail' }); return; }
        if (!phoneReg.test(values.phone)) { Toast.show({ content: '手机号格式不正确', icon: 'fail' }); return; }
        if (!values.smsCode) { Toast.show({ content: '短信验证码不能为空', icon: 'fail' }); return; }
        if (!values.password) { Toast.show({ content: '请输入密码', icon: 'fail' }); return; }
        if (!passWordReg.test(values.password)) { Toast.show({ content: '密码格式不正确', icon: 'fail' }); return; }
        if (values.password !== values.confirmPassword) { Toast.show({ content: '两次密码不一致', icon: 'fail' }); return; }
        if (!values.invitationCode) { Toast.show({ content: '请输入邀请码', icon: 'fail' }); return; }

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: values.username,
                    phone: values.phone,
                    password: values.password,
                    qq: values.qq || '',
                    invitationCode: values.invitationCode,
                    smsCode: values.smsCode,
                }),
            });
            const data = await response.json();

            if (data.success) {
                Toast.show({ content: '注册成功', icon: 'success' });
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
                Toast.show({ content: data.message || '注册失败', icon: 'fail' });
            }
        } catch (error) {
            Toast.show({ content: '网络错误', icon: 'fail' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff' }}>
            <NavBar onBack={() => router.back()} style={{ borderBottom: '1px solid #eee' }}>
                注册账号
            </NavBar>

            <div style={{ padding: '32px 24px' }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#333', marginBottom: 8 }}>注册账号</div>
                    <div style={{ fontSize: 14, color: '#999' }}>加入订单管理系统</div>
                </div>

                <Form form={form} layout="vertical" onFinish={handleRegister}>
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="用户名 (3-20位字符)" clearable style={{ '--font-size': '16px' }} />
                    </Form.Item>

                    <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                        <Input placeholder="手机号" maxLength={11} clearable style={{ '--font-size': '16px' }} />
                    </Form.Item>

                    <Form.Item name="smsCode" label="短信验证码" rules={[{ required: true, message: '请输入短信验证码' }]}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Input placeholder="短信验证码" maxLength={6} style={{ flex: 1, '--font-size': '16px' }} />
                            <Button
                                color="primary"
                                fill="outline"
                                size="small"
                                disabled={yzmDisabled}
                                onClick={sendYzm}
                                style={{ whiteSpace: 'nowrap', minWidth: 100 }}
                            >
                                {yzmMsg}
                            </Button>
                        </div>
                    </Form.Item>

                    <Form.Item name="qq" label="QQ号 (选填)">
                        <Input placeholder="QQ号" clearable style={{ '--font-size': '16px' }} />
                    </Form.Item>

                    <Form.Item name="invitationCode" label="邀请码" rules={[{ required: true, message: '请输入邀请码' }]}>
                        <Input placeholder="邀请码 (必填)" clearable style={{ '--font-size': '16px' }} />
                    </Form.Item>

                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Input
                                placeholder="6-16位字母数字下划线"
                                type={passwordVisible ? 'text' : 'password'}
                                style={{ flex: 1, '--font-size': '16px' }}
                            />
                            <div style={{ padding: '0 8px', cursor: 'pointer' }} onClick={() => setPasswordVisible(!passwordVisible)}>
                                {passwordVisible ? <EyeOutline fontSize={20} /> : <EyeInvisibleOutline fontSize={20} />}
                            </div>
                        </div>
                    </Form.Item>

                    <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认密码' }]}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Input
                                placeholder="确认密码"
                                type={confirmPasswordVisible ? 'text' : 'password'}
                                style={{ flex: 1, '--font-size': '16px' }}
                            />
                            <div style={{ padding: '0 8px', cursor: 'pointer' }} onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                                {confirmPasswordVisible ? <EyeOutline fontSize={20} /> : <EyeInvisibleOutline fontSize={20} />}
                            </div>
                        </div>
                    </Form.Item>

                    <Button
                        block
                        type="submit"
                        color="primary"
                        size="large"
                        loading={loading}
                        style={{ borderRadius: 24, height: 48, fontSize: 16, fontWeight: 500, marginTop: 16 }}
                    >
                        注册
                    </Button>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
                    已有账号？
                    <span style={{ color: '#1677ff', cursor: 'pointer' }} onClick={() => router.push('/login')}>立即登录</span>
                </div>

                <NoticeBar
                    content="密码格式要求：6到16位，可包含字母、数字、下划线、减号"
                    color="info"
                    icon={<InformationCircleOutline />}
                    style={{ marginTop: 24, borderRadius: 8 }}
                />
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
