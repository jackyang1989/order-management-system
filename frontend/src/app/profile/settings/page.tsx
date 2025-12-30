'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // 用户信息（Mock）
    const [userInfo, setUserInfo] = useState({
        username: 'test_user',
        mobile: '138****8888',
        qq: '123456789',
        vip: true,
        vipExpireTime: '2024-12-31'
    });

    // 弹窗状态
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPayPwdModal, setShowPayPwdModal] = useState(false);

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
        confirmPassword: '',
        phone: '',
        verifyCode: ''
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
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendVerifyCode = (phone: string) => {
        if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号码');
            return;
        }
        // Mock 发送验证码
        alert('验证码已发送');
        setCountdown(60);
    };

    const handleChangePhone = () => {
        if (!phoneForm.oldPhone || !phoneForm.payPassword || !phoneForm.newPhone || !phoneForm.verifyCode) {
            alert('请填写完整信息');
            return;
        }
        // Mock 修改手机号
        alert('手机号修改成功');
        setShowPhoneModal(false);
        setPhoneForm({ oldPhone: '', payPassword: '', newPhone: '', verifyCode: '' });
    };

    const handleChangePassword = () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert('请填写完整信息');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        // Mock 修改密码
        alert('登录密码修改成功');
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '', phone: '', verifyCode: '' });
    };

    const handleChangePayPwd = () => {
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
        // Mock 修改支付密码
        alert('支付密码修改成功');
        setShowPayPwdModal(false);
        setPayPwdForm({ newPayPassword: '', confirmPayPassword: '', phone: '', verifyCode: '' });
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
                    <div style={valueStyle}>{userInfo.qq}</div>
                </div>
                <div style={cellStyle}>
                    <div style={labelStyle}>手机号码</div>
                    <div style={valueStyle}>{userInfo.mobile}</div>
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
                {userInfo.vip && (
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
                                        onClick={() => sendVerifyCode(phoneForm.newPhone)}
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
                            <button onClick={handleChangePhone} style={{ ...modalBtnStyle, background: '#409eff', color: '#fff' }}>确认</button>
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
                                    placeholder="请输入新登录密码"
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
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '13px', color: '#666' }}>手机号码 <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    placeholder="请输入手机号码"
                                    value={passwordForm.phone}
                                    onChange={e => setPasswordForm({ ...passwordForm, phone: e.target.value })}
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
                                        value={passwordForm.verifyCode}
                                        onChange={e => setPasswordForm({ ...passwordForm, verifyCode: e.target.value })}
                                        style={{ ...inputStyle, flex: 1, marginTop: 0 }}
                                    />
                                    <button
                                        onClick={() => sendVerifyCode(passwordForm.phone)}
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
                            <button onClick={() => setShowPasswordModal(false)} style={{ ...modalBtnStyle, background: '#f5f5f5', color: '#666' }}>取消</button>
                            <button onClick={handleChangePassword} style={{ ...modalBtnStyle, background: '#409eff', color: '#fff' }}>确认</button>
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
                                        onClick={() => sendVerifyCode(payPwdForm.phone)}
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
                            <button onClick={handleChangePayPwd} style={{ ...modalBtnStyle, background: '#409eff', color: '#fff' }}>确认</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
