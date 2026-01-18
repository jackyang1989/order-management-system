'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { isAuthenticated, getToken } from '../../../services/authService';
import {
    fetchUserProfile,
    sendProfileSmsCode,
    changePassword,
    changePayPassword,
    changePhone,
    updateUserProfile
} from '../../../services/userService';
import { BASE_URL } from '../../../../apiConfig';
import { CHINA_REGIONS, RegionData } from '../../../data/chinaRegions';

// 默认卡通头像 SVG
const DefaultAvatar = () => (
    <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs>
            <linearGradient id="avatarBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="60" fill="url(#avatarBg)" />
        <circle cx="60" cy="45" r="20" fill="#fff" opacity="0.9" />
        <ellipse cx="60" cy="95" rx="35" ry="25" fill="#fff" opacity="0.9" />
    </svg>
);

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userInfo, setUserInfo] = useState({ userNo: '用户', mobile: '', wechat: '', avatar: '', province: '', city: '', district: '' });

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPayPwdModal, setShowPayPwdModal] = useState(false);
    const [showWechatModal, setShowWechatModal] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [wechatForm, setWechatForm] = useState('');
    const [regionForm, setRegionForm] = useState({ province: '', city: '', district: '' });

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
            console.log('[Settings] Loaded user data:', data);
            if (data) {
                setUserInfo({
                    userNo: data.userNo,
                    mobile: data.phone,
                    wechat: data.wechat || '',
                    avatar: data.avatar || '',
                    province: data.province || '',
                    city: data.city || '',
                    district: data.district || ''
                });
                console.log('[Settings] Set userInfo:', {
                    userNo: data.userNo,
                    mobile: data.phone,
                    wechat: data.wechat || '',
                    avatar: data.avatar || '',
                    province: data.province || '',
                    city: data.city || '',
                    district: data.district || ''
                });
                setPhoneForm(p => ({ ...p, oldPhoneNum: data.phone }));
                setPasswordForm(p => ({ ...p, phoneNum: data.phone }));
                setPayPwdForm(p => ({ ...p, phoneNum: data.phone }));
                setWechatForm(data.wechat || '');
                setRegionForm({ province: data.province || '', city: data.city || '', district: data.district || '' });
            }
        } catch (e) {
            console.error('Load user info error:', e);
        } finally {
            setLoading(false);
        }
    };

    // 上传头像
    const handleAvatarUpload = async (file: File) => {
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = getToken();
            const res = await fetch(`${BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const json = await res.json();
            if (json.success && json.url) {
                // 更新用户头像
                const updateResult = await updateUserProfile({ avatar: json.url });
                if (updateResult.success) {
                    setUserInfo(prev => ({ ...prev, avatar: json.url }));
                    toastSuccess('头像更新成功');
                } else {
                    toastError(updateResult.message || '更新失败');
                }
            } else {
                toastError(json.message || '上传失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // 修改微信号
    const handleWechatSave = async () => {
        if (!wechatForm.trim()) {
            toastError('请输入微信号');
            return;
        }
        setSubmitting(true);
        try {
            const result = await updateUserProfile({ wechat: wechatForm.trim() });
            if (result.success) {
                setUserInfo(prev => ({ ...prev, wechat: wechatForm.trim() }));
                toastSuccess('微信号更新成功');
                setShowWechatModal(false);
            } else {
                toastError(result.message || '更新失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    // 修改所在地区
    const handleRegionSave = async () => {
        setSubmitting(true);
        try {
            const result = await updateUserProfile({
                province: regionForm.province,
                city: regionForm.city,
                district: regionForm.district
            });
            if (result.success) {
                setUserInfo(prev => ({
                    ...prev,
                    province: regionForm.province,
                    city: regionForm.city,
                    district: regionForm.district
                }));
                toastSuccess('所在地区更新成功');
                setShowRegionModal(false);
            } else {
                toastError(result.message || '更新失败');
            }
        } catch (e) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
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
        <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
    );

    const InfoRow = ({ label, value, action, onClick, showArrow }: { label: string; value: string; action?: () => void; onClick?: () => void; showArrow?: boolean }) => (
        <div
            className={`flex items-center px-4 py-3 ${onClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
            onClick={onClick}
        >
            <span className="flex-1 text-sm font-bold text-slate-500">{label}</span>
            <span className={cn(
                "text-sm font-bold",
                onClick ? 'text-primary-600' : 'text-slate-900'
            )}>
                {value}{showArrow && ' ›'}
            </span>
            {action && (
                <button
                    onClick={(e) => { e.stopPropagation(); action(); }}
                    className="ml-3 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-primary-600 transition-colors hover:bg-blue-50"
                >
                    修改
                </button>
            )}
        </div>
    );

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

            <div className="mx-auto max-w-[515px] space-y-5 px-4 py-6">
                {/* User Info Card */}
                <div className="rounded-[24px] bg-white py-6 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {/* 头像区域 - 可点击上传 */}
                    <div className="relative mx-auto mb-3 h-20 w-20">
                        <div className="h-full w-full overflow-hidden rounded-full bg-slate-100 border-4 border-slate-50 shadow-sm">
                            {userInfo.avatar ? (
                                <Image
                                    src={userInfo.avatar}
                                    alt="头像"
                                    width={80}
                                    height={80}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <DefaultAvatar />
                            )}
                        </div>
                        {/* 上传按钮 */}
                        <label className={cn(
                            "absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:scale-110 active:scale-95",
                            uploadingAvatar && "opacity-50 cursor-not-allowed"
                        )}>
                            {uploadingAvatar ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                disabled={uploadingAvatar}
                                onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                            />
                        </label>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{userInfo.userNo}</h2>
                </div>

                {/* Personal Section */}
                <div>
                    <SectionHeader title="个人信息" />
                    <Card noPadding className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border-none bg-white px-0 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <InfoRow label="用户ID" value={userInfo.userNo} />
                        <InfoRow label="手机号" value={maskedPhone} action={() => setShowPhoneModal(true)} />
                        <InfoRow
                            label="微信号"
                            value={userInfo.wechat || '未绑定'}
                            action={() => {
                                setWechatForm(userInfo.wechat || '');
                                setShowWechatModal(true);
                            }}
                        />
                        <InfoRow
                            label="所在地区"
                            value={[userInfo.province, userInfo.city, userInfo.district].filter(Boolean).join(' ') || '未设置'}
                            action={() => {
                                setRegionForm({
                                    province: userInfo.province,
                                    city: userInfo.city,
                                    district: userInfo.district
                                });
                                setShowRegionModal(true);
                            }}
                        />
                    </Card>
                </div>

                {/* Security Section */}
                <div>
                    <SectionHeader title="安全设置" />
                    <Card noPadding className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border-none bg-white px-0 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
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
                        <button disabled={submitting} onClick={phoneBtnActive} className="flex-1 rounded-[20px] bg-primary-600 py-4 text-sm font-bold text-white disabled:opacity-50">确定</button>
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
                        <button disabled={submitting} onClick={editBtnActive} className="flex-1 rounded-[20px] bg-primary-600 py-4 text-sm font-bold text-white disabled:opacity-50">确定</button>
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
                        <button disabled={submitting} onClick={zhiFuBtnActive} className="flex-1 rounded-[20px] bg-primary-600 py-4 text-sm font-bold text-white disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>

            {/* 修改微信号 Modal */}
            <Modal title="修改微信号" open={showWechatModal} onClose={() => setShowWechatModal(false)}>
                <div className="space-y-5 px-1 py-1">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">微信号</label>
                        <input
                            type="text"
                            placeholder="请输入微信号"
                            className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                            value={wechatForm}
                            onChange={e => setWechatForm(e.target.value)}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-medium text-slate-400">绑定微信号后，商家可通过微信联系您</p>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowWechatModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-500">取消</button>
                        <button disabled={submitting} onClick={handleWechatSave} className="flex-1 rounded-[20px] bg-primary-600 py-4 text-sm font-bold text-white disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>

            {/* 修改所在地区 Modal */}
            <Modal title="修改所在地区" open={showRegionModal} onClose={() => setShowRegionModal(false)}>
                <div className="space-y-5 px-1 py-1">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">省份</label>
                        <select
                            value={regionForm.province}
                            onChange={(e) => setRegionForm({ province: e.target.value, city: '', district: '' })}
                            className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                        >
                            <option value="">选择省份</option>
                            {CHINA_REGIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">城市</label>
                        <select
                            value={regionForm.city}
                            onChange={(e) => setRegionForm({ ...regionForm, city: e.target.value, district: '' })}
                            disabled={!regionForm.province}
                            className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">选择城市</option>
                            {(CHINA_REGIONS.find(p => p.value === regionForm.province)?.children || []).map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="ml-1 text-[11px] font-bold uppercase tracking-tight text-slate-400">区县</label>
                        <select
                            value={regionForm.district}
                            onChange={(e) => setRegionForm({ ...regionForm, district: e.target.value })}
                            disabled={!regionForm.city}
                            className="w-full rounded-2xl border-2 border-slate-50 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none disabled:opacity-50"
                        >
                            <option value="">选择区县</option>
                            {(CHINA_REGIONS.find(p => p.value === regionForm.province)?.children?.find(c => c.value === regionForm.city)?.children || []).map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowRegionModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-500">取消</button>
                        <button disabled={submitting} onClick={handleRegionSave} className="flex-1 rounded-[20px] bg-primary-600 py-4 text-sm font-bold text-white disabled:opacity-50">确定</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
