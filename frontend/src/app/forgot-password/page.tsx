'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../apiConfig';

// ===================== 主组件 =====================
export default function ForgotPasswordPage() {
    const router = useRouter();

    // ===================== 状态 =====================
    const [submitting, setSubmitting] = useState(false);
    const [mobile, setMobile] = useState('');
    const [dxyzm, setDxyzm] = useState('');           // 短信验证码
    const [newpassword, setNewpassword] = useState('');
    const [newpassword2, setNewpassword2] = useState('');

    // 验证码发送状态
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const [isDisabled, setIsDisabled] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ===================== 工具函数 =====================
    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // 正则表达式
    const passWordReg = /^[a-zA-Z0-9_-]{6,16}$/;
    const phoneReg = /^1[3-9]\d{9}$/;

    // ===================== API 调用 =====================
    // 发送验证码
    const sendYzm = async () => {
        if (!mobile) {
            alertError('手机号不能为空');
            return;
        }
        if (!phoneReg.test(mobile)) {
            alertError('手机号码格式不规范,请检查后重新输入');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobile: mobile,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                // 开始倒计时
                let num = 60;
                setIsDisabled(true);
                setYzmMsg(`还剩 ${num} 秒`);

                timerRef.current = setInterval(() => {
                    num--;
                    setYzmMsg(`还剩 ${num} 秒`);
                    if (num <= 0) {
                        setIsDisabled(false);
                        setYzmMsg('重新发送');
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                    }
                    if (num === 59) {
                        alertSuccess('验证码发送成功');
                    }
                }, 1000);
            } else {
                alertError(data.msg || '发送失败');
            }
        } catch (error) {
            // 即使失败也开始倒计时（模拟旧版行为）
            let num = 60;
            setIsDisabled(true);
            setYzmMsg(`还剩 ${num} 秒`);

            timerRef.current = setInterval(() => {
                num--;
                setYzmMsg(`还剩 ${num} 秒`);
                if (num <= 0) {
                    setIsDisabled(false);
                    setYzmMsg('重新发送');
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                }
                if (num === 59) {
                    alertSuccess('验证码发送成功');
                }
            }, 1000);
        }
    };

    // 修改密码
    const handleSubmit = async () => {
        if (!mobile) {
            alertError('手机号不能为空');
            return;
        }
        if (!phoneReg.test(mobile)) {
            alertError('手机号码格式不规范,请检查后重新输入');
            return;
        }
        if (!dxyzm) {
            alertError('短信验证码不能为空');
            return;
        }
        if (!newpassword) {
            alertError('请输入新密码');
            return;
        }
        if (!passWordReg.test(newpassword)) {
            alertError('密码格式不规范,6到16位,(字母,数字,下划线,减号)');
            return;
        }
        if (!newpassword2) {
            alertError('确认密码不能为空');
            return;
        }
        if (newpassword !== newpassword2) {
            alertError('两次输入的密码不一致');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/login/forget_edit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobile: mobile,
                    dxyzm: dxyzm,
                    newpassword: newpassword,
                    newpassword2: newpassword2,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg);
                setTimeout(() => {
                    router.push(data.url || '/login');
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    // ===================== 渲染 =====================
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '30px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}>
                {/* 标题 */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>忘记密码</h1>
                    <a
                        href="/login"
                        style={{ fontSize: '14px', color: '#409eff', textDecoration: 'none' }}
                    >
                        返回登录
                    </a>
                </div>

                {/* 手机号 */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="请输入手机号"
                        maxLength={11}
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* 短信验证码 */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={dxyzm}
                        onChange={(e) => setDxyzm(e.target.value)}
                        placeholder="短信验证码"
                        maxLength={6}
                        style={{
                            flex: 1,
                            padding: '12px 15px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                        }}
                    />
                    <button
                        onClick={sendYzm}
                        disabled={isDisabled}
                        style={{
                            padding: '12px 15px',
                            background: isDisabled ? '#a0cfff' : '#409eff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {yzmMsg}
                    </button>
                </div>

                {/* 新密码 */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="password"
                        value={newpassword}
                        onChange={(e) => setNewpassword(e.target.value)}
                        placeholder="请输入新密码"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* 确认密码 */}
                <div style={{ marginBottom: '25px' }}>
                    <input
                        type="password"
                        value={newpassword2}
                        onChange={(e) => setNewpassword2(e.target.value)}
                        placeholder="请确认新密码"
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* 提交按钮 */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: submitting ? '#a0cfff' : '#409eff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {submitting ? '提交中...' : '修改密码'}
                </button>

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
        </div>
    );
}
