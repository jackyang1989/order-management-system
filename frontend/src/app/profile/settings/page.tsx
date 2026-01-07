'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
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

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>;

    const maskedPhone = userInfo.mobile ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';

    const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
        <div className="mb-4 px-2 flex items-baseline justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</div>
            {sub && <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{sub}</div>}
        </div>
    );

    const InfoRow = ({ label, value, action, onClick, showArrow }: { label: string; value: string; action?: () => void; onClick?: () => void; showArrow?: boolean }) => (
        <div
            className={cn(
                "group flex items-center px-8 py-6 transition-all",
                (onClick || action) ? 'cursor-pointer active:bg-slate-50/50' : ''
            )}
            onClick={onClick || action}
        >
            <div className="flex-1 space-y-0.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                <div className={cn(
                    "text-sm font-black tracking-tight",
                    onClick ? 'text-blue-600' : 'text-slate-900'
                )}>
                    {value}{showArrow && ' ›'}
                </div>
            </div>
            {(onClick || action) && (
                <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
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

            <div className="mx-auto max-w-[515px] space-y-10 px-6 py-8">
                {/* User Info Card */}
                <div className="rounded-[40px] bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center border-none">
                    <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-slate-50 text-5xl shadow-inner border-4 border-white">
                        👤
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userInfo.username}</h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className={cn('rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest', userInfo.vip ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400')}>
                                {userInfo.vip ? 'VIP MEMBER' : 'PRO USER'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Personal Section */}
                <div>
                    <SectionHeader title="个人信息" sub="PERSONAL INFO" />
                    <Card className="divide-y divide-slate-50/50 overflow-hidden rounded-[32px] border-none shadow-[0_2px_24px_rgba(0,0,0,0.03)] bg-white">
                        <InfoRow label="用户名" value={userInfo.username} />
                        <InfoRow label="手机号" value={maskedPhone} action={() => setShowPhoneModal(true)} />
                        <InfoRow label="QQ号" value={userInfo.qq || '未绑定'} />
                    </Card>
                </div>

                {/* Membership Section */}
                <div>
                    <SectionHeader title="会员信息" sub="MEMBERSHIP" />
                    <Card className="divide-y divide-slate-50/50 overflow-hidden rounded-[32px] border-none shadow-[0_2px_24px_rgba(0,0,0,0.03)] bg-white">
                        <InfoRow label="会员状态" value={userInfo.vip ? 'VIP MEMBERSHIP' : 'REGULAR MEMBER'} />
                        <InfoRow
                            label="开通/续费"
                            value={userInfo.vip ? 'EXTEND MEMBERSHIP' : 'UPGRADE NOW'}
                            onClick={() => router.push('/profile/vip')}
                            showArrow={true}
                        />
                        <InfoRow label="到期时间" value={formatVipExpiry()} />
                    </Card>
                </div>

                {/* Security Section */}
                <div>
                    <SectionHeader title="安全设置" sub="SECURITY" />
                    <Card className="divide-y divide-slate-50/50 overflow-hidden rounded-[32px] border-none shadow-[0_2px_24px_rgba(0,0,0,0.03)] bg-white">
                        <InfoRow label="登陆密码" value="••••••••" action={() => setShowPasswordModal(true)} />
                        <InfoRow label="支付密码" value="••••••••" action={() => setShowPayPwdModal(true)} />
                    </Card>
                </div>
            </div>

            {/* Flat-styled Modals */}
            <Modal title="修改手机号" open={showPhoneModal} onClose={() => setShowPhoneModal(false)} className="rounded-[40px] p-10">
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">原手机号码</label>
                        <input className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-400 shadow-inner" value={phoneForm.oldPhoneNum} readOnly />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">支付密码 <span className="text-rose-500">*</span></label>
                        <input type="password" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="请输入支付密码" value={phoneForm.zhifuPassWord} onChange={e => setPhoneForm(p => ({ ...p, zhifuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">新手机号码 <span className="text-rose-500">*</span></label>
                        <input className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="请输入新手机号" value={phoneForm.newPhoneNum} onChange={e => setPhoneForm(p => ({ ...p, newPhoneNum: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">验证码 <span className="text-rose-500">*</span></label>
                        <div className="flex gap-3">
                            <input className="flex-1 rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="验证码" value={phoneForm.newYzmNum} onChange={e => setPhoneForm(p => ({ ...p, newYzmNum: e.target.value }))} />
                            <Button disabled={yzmDisabled} onClick={() => sendYzm(1)} className={cn('rounded-[16px] px-8 py-7 text-[10px] font-black uppercase tracking-widest transition active:scale-95 transition-all', yzmDisabled ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10')}>
                                {yzmMsg}
                            </Button>
                        </div>
                    </div>
                    <div className="pt-6">
                        <Button disabled={submitting} onClick={phoneBtnActive} className="w-full rounded-[20px] bg-slate-900 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 disabled:bg-slate-200">CONFIRM CHANGES</Button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改登陆密码" open={showPasswordModal} onClose={() => setShowPasswordModal(false)} className="rounded-[40px] p-10">
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">原登陆密码 <span className="text-rose-500">*</span></label>
                        <input type="password" placeholder="请输入原密码" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" value={passwordForm.oldPassWord} onChange={e => setPasswordForm(p => ({ ...p, oldPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">新登陆密码 <span className="text-rose-500">*</span></label>
                        <input type="password" placeholder="请输入新密码" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" value={passwordForm.newPassWord} onChange={e => setPasswordForm(p => ({ ...p, newPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">确认新密码 <span className="text-rose-500">*</span></label>
                        <input type="password" placeholder="请确认新密码" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" value={passwordForm.queRenPassWord} onChange={e => setPasswordForm(p => ({ ...p, queRenPassWord: e.target.value }))} />
                    </div>
                    <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed text-center">Currently validated by password. For SMS validation, contact support.</p>
                    </div>
                    <div className="pt-4">
                        <Button disabled={submitting} onClick={editBtnActive} className="w-full rounded-[20px] bg-slate-900 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 disabled:bg-slate-200">UPDATE PASSWORD</Button>
                    </div>
                </div>
            </Modal>

            <Modal title="修改支付密码" open={showPayPwdModal} onClose={() => setShowPayPwdModal(false)} className="rounded-[40px] p-10">
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">新支付密码 <span className="text-rose-500">*</span></label>
                        <input type="password" placeholder="6位数字密码" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" value={payPwdForm.newZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, newZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">确认支付密码 <span className="text-rose-500">*</span></label>
                        <input type="password" placeholder="请确认新密码" className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" value={payPwdForm.queRenZhiFuPassWord} onChange={e => setPayPwdForm(p => ({ ...p, queRenZhiFuPassWord: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">手机号码</label>
                        <input className="w-full rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-400 shadow-inner" value={payPwdForm.phoneNum} readOnly />
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">验证码 <span className="text-rose-500">*</span></label>
                        <div className="flex gap-3">
                            <input className="flex-1 rounded-[16px] border-none bg-slate-50 px-6 py-4 text-sm font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="验证码" value={payPwdForm.yzmNum} onChange={e => setPayPwdForm(p => ({ ...p, yzmNum: e.target.value }))} />
                            <Button disabled={yzmDisabled3} onClick={() => sendYzm(3)} className={cn('rounded-[16px] px-8 py-7 text-[10px] font-black uppercase tracking-widest transition active:scale-95 transition-all', yzmDisabled3 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10')}>
                                {yzmMsg3}
                            </Button>
                        </div>
                    </div>
                    <div className="pt-6">
                        <Button disabled={submitting} onClick={zhiFuBtnActive} className="w-full rounded-[20px] bg-slate-900 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-95 disabled:bg-slate-200">UPDATE PAY PASSWORD</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
