'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { isAuthenticated, getToken } from '../../../services/authService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userInfo, setUserInfo] = useState({ username: '用户', mobile: '', qq: '', vip: false, vipExpireAt: '' });

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPayPwdModal, setShowPayPwdModal] = useState(false);

    const [phoneForm, setPhoneForm] = useState({ oldPhoneNum: '', zhifuPassWord: '', newPhoneNum: '', newYzmNum: '' });
    const [passwordForm, setPasswordForm] = useState({ oldPassWord: '', newPassWord: '', queRenPassWord: '', phoneNum: '', newYzmNum: '' });
    const [payPwdForm, setPayPwdForm] = useState({ newZhiFuPassWord: '', queRenZhiFuPassWord: '', phoneNum: '', yzmNum: '' });

    const [yzmMsg, setYzmMsg] = useState('获取验证码');
    const [yzmMsg2, setYzmMsg2] = useState('获取验证码');
    const [yzmMsg3, setYzmMsg3] = useState('获取验证码');
    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmDisabled2, setYzmDisabled2] = useState(false);
    const [yzmDisabled3, setYzmDisabled3] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadUserInfo();
    }, [router]);

    const loadUserInfo = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.code === 1 && data.data) {
                setUserInfo({
                    username: data.data.username,
                    mobile: data.data.phone,
                    qq: data.data.qq,
                    vip: data.data.vip,
                    vipExpireAt: data.data.vipExpireAt
                });
                setPhoneForm(p => ({ ...p, oldPhoneNum: data.data.phone }));
                setPasswordForm(p => ({ ...p, phoneNum: data.data.phone }));
                setPayPwdForm(p => ({ ...p, phoneNum: data.data.phone }));
            }
        } catch (e) { console.error('Load user info error:', e); }
        finally { setLoading(false); }
    };

    const sendYzm = async (type: number) => {
        const phone = type === 1 ? phoneForm.newPhoneNum : (type === 2 ? passwordForm.phoneNum : payPwdForm.phoneNum);
        if (!phone) { toastError('请输入手机号'); return; }
        try {
            const res = await fetch(`${BASE_URL}/sms/send`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: phone, type }),
            });
            const data = await res.json();
            if (data.code === 1) {
                toastSuccess('验证码已发送');
                let count = 60;
                const setter = type === 1 ? setYzmMsg : (type === 2 ? setYzmMsg2 : setYzmMsg3);
                const disabler = type === 1 ? setYzmDisabled : (type === 2 ? setYzmDisabled2 : setYzmDisabled3);
                disabler(true);
                const timer = setInterval(() => {
                    count--;
                    setter(`${count}s`);
                    if (count <= 0) { clearInterval(timer); setter('重新获取'); disabler(false); }
                }, 1000);
            } else { toastError(data.msg); }
        } catch (e) { toastError('发送失败'); }
    };

    const phoneBtnActive = async () => {
        if (!phoneForm.zhifuPassWord) { toastError('支付密码不能为空'); return; }
        if (!phoneForm.newPhoneNum) { toastError('新手机号不能为空'); return; }
        if (!phoneForm.newYzmNum) { toastError('验证码不能为空'); return; }
        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/editphone`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ oldphone: phoneForm.oldPhoneNum, pay_pwd: phoneForm.zhifuPassWord, mobile: phoneForm.newPhoneNum, dxyzm: phoneForm.newYzmNum }),
            });
            const data = await response.json();
            if (data.code === 1) { toastSuccess(data.msg); setTimeout(() => { data.url ? router.push(data.url) : (setShowPhoneModal(false), loadUserInfo()); }, 2000); }
            else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const editBtnActive = async () => {
        if (!passwordForm.oldPassWord) { toastError('原登录密码不能为空'); return; }
        if (!passwordForm.newPassWord) { toastError('新登录密码不能为空'); return; }
        if (passwordForm.newPassWord !== passwordForm.queRenPassWord) { toastError('两次密码不一致'); return; }
        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_login_pwd`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ oldpwd: passwordForm.oldPassWord, newpwd: passwordForm.newPassWord, mobile: passwordForm.phoneNum, dxyzm: passwordForm.newYzmNum }),
            });
            const data = await response.json();
            if (data.code === 1) { toastSuccess(data.msg); setTimeout(() => { data.url ? router.push(data.url) : setShowPasswordModal(false); }, 2000); }
            else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const zhiFuBtnActive = async () => {
        if (!payPwdForm.newZhiFuPassWord) { toastError('新支付密码不能为空'); return; }
        if (payPwdForm.newZhiFuPassWord.length !== 6) { toastError('支付密码必须为6位数字'); return; }
        if (payPwdForm.newZhiFuPassWord !== payPwdForm.queRenZhiFuPassWord) { toastError('两次密码不一致'); return; }
        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_pay_pwd`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ pay_pwd: payPwdForm.newZhiFuPassWord, mobile: payPwdForm.phoneNum, dxyzm: payPwdForm.yzmNum }),
            });
            const data = await response.json();
            if (data.code === 1) { toastSuccess(data.msg); setTimeout(() => { data.url ? router.push(data.url) : setShowPayPwdModal(false); }, 2000); }
            else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

    const maskedPhone = userInfo.mobile ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';

    const InfoRow = ({ label, value, action }: { label: string; value: string; action?: () => void }) => (
        <div className="flex items-center border-b border-slate-100 px-4 py-3.5">
            <span className="w-20 text-sm text-slate-500">{label}</span>
            <span className="flex-1 text-right text-sm text-slate-800">{value}</span>
            {action && (
                <button onClick={action} className="ml-3 rounded border border-blue-500 px-3 py-1 text-xs text-blue-500">修改</button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-md items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">基本信息</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Avatar Section */}
                <div className="mb-4 flex flex-col items-center rounded-xl border border-slate-200 bg-white py-6 shadow-sm">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">👤</div>
                    <span className="text-base font-semibold text-slate-800">{userInfo.username}</span>
                </div>

                {/* Basic Info */}
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">基本信息</div>
                    <InfoRow label="用户名" value={userInfo.username} />
                    <InfoRow label="手机号" value={maskedPhone} action={() => setShowPhoneModal(true)} />
                    <InfoRow label="QQ号" value={userInfo.qq || '未绑定'} />
                </div>

                {/* VIP Info */}
                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">会员信息</div>
                    <InfoRow label="会员状态" value={userInfo.vip ? 'VIP会员' : '不是会员'} />
                    <InfoRow label="开通/续费" value="请联系客服" />
                    <InfoRow label="到期时间" value={userInfo.vipExpireAt || '-'} />
                </div>

                {/* Security Settings */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">安全设置</div>
                    <InfoRow label="登陆密码" value="**********" action={() => setShowPasswordModal(true)} />
                    <div className="flex items-center px-4 py-3.5">
                        <span className="w-20 text-sm text-slate-500">支付密码</span>
                        <span className="flex-1 text-right text-sm text-slate-800">**********</span>
                        <button onClick={() => setShowPayPwdModal(true)} className="ml-3 rounded border border-blue-500 px-3 py-1 text-xs text-blue-500">修改</button>
                    </div>
                </div>
            </ProfileContainer>

            {/* Modals are unchanged but updated classes for consistency */}
            <Modal title="修改手机号" open={showPhoneModal} onClose={() => setShowPhoneModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">原手机号码 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" value={phoneForm.oldPhoneNum} readOnly />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">支付密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请输入支付密码" value={phoneForm.zhifuPassWord} onChange={e => setPhoneForm(p => ({ ...p, zhifuPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">新手机号码 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请输入新手机号" value={phoneForm.newPhoneNum} onChange={e => setPhoneForm(p => ({ ...p, newPhoneNum: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="验证码" value={phoneForm.newYzmNum} onChange={e => setPhoneForm(p => ({ ...p, newYzmNum: e.target.value }))} />
                            <button disabled={yzmDisabled} onClick={() => sendYzm(1)} className={cn('rounded-lg px-4 py-2 text-xs font-medium transition', yzmDisabled ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                                {yzmMsg}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowPhoneModal(false)} className="flex-1">取消</Button>
                        <Button onClick={phoneBtnActive} loading={submitting} className="flex-1 bg-blue-500 hover:bg-blue-600">确定</Button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改登陆密码" open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">原登陆密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请输入原密码" value={passwordForm.oldPassWord} onChange={e => setPasswordForm(p => ({ ...p, oldPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">新登陆密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请输入新密码" value={passwordForm.newPassWord} onChange={e => setPasswordForm(p => ({ ...p, newPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">确认新密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请确认新密码" value={passwordForm.queRenPassWord} onChange={e => setPasswordForm(p => ({ ...p, queRenPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">手机号码 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" value={passwordForm.phoneNum} readOnly />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="验证码" value={passwordForm.newYzmNum} onChange={e => setPasswordForm(p => ({ ...p, newYzmNum: e.target.value }))} />
                            <button disabled={yzmDisabled2} onClick={() => sendYzm(2)} className={cn('rounded-lg px-4 py-2 text-xs font-medium transition', yzmDisabled2 ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                                {yzmMsg2}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="flex-1">取消</Button>
                        <Button onClick={editBtnActive} loading={submitting} className="flex-1 bg-blue-500 hover:bg-blue-600">确定</Button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改支付密码" open={showPayPwdModal} onClose={() => setShowPayPwdModal(false)}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">新支付密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="6位数字密码" value={payPwdForm.newZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, newZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">确认新密码 <span className="text-red-500">*</span></label>
                        <input type="password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="请确认新密码" value={payPwdForm.queRenZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, queRenZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">手机号码 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" value={payPwdForm.phoneNum} readOnly />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="验证码" value={payPwdForm.yzmNum} onChange={e => setPayPwdForm(p => ({ ...p, yzmNum: e.target.value }))} />
                            <button disabled={yzmDisabled3} onClick={() => sendYzm(3)} className={cn('rounded-lg px-4 py-2 text-xs font-medium transition', yzmDisabled3 ? 'bg-slate-200 text-slate-400' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                                {yzmMsg3}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowPayPwdModal(false)} className="flex-1">取消</Button>
                        <Button onClick={zhiFuBtnActive} loading={submitting} className="flex-1 bg-blue-500 hover:bg-blue-600">确定</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
