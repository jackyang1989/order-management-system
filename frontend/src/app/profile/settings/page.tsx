'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { isAuthenticated, getToken } from '../../../services/authService';
import {
    fetchUserProfile,
    sendProfileSmsCode,
    changePassword,
    changePayPassword,
    changePhone
} from '../../../services/userService';

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
            const data = await fetchUserProfile();
            if (data) {
                setUserInfo({
                    username: data.username,
                    mobile: data.phone,
                    qq: data.qq || '',
                    vip: data.vip,
                    vipExpireAt: data.vipExpireAt || ''
                });
                setPhoneForm(p => ({ ...p, oldPhoneNum: data.phone }));
                setPasswordForm(p => ({ ...p, phoneNum: data.phone }));
                setPayPwdForm(p => ({ ...p, phoneNum: data.phone }));
            }
        } catch (e) {
            console.error('Load user info error:', e);
        } finally {
            setLoading(false);
        }
    };

    const sendYzm = async (type: number) => {
        const phone = type === 1 ? phoneForm.newPhoneNum : (type === 2 ? passwordForm.phoneNum : payPwdForm.phoneNum);
        if (!phone) { toastError('请输入手机号'); return; }

        const typeMap: Record<number, 'change_phone' | 'change_password' | 'change_pay_password'> = {
            1: 'change_phone',
            2: 'change_password',
            3: 'change_pay_password'
        };

        try {
            const result = await sendProfileSmsCode(phone, typeMap[type]);
            if (result.success) {
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
            } else {
                toastError(result.message);
            }
        } catch (e) {
            toastError('发送失败');
        }
    };

    const phoneBtnActive = async () => {
        if (!phoneForm.zhifuPassWord) { toastError('支付密码不能为空'); return; }
        if (!phoneForm.newPhoneNum) { toastError('新手机号不能为空'); return; }
        if (!phoneForm.newYzmNum) { toastError('验证码不能为空'); return; }

        setSubmitting(true);
        try {
            const result = await changePhone({
                oldPhone: phoneForm.oldPhoneNum,
                payPassword: phoneForm.zhifuPassWord,
                newPhone: phoneForm.newPhoneNum,
                smsCode: phoneForm.newYzmNum
            });
            if (result.success) {
                toastSuccess(result.message);
                setTimeout(() => {
                    setShowPhoneModal(false);
                    loadUserInfo();
                }, 2000);
            } else {
                toastError(result.message);
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    const editBtnActive = async () => {
        if (!passwordForm.oldPassWord) { toastError('原登录密码不能为空'); return; }
        if (!passwordForm.newPassWord) { toastError('新登录密码不能为空'); return; }
        if (passwordForm.newPassWord !== passwordForm.queRenPassWord) { toastError('两次密码不一致'); return; }

        setSubmitting(true);
        try {
            const result = await changePassword({
                oldPassword: passwordForm.oldPassWord,
                newPassword: passwordForm.newPassWord
            });
            if (result.success) {
                toastSuccess(result.message);
                setTimeout(() => {
                    setShowPasswordModal(false);
                }, 2000);
            } else {
                toastError(result.message);
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    const zhiFuBtnActive = async () => {
        if (!payPwdForm.newZhiFuPassWord) { toastError('新支付密码不能为空'); return; }
        if (payPwdForm.newZhiFuPassWord.length !== 6) { toastError('支付密码必须为6位数字'); return; }
        if (payPwdForm.newZhiFuPassWord !== payPwdForm.queRenZhiFuPassWord) { toastError('两次密码不一致'); return; }

        setSubmitting(true);
        try {
            const result = await changePayPassword({
                newPayPassword: payPwdForm.newZhiFuPassWord,
                phone: payPwdForm.phoneNum,
                smsCode: payPwdForm.yzmNum
            });
            if (result.success) {
                toastSuccess(result.message);
                setTimeout(() => {
                    setShowPayPwdModal(false);
                }, 2000);
            } else {
                toastError(result.message);
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

    const maskedPhone = userInfo.mobile ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';

    const SectionHeader = ({ title }: { title: string }) => (
        <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
    );

    const InfoRow = ({ label, value, action, onClick, showArrow }: { label: string; value: string; action?: () => void; onClick?: () => void; showArrow?: boolean }) => (
        <div
            className={`flex items-center px-4 py-4 ${onClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
            onClick={onClick}
        >
            <span className="flex-1 text-sm font-semibold text-slate-500">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                onClick ? 'text-blue-600' : 'text-slate-900'
            )}>
                {value}{showArrow && ' ›'}
            </span>
            {action && (
                <button
                    onClick={(e) => { e.stopPropagation(); action(); }}
                    className="ml-4 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
                >
                    修改
                </button>
            )}
        </div>
    );

    const formatVipExpiry = () => {
        if (!userInfo.vip) return '未开通';
        if (!userInfo.vipExpireAt) return '永久有效';
        const date = new Date(userInfo.vipExpireAt);
        return date.toISOString().split('T')[0];
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-10">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">基本信息</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-6">
                {/* User Info Card */}
                <div className="rounded-[32px] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner">
                        👤
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{userInfo.username}</h2>
                </div>

                {/* Personal Section */}
                <div>
                    <SectionHeader title="个人信息" />
                    <Card className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <InfoRow label="用户名" value={userInfo.username} />
                        <InfoRow label="手机号" value={maskedPhone} action={() => setShowPhoneModal(true)} />
                        <InfoRow label="QQ号" value={userInfo.qq || '未绑定'} />
                    </Card>
                </div>

                {/* Membership Section */}
                <div>
                    <SectionHeader title="会员信息" />
                    <Card className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <InfoRow label="会员状态" value={userInfo.vip ? 'VIP会员' : '普通会员'} />
                        <InfoRow
                            label="开通/续费"
                            value={userInfo.vip ? '续费' : '立即开通'}
                            onClick={() => router.push('/profile/vip')}
                            showArrow={true}
                        />
                        <InfoRow label="到期时间" value={formatVipExpiry()} />
                    </Card>
                </div>

                {/* Security Section */}
                <div>
                    <SectionHeader title="安全设置" />
                    <Card className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <InfoRow label="登陆密码" value="********" action={() => setShowPasswordModal(true)} />
                        <InfoRow label="支付密码" value="********" action={() => setShowPayPwdModal(true)} />
                    </Card>
                </div>
            </div>

            {/* Flat-styled Modals */}
            <Modal title="修改手机号" open={showPhoneModal} onClose={() => setShowPhoneModal(false)}>
                <div className="space-y-5 px-1 py-1">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">原手机号码</label>
                        <input className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400" value={phoneForm.oldPhoneNum} readOnly />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">支付密码</label>
                        <input type="password" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" placeholder="请输入支付密码" value={phoneForm.zhifuPassWord} onChange={e => setPhoneForm(p => ({ ...p, zhifuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">新手机号码</label>
                        <input className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" placeholder="请输入新手机号" value={phoneForm.newPhoneNum} onChange={e => setPhoneForm(p => ({ ...p, newPhoneNum: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">验证码</label>
                        <div className="flex gap-2">
                            <input className="flex-1 rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" placeholder="验证码" value={phoneForm.newYzmNum} onChange={e => setPhoneForm(p => ({ ...p, newYzmNum: e.target.value }))} />
                            <button disabled={yzmDisabled} onClick={() => sendYzm(1)} className={cn('rounded-2xl px-5 text-sm font-black transition active:scale-95', yzmDisabled ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white')}>
                                {yzmMsg}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowPhoneModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-500">取消</button>
                        <button disabled={submitting} onClick={phoneBtnActive} className="flex-1 rounded-[20px] bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改登陆密码" open={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
                <div className="space-y-5 px-1 py-1">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">原登陆密码</label>
                        <input type="password" placeholder="请输入原密码" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" value={passwordForm.oldPassWord} onChange={e => setPasswordForm(p => ({ ...p, oldPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">新登陆密码</label>
                        <input type="password" placeholder="请输入新密码" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" value={passwordForm.newPassWord} onChange={e => setPasswordForm(p => ({ ...p, newPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">确认新密码</label>
                        <input type="password" placeholder="请确认新密码" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" value={passwordForm.queRenPassWord} onChange={e => setPasswordForm(p => ({ ...p, queRenPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5 text-center">
                        <p className="text-[10px] font-medium text-slate-400">目前暂时通过原密码验证，如需手机验证请联系客服</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowPasswordModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-500">取消</button>
                        <button disabled={submitting} onClick={editBtnActive} className="flex-1 rounded-[20px] bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改支付密码" open={showPayPwdModal} onClose={() => setShowPayPwdModal(false)}>
                <div className="space-y-5 px-1 py-1">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">新支付密码</label>
                        <input type="password" placeholder="6位数字密码" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" value={payPwdForm.newZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, newZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">确认新密码</label>
                        <input type="password" placeholder="请确认新密码" className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" value={payPwdForm.queRenZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, queRenZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">手机号码</label>
                        <input className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400" value={payPwdForm.phoneNum} readOnly />
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">验证码</label>
                        <div className="flex gap-2">
                            <input className="flex-1 rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none" placeholder="验证码" value={payPwdForm.yzmNum} onChange={e => setPayPwdForm(p => ({ ...p, yzmNum: e.target.value }))} />
                            <button disabled={yzmDisabled3} onClick={() => sendYzm(3)} className={cn('rounded-2xl px-5 text-sm font-black transition active:scale-95', yzmDisabled3 ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white')}>
                                {yzmMsg3}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowPayPwdModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-500">取消</button>
                        <button disabled={submitting} onClick={zhiFuBtnActive} className="flex-1 rounded-[20px] bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
