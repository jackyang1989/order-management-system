'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ========================
    // 注册表单 - 对齐旧版 register.html
    // 旧版参数: mobile, login_pwd, login_pwd2, qq, username, dxyzm, type, invite
    // ========================
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');         // 对应旧版 mobile
    const [password, setPassword] = useState('');    // 对应旧版 login_pwd
    const [confirmPassword, setConfirmPassword] = useState(''); // 对应旧版 login_pwd2
    const [qq, setQq] = useState('');                // 对应旧版 qq
    const [dxyzm, setDxyzm] = useState('');          // 对应旧版 dxyzm (短信验证码)
    const [invitationCode, setInvitationCode] = useState(''); // 对应旧版 invite
    const [loading, setLoading] = useState(false);

    // 验证码状态 - 对齐旧版 yzmMsg
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 正则表达式 - 对齐旧版
    const phoneReg = /^1[3-9]\d{9}$/;
    const passWordReg = /^[a-zA-Z0-9_-]{6,16}$/;

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        const invite = searchParams.get('invite');
        if (invite) {
            setInvitationCode(invite);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [searchParams]);

    // ========================
    // 发送验证码 - 对齐旧版 mobile/way/send_code
    // ========================
    const sendYzm = async () => {
        if (!phone) {
            return alertError('手机号码不能为空');
        }
        if (!phoneReg.test(phone)) {
            return alertError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: phone,
                }),
            });
        } catch (error) {
            // 忽略错误，继续倒计时（对齐旧版行为）
        }

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`还剩 ${num} 秒`);

        timerRef.current = setInterval(() => {
            num--;
            setYzmMsg(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef.current!);
                setYzmMsg('重新发送');
                setYzmDisabled(false);
            } else if (num === 59) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    };

    // ========================
    // 注册 - 对齐旧版 mobile/login/check_register
    // 参数: mobile, login_pwd, login_pwd2, qq, username, dxyzm, type, invite
    // ========================
    const handleRegister = async () => {
        if (!username) { return alertError('用户名不能为空'); }
        if (!phone) { return alertError('手机号不能为空'); }
        if (!phoneReg.test(phone)) { return alertError('手机号码格式不规范,请检查后重新输入'); }
        if (!dxyzm) { return alertError('短信验证码不能为空'); }
        if (!password) { return alertError('请输入密码'); }
        if (!passWordReg.test(password)) { return alertError('密码格式不规范,6到16位,(字母,数字,下划线,减号)'); }
        if (!confirmPassword) { return alertError('请确认密码'); }
        if (password !== confirmPassword) { return alertError('两次密码不一致'); }
        if (!invitationCode) { return alertError('请输入邀请码'); }

        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/login/check_register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: phone,
                    login_pwd: password,
                    login_pwd2: confirmPassword,
                    qq: qq,
                    username: username,
                    dxyzm: dxyzm,
                    type: 2,
                    invite: invitationCode,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg || '注册成功');
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else if (data.token) {
                        localStorage.setItem('token', data.token);
                        if (data.user) {
                            localStorage.setItem('user', JSON.stringify(data.user));
                        }
                        router.push('/profile');
                    } else {
                        router.push('/login');
                    }
                }, 3000);
            } else {
                alertError(data.msg || '注册失败');
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#fff', padding: '40px 30px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>注册账号</div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '40px' }}>加入订单管理系统</div>

            {/* 用户名 */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="用户名 (3-20位字符)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* 手机号 */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="手机号"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* 短信验证码 - 对齐旧版 */}
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                <input
                    type="text"
                    placeholder="短信验证码"
                    maxLength={6}
                    value={dxyzm}
                    onChange={(e) => setDxyzm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '15px 0',
                        border: 'none',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <button
                    onClick={sendYzm}
                    disabled={yzmDisabled}
                    style={{
                        padding: '10px 15px',
                        background: yzmDisabled ? '#a0cfff' : '#409eff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        cursor: yzmDisabled ? 'not-allowed' : 'pointer'
                    }}
                >
                    {yzmMsg}
                </button>
            </div>

            {/* QQ号 - 对齐旧版 */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="QQ号 (选填)"
                    value={qq}
                    onChange={(e) => setQq(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* 邀请码 */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="邀请码 (必填)"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* 密码 */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="password"
                    placeholder="设置密码 (6-16位,字母数字下划线减号)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* 确认密码 */}
            <div style={{ marginBottom: '40px' }}>
                <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '15px 0',
                        border: 'none',
                        borderBottom: '1px solid #eee',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <button
                onClick={handleRegister}
                disabled={loading}
                style={{
                    width: '100%',
                    background: loading ? '#ccc' : '#409eff',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '25px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(64, 158, 255, 0.3)',
                    marginBottom: '20px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? '注册中...' : '注册'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                已有账号？
                <Link href="/login" style={{ color: '#409eff', textDecoration: 'none' }}>立即登录</Link>
            </div>

            {/* 密码格式提示 */}
            <div style={{
                marginTop: '20px',
                padding: '10px',
                background: '#f0f9ff',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#666',
            }}>
                <p>密码格式要求：6到16位，可包含字母、数字、下划线、减号</p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
