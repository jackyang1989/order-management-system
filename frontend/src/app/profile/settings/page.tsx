'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import { fetchUserProfile } from '../../../services/userService';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

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

    // 修改手机表单
    const [phoneForm, setPhoneForm] = useState({
        oldPhone: '',
        payPassword: '',
        newPhone: '',
        verifyCode: ''
    });

    // 修改登录密码表单
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 修改支付密码表单
    const [payPwdForm, setPayPwdForm] = useState({
        newPayPassword: '',
        confirmPayPassword: '',
        phone: '',
        verifyCode: ''
    });

    // 验证码倒计时
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadUserInfo();
    }, [router]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const loadUserInfo = async () => {
        try {
            const data = await fetchUserProfile();
            setUserInfo({
                username: data.username || '',
                mobile: data.phone || '',
                qq: data.qq || '',
                realName: data.realName || '',
                vip: data.vip || false,
                vipExpireTime: data.vipExpireAt ? new Date(data.vipExpireAt).toLocaleDateString() : ''
            });
            // 预填手机号
            setPayPwdForm(prev => ({ ...prev, phone: data.phone || '' }));
            setPhoneForm(prev => ({ ...prev, oldPhone: data.phone || '' }));
        } catch (error) {
            console.error('Failed to load user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendVerifyCode = async (phone: string, type: string) => {
        if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号码');
            return;
        }

        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/user/send-sms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ phone, type })
            });
            const data = await res.json();
            if (data.success) {
                alert('验证码已发送');
                setCountdown(60);
            } else {
                alert(data.message || '发送失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        }
    };

    const handleChangePhone = async () => {
        if (!phoneForm.oldPhone || !phoneForm.payPassword || !phoneForm.newPhone || !phoneForm.verifyCode) {
            alert('请填写完整信息');
            return;
        }
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/user/change-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPhone: phoneForm.oldPhone,
                    payPassword: phoneForm.payPassword,
                    newPhone: phoneForm.newPhone,
                    smsCode: phoneForm.verifyCode
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('手机号修改成功');
                setShowPhoneModal(false);
                setPhoneForm({ oldPhone: '', payPassword: '', newPhone: '', verifyCode: '' });
                loadUserInfo();
            } else {
                alert(data.message || '修改失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert('请填写完整信息');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            alert('密码长度不能少于6位');
            return;
        }
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/user/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('登录密码修改成功');
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                alert(data.message || '修改失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePayPwd = async () => {
        if (!payPwdForm.newPayPassword || !payPwdForm.confirmPayPassword || !payPwdForm.verifyCode) {
            alert('请填写完整信息');
            return;
        }
        if (payPwdForm.newPayPassword !== payPwdForm.confirmPayPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        if (!/^\d{6}$/.test(payPwdForm.newPayPassword)) {
            alert('支付密码必须为6位数字');
            return;
        }
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/user/change-pay-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    newPayPassword: payPwdForm.newPayPassword,
                    phone: payPwdForm.phone,
                    smsCode: payPwdForm.verifyCode
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('支付密码修改成功');
                setShowPayPwdModal(false);
                setPayPwdForm({ newPayPassword: '', confirmPayPassword: '', phone: userInfo.mobile, verifyCode: '' });
            } else {
                alert(data.message || '修改失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
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
        marginTop: '8px'
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
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>个人信息</div>
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
                {userInfo.realName && (
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>实名: {userInfo.realName}</div>
                )}
            </div>

            {/* 基本信息 */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>基本信息</div>
                <div style={cellStyle}>
                    <div style={labelStyle}>用户名</div>
                    <div style={valueStyle}>{userInfo.username}</div>
                </div>
                {userInfo.qq && (
                    <div style={cellStyle}>
                        <div style={labelStyle}>QQ账号</div>
                        <div style={valueStyle}>{userInfo.qq}</div>
                    </div>
                )}
                <div style={cellStyle}>
                    <div style={labelStyle}>手机号码</div>
                    <div style={valueStyle}>{maskedPhone}</div>
                    <button style={editBtnStyle} onClick={() => setShowPhoneModal(true)}>修改</button>
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
                            <span style={{ color: '#999' }}>普通会员</span>
                        )}
                    </div>
                </div>
                {userInfo.vip && userInfo.vipExpireTime && (
                    <div style={cellStyle}>
                        <div style={labelStyle}>到期时间</div>
                        <div style={valueStyle}>{userInfo.vipExpireTime}</div>
                    </div>
                )}
            </div>

            {/* 安全设置 */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>安全设置</div>
                <div style={cellStyle}>
                    <div style={labelStyle}>登录密码</div>
                    <div style={valueStyle}>**********</div>
                    <button style={editBtnStyle} onClick={() => setShowPasswordModal(true)}>修改</button>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>支付密码</div>
                    <div style={valueStyle}>**********</div>
                    <button style={editBtnStyle} onClick={() => setShowPayPwdModal(true)}>修改</button>
                </div>
            </div>

            {/* 修改手机号弹窗 */}
            {showPhoneModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改手机号码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>原手机号码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入原手机号码"
                                    value={phoneForm.oldPhone}
                                    onChange={e => setPhoneForm({ ...phoneForm, oldPhone: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>支付密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入6位支付密码"
                                    maxLength={6}
                                    value={phoneForm.payPassword}
                                    onChange={e => setPhoneForm({ ...phoneForm, payPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新手机号码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入新手机号码"
                                    value={phoneForm.newPhone}
                                    onChange={e => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>验证码 <span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="请输入验证码"
                                        maxLength={6}
                                        value={phoneForm.verifyCode}
                                        onChange={e => setPhoneForm({ ...phoneForm, verifyCode: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                                    />
                                    <button
                                        onClick={() => sendVerifyCode(phoneForm.newPhone, 'change_phone')}
                                        disabled={countdown > 0}
                                        style={{
                                            padding: '10px 15px',
                                            background: countdown > 0 ? '#ccc' : '#409eff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            cursor: countdown > 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {countdown > 0 ? `${countdown}秒` : '发送验证码'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPhoneModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={handleChangePhone} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 修改登录密码弹窗 */}
            {showPasswordModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改登录密码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>原登录密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入原登录密码"
                                    value={passwordForm.oldPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新登录密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入新登录密码（至少6位）"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>确认新密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请确认新登录密码"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPasswordModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={handleChangePassword} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 修改支付密码弹窗 */}
            {showPayPwdModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalStyle}>
                        <div style={modalHeaderStyle}>修改支付密码</div>
                        <div style={modalBodyStyle}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>新支付密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请输入6位支付密码"
                                    maxLength={6}
                                    value={payPwdForm.newPayPassword}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, newPayPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>确认新密码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="password"
                                    placeholder="请确认新支付密码"
                                    maxLength={6}
                                    value={payPwdForm.confirmPayPassword}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, confirmPayPassword: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>手机号码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入手机号码"
                                    value={payPwdForm.phone}
                                    onChange={e => setPayPwdForm({ ...payPwdForm, phone: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>验证码 <span style={{ color: 'red' }}>*</span></label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="请输入验证码"
                                        maxLength={6}
                                        value={payPwdForm.verifyCode}
                                        onChange={e => setPayPwdForm({ ...payPwdForm, verifyCode: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                                    />
                                    <button
                                        onClick={() => sendVerifyCode(payPwdForm.phone, 'change_pay_password')}
                                        disabled={countdown > 0}
                                        style={{
                                            padding: '10px 15px',
                                            background: countdown > 0 ? '#ccc' : '#409eff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            whiteSpace: 'nowrap',
                                            cursor: countdown > 0 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {countdown > 0 ? `${countdown}秒` : '发送验证码'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button onClick={() => setShowPayPwdModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={handleChangePayPwd} disabled={submitting} style={{ ...modalBtnStyle, background: submitting ? '#ccc' : '#409eff', color: '#fff' }}>
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
