'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import { fetchUserProfile } from '../../../services/userService';

// 对齐旧版 API 基础路径
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // 用户信息
    const [userInfo, setUserInfo] = useState({
        username: '',
        mobile: '',
        qq: '',
        realName: '',
        vip: false,
        vipExpireTime: ''
    });

    // 弹窗状态
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPayPwdModal, setShowPayPwdModal] = useState(false);

    // 操作状态
    const [submitting, setSubmitting] = useState(false);

    // ========================
    // 修改手机号表单 - 对齐旧版 information.html phoneNumObj
    // 旧版参数: oldphone, pay_pwd, mobile, dxyzm
    // ========================
    const [phoneForm, setPhoneForm] = useState({
        oldPhoneNum: '',      // 对应旧版 oldPhoneNum -> oldphone
        zhifuPassWord: '',    // 对应旧版 zhifuPassWord -> pay_pwd
        newPhoneNum: '',      // 对应旧版 newPhoneNum -> mobile
        newYzmNum: ''         // 对应旧版 newYzmNum -> dxyzm
    });

    // ========================
    // 修改登录密码表单 - 对齐旧版 information.html passWordObj
    // 旧版参数: oldloginpwd, login_pwd, login_pwd2, mobile, dxyzm
    // ========================
    const [passwordForm, setPasswordForm] = useState({
        oldPassWord: '',      // 对应旧版 oldPassWord -> oldloginpwd
        newPassWord: '',      // 对应旧版 newPassWord -> login_pwd
        queRenPassWord: '',   // 对应旧版 queRenPassWord -> login_pwd2
        phoneNum: '',         // 对应旧版 phoneNum -> mobile
        newYzmNum: ''         // 对应旧版 newYzmNum -> dxyzm
    });

    // ========================
    // 修改支付密码表单 - 对齐旧版 information.html zhifuPassWordObj
    // 旧版参数: pay_pwd, pay_pwd2, mobile, dxyzm
    // ========================
    const [payPwdForm, setPayPwdForm] = useState({
        newZhiFuPassWord: '',      // 对应旧版 newZhiFuPassWord -> pay_pwd
        queRenZhiFuPassWord: '',   // 对应旧版 queRenZhiFuPassWord -> pay_pwd2
        phoneNum: '',              // 对应旧版 phoneNum -> mobile
        yzmNum: ''                 // 对应旧版 yzmNum -> dxyzm
    });

    // 验证码状态 - 三个独立倒计时对应旧版 yzmMsg/yzmMsg2/yzmMsg3
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmDisabled2, setYzmDisabled2] = useState(false);
    const [yzmDisabled3, setYzmDisabled3] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const [yzmMsg2, setYzmMsg2] = useState('发送验证码');
    const [yzmMsg3, setYzmMsg3] = useState('发送验证码');

    const timerRef1 = useRef<NodeJS.Timeout | null>(null);
    const timerRef2 = useRef<NodeJS.Timeout | null>(null);
    const timerRef3 = useRef<NodeJS.Timeout | null>(null);

    // 正则表达式 - 对齐旧版
    const phoneReg = /^1[3-9]\d{9}$/;
    const zhifuReg = /^\d{6}$/;

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadUserInfo();
        return () => {
            if (timerRef1.current) clearInterval(timerRef1.current);
            if (timerRef2.current) clearInterval(timerRef2.current);
            if (timerRef3.current) clearInterval(timerRef3.current);
        };
    }, [router]);

    const loadUserInfo = async () => {
        try {
            const data = await fetchUserProfile();
            if (!data) {
                console.error('Failed to fetch user profile');
                return;
            }
            setUserInfo({
                username: data.username || '',
                mobile: data.phone || '',
                qq: data.qq || '',
                realName: data.realName || '',
                vip: data.vip || false,
                vipExpireTime: data.vipExpireAt ? new Date(data.vipExpireAt).toLocaleDateString() : ''
            });
            // 预填手机号
            setPayPwdForm(prev => ({ ...prev, phoneNum: data.phone || '' }));
            setPasswordForm(prev => ({ ...prev, phoneNum: data.phone || '' }));
            setPhoneForm(prev => ({ ...prev, oldPhoneNum: data.phone || '' }));
        } catch (error) {
            console.error('Failed to load user info:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========================
    // 发送验证码 - 对齐旧版 mobile/way/send_code
    // ========================
    const sendYzm = async () => {
        if (!phoneForm.newPhoneNum) {
            return alertError('手机号码不能为空');
        }
        if (!phoneReg.test(phoneForm.newPhoneNum)) {
            return alertError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: phoneForm.newPhoneNum,
                    dxyzm: phoneForm.newYzmNum,
                }),
            });
        } catch (error) {
            // 忽略错误，继续倒计时（对齐旧版行为）
        }

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`还剩 ${num} 秒`);

        timerRef1.current = setInterval(() => {
            num--;
            setYzmMsg(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef1.current!);
                setYzmMsg('重新发送');
                setYzmDisabled(false);
            } else if (num === 59) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    };

    const sendYzm2 = async () => {
        if (!passwordForm.phoneNum) {
            return alertError('手机号码不能为空');
        }
        if (!phoneReg.test(passwordForm.phoneNum)) {
            return alertError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: passwordForm.phoneNum,
                    dxyzm: passwordForm.newYzmNum,
                }),
            });
        } catch (error) {
            // 忽略错误
        }

        let num = 60;
        setYzmDisabled2(true);
        setYzmMsg2(`还剩 ${num} 秒`);

        timerRef2.current = setInterval(() => {
            num--;
            setYzmMsg2(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef2.current!);
                setYzmMsg2('重新发送');
                setYzmDisabled2(false);
            } else if (num === 59) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    };

    const sendYzm3 = async () => {
        if (!payPwdForm.phoneNum) {
            return alertError('手机号码不能为空');
        }
        if (!phoneReg.test(payPwdForm.phoneNum)) {
            return alertError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: payPwdForm.phoneNum,
                    dxyzm: payPwdForm.yzmNum,
                }),
            });
        } catch (error) {
            // 忽略错误
        }

        let num = 60;
        setYzmDisabled3(true);
        setYzmMsg3(`还剩 ${num} 秒`);

        timerRef3.current = setInterval(() => {
            num--;
            setYzmMsg3(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef3.current!);
                setYzmMsg3('重新发送');
                setYzmDisabled3(false);
            } else if (num === 59) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    };

    // ========================
    // 修改手机号 - 对齐旧版 mobile/my/editphone
    // 参数: oldphone, pay_pwd, mobile, dxyzm
    // ========================
    const phoneBtnActive = async () => {
        if (!phoneForm.oldPhoneNum) { return alertError('原手机号码不能为空'); }
        if (!phoneForm.zhifuPassWord) { return alertError('支付密码不能为空'); }
        if (!phoneForm.newPhoneNum) { return alertError('新手机号码不能为空'); }
        if (!phoneForm.newYzmNum) { return alertError('新手机号码验证码不能为空'); }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/editphone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    oldphone: phoneForm.oldPhoneNum,
                    pay_pwd: phoneForm.zhifuPassWord,
                    mobile: phoneForm.newPhoneNum,
                    dxyzm: phoneForm.newYzmNum,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        setShowPhoneModal(false);
                        loadUserInfo();
                    }
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    // ========================
    // 修改登录密码 - 对齐旧版 mobile/my/edit_login_pwd
    // 参数: oldloginpwd, login_pwd, login_pwd2, mobile, dxyzm
    // ========================
    const editBtnActive = async () => {
        if (!passwordForm.oldPassWord) { return alertError('原登录密码不能为空'); }
        if (!passwordForm.newPassWord) { return alertError('新登录密码不能为空'); }
        if (!passwordForm.queRenPassWord) { return alertError('确认登录密码不能为空'); }
        if (!passwordForm.phoneNum) { return alertError('手机号码不能为空'); }
        if (!passwordForm.newYzmNum) { return alertError('验证码不能为空'); }
        if (!zhifuReg.test(passwordForm.newYzmNum)) {
            return alertError('验证码格式不规范');
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_login_pwd`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    oldloginpwd: passwordForm.oldPassWord,
                    login_pwd: passwordForm.newPassWord,
                    login_pwd2: passwordForm.queRenPassWord,
                    mobile: passwordForm.phoneNum,
                    dxyzm: passwordForm.newYzmNum,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        setShowPasswordModal(false);
                    }
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    // ========================
    // 修改支付密码 - 对齐旧版 mobile/my/edit_pay_pwd
    // 参数: pay_pwd, pay_pwd2, mobile, dxyzm
    // ========================
    const zhiFuBtnActive = async () => {
        if (!payPwdForm.newZhiFuPassWord) { return alertError('新支付密码不能为空'); }
        if (!payPwdForm.queRenZhiFuPassWord) { return alertError('确认新密码不能为空'); }
        if (!payPwdForm.phoneNum) { return alertError('手机号码不能为空'); }
        if (!payPwdForm.yzmNum) { return alertError('验证码不能为空'); }
        if (!zhifuReg.test(payPwdForm.newZhiFuPassWord)) {
            return alertError('您输入的密码不规范');
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_pay_pwd`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    pay_pwd: payPwdForm.newZhiFuPassWord,
                    pay_pwd2: payPwdForm.queRenZhiFuPassWord,
                    mobile: payPwdForm.phoneNum,
                    dxyzm: payPwdForm.yzmNum,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        setShowPayPwdModal(false);
                    }
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    const cellStyle = {
        display: 'flex',
        padding: '15px',
        borderBottom: '1px solid #f5f5f5',
        alignItems: 'center',
        background: '#fff'
    };

    const labelStyle = {
        width: '90px',
        fontSize: '14px',
        color: '#333'
    };

    const valueStyle = {
        flex: 1,
        fontSize: '14px',
        color: '#666',
        textAlign: 'right' as const
    };

    const editBtnStyle = {
        marginLeft: '10px',
        padding: '4px 10px',
        fontSize: '12px',
        color: '#409eff',
        background: 'transparent',
        border: '1px solid #409eff',
        borderRadius: '4px',
        cursor: 'pointer'
    };

    const modalOverlayStyle = {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    };

    const modalStyle = {
        background: '#fff',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto'
    };

    const modalHeaderStyle = {
        padding: '15px',
        borderBottom: '1px solid #e5e5e5',
        fontSize: '16px',
        fontWeight: 'bold' as const,
        textAlign: 'center' as const
    };

    const modalBodyStyle = {
        padding: '15px'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        marginTop: '8px',
        boxSizing: 'border-box' as const
    };

    const modalFooterStyle = {
        display: 'flex',
        borderTop: '1px solid #e5e5e5'
    };

    const modalBtnStyle = {
        flex: 1,
        padding: '12px',
        border: 'none',
        fontSize: '14px',
        cursor: 'pointer'
    };

    // 手机号脱敏显示
    const maskedPhone = userInfo.mobile ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#333' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>基本信息</div>
            </div>

            {/* 头像区域 */}
            <div style={{ background: '#fff', padding: '30px 0', textAlign: 'center', marginBottom: '10px' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#e0e0e0',
                    margin: '0 auto 15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px'
                }}>👤</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{userInfo.username}</div>
            </div>

            {/* 基本信息 */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>基本信息</div>
                <div style={cellStyle}>
                    <div style={labelStyle}>用户名</div>
                    <div style={valueStyle}>{userInfo.username}</div>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>QQ账号</div>
                    <div style={valueStyle}>{userInfo.qq || '-'}</div>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>手机号码</div>
                    <div style={valueStyle}>{maskedPhone}</div>
                    <button style={editBtnStyle} onClick={() => {
                        setPhoneForm({ oldPhoneNum: userInfo.mobile, zhifuPassWord: '', newPhoneNum: '', newYzmNum: '' });
                        setShowPhoneModal(true);
                    }}>修改</button>
                </div>
            </div>

            {/* 会员信息 */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>会员信息</div>
                <div style={cellStyle}>
                    <div style={labelStyle}>会员状态</div>
                    <div style={valueStyle}>
                        {userInfo.vip ? (
                            <span style={{ color: '#e6a23c' }}>VIP会员</span>
                        ) : (
                            <span style={{ color: '#999' }}>不是会员</span>
                        )}
                    </div>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>VIP延时</div>
                    <div style={{ ...valueStyle, color: '#409eff' }}>请联系客服</div>
                </div>
                {userInfo.vipExpireTime && (
                    <div style={cellStyle}>
                        <div style={labelStyle}>VIP时限</div>
                        <div style={valueStyle}>{userInfo.vipExpireTime}</div>
                    </div>
                )}
            </div>

            {/* 安全设置 */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>安全设置</div>
                <div style={cellStyle}>
                    <div style={labelStyle}>登录密码</div>
                    <div style={{ ...valueStyle, color: '#409eff' }}>**********</div>
                    <button style={editBtnStyle} onClick={() => {
                        setPasswordForm({ oldPassWord: '', newPassWord: '', queRenPassWord: '', phoneNum: userInfo.mobile, newYzmNum: '' });
                        setShowPasswordModal(true);
                    }}>修改</button>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>支付密码</div>
                    <div style={{ ...valueStyle, color: '#409eff' }}>**********</div>
                    <button style={editBtnStyle} onClick={() => {
                        setPayPwdForm({ newZhiFuPassWord: '', queRenZhiFuPassWord: '', phoneNum: userInfo.mobile, yzmNum: '' });
                        setShowPayPwdModal(true);
                    }}>修改</button>
                </div>
            </div>

            {/* 修改手机号弹窗 - 对齐旧版 information.html */}
            {showPhoneModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改手机号码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>原手机号码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入原手机号码"
                                    maxLength={13}
                                    value={phoneForm.oldPhoneNum}
                                    onChange={e => setPhoneForm({ ...phoneForm, oldPhoneNum: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>支付密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入6位支付密码"
                                    maxLength={6}
                                    value={phoneForm.zhifuPassWord}
                                    onChange={e => setPhoneForm({ ...phoneForm, zhifuPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新手机号码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入新手机号码"
                                    maxLength={13}
                                    value={phoneForm.newPhoneNum}
                                    onChange={e => setPhoneForm({ ...phoneForm, newPhoneNum: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>验证码：<span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="验证码"
                                        maxLength={6}
                                        value={phoneForm.newYzmNum}
                                        onChange={e => setPhoneForm({ ...phoneForm, newYzmNum: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
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
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            cursor: yzmDisabled ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {yzmMsg}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPhoneModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={phoneBtnActive} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 修改登录密码弹窗 - 对齐旧版 information.html */}
            {showPasswordModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改登录密码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>原登陆密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入原登录密码"
                                    maxLength={16}
                                    value={passwordForm.oldPassWord}
                                    onChange={e => setPasswordForm({ ...passwordForm, oldPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新登陆密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入新登录密码"
                                    maxLength={16}
                                    value={passwordForm.newPassWord}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>确认新密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请确认新登录密码"
                                    maxLength={16}
                                    value={passwordForm.queRenPassWord}
                                    onChange={e => setPasswordForm({ ...passwordForm, queRenPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>手机号码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入手机号码"
                                    maxLength={13}
                                    value={passwordForm.phoneNum}
                                    onChange={e => setPasswordForm({ ...passwordForm, phoneNum: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>验证码：<span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="验证码"
                                        maxLength={6}
                                        value={passwordForm.newYzmNum}
                                        onChange={e => setPasswordForm({ ...passwordForm, newYzmNum: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                                    />
                                    <button
                                        onClick={sendYzm2}
                                        disabled={yzmDisabled2}
                                        style={{
                                            padding: '10px 15px',
                                            background: yzmDisabled2 ? '#a0cfff' : '#409eff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            cursor: yzmDisabled2 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {yzmMsg2}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPasswordModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={editBtnActive} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 修改支付密码弹窗 - 对齐旧版 information.html */}
            {showPayPwdModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改支付密码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新支付密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入6位支付密码"
                                    maxLength={6}
                                    value={payPwdForm.newZhiFuPassWord}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, newZhiFuPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>确认新密码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请确认新支付密码"
                                    maxLength={6}
                                    value={payPwdForm.queRenZhiFuPassWord}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, queRenZhiFuPassWord: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>手机号码：<span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入手机号"
                                    maxLength={13}
                                    value={payPwdForm.phoneNum}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, phoneNum: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>验证码：<span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="验证码"
                                        maxLength={6}
                                        value={payPwdForm.yzmNum}
                                        onChange={e => setPayPwdForm({ ...payPwdForm, yzmNum: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                                    />
                                    <button
                                        onClick={sendYzm3}
                                        disabled={yzmDisabled3}
                                        style={{
                                            padding: '10px 15px',
                                            background: yzmDisabled3 ? '#a0cfff' : '#409eff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            cursor: yzmDisabled3 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {yzmMsg3}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPayPwdModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={zhiFuBtnActive} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
