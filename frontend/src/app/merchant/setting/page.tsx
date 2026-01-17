'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import Image from 'next/image';

interface MerchantProfile {
    id: string;
    merchantNo?: string;
    phone: string;
    email: string;
    avatar?: string;
    wechat?: string;
}

export default function MerchantSettingPage() {
    const [profile, setProfile] = useState<MerchantProfile>({ id: '', phone: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<MerchantProfile>({ id: '', phone: '', email: '' });

    // Password Modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);

    // Phone Modal
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phoneForm, setPhoneForm] = useState({ newPhone: '', verifyCode: '' });
    const [changingPhone, setChangingPhone] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Avatar Upload
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) {
                setProfile(json.data);
                setFormData(json.data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAvatarUpload = async (file: File) => {
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const json = await res.json();
            if (json.success && json.url) {
                const newAvatar = json.url;
                setFormData(prev => ({ ...prev, avatar: newAvatar }));
                // Auto save the avatar update immediately
                const token = localStorage.getItem('merchantToken');
                // 只发送需要更新的字段，避免发送password等敏感字段
                const { id, phone, email, wechat, merchantNo } = profile;
                const updateRes = await fetch(`${BASE_URL}/merchant/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ id, phone, email, wechat, merchantNo, avatar: newAvatar })
                });
                const updateJson = await updateRes.json();
                if (updateJson.success) {
                    setProfile(prev => ({ ...prev, avatar: newAvatar }));
                    alert('头像更新成功');
                } else {
                    alert(updateJson.message || '保存失败');
                }
            } else {
                alert(json.message || '上传失败');
            }
        } catch { alert('网络错误'); }
        finally { setUploadingAvatar(false); }
    };

    const updateProfile = async (data: MerchantProfile) => {
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.success) {
                setProfile(data);
                if (!editing) alert('头像更新成功');
            } else {
                alert(json.message || '更新失败');
            }
        } catch { alert('网络错误'); }
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('merchantToken');
        try {
            // 只发送允许更新的字段，确保不发送password
            const { id, phone, email, avatar, wechat, merchantNo } = formData;
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id, phone, email, avatar, wechat, merchantNo })
            });
            const json = await res.json();
            if (json.success) {
                setProfile(formData);
                setEditing(false);
                alert('保存成功');
            } else {
                alert(json.message || '保存失败');
            }
        } catch { alert('网络错误'); }
        finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert('请填写完整');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('两次新密码输入不一致');
            return;
        }

        setChangingPassword(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/auth/merchant/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('密码修改成功，请重新登录');
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                localStorage.removeItem('merchantToken');
                window.location.href = '/merchant/login';
            } else {
                alert(json.message || '修改失败');
            }
        } catch { alert('网络错误'); }
        finally { setChangingPassword(false); }
    };

    const handleSendCode = async () => {
        if (!phoneForm.newPhone) {
            alert('请输入新手机号');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
            alert('请输入正确的手机号');
            return;
        }

        setSendingCode(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ phone: phoneForm.newPhone })
            });
            const json = await res.json();
            if (json.success) {
                alert('验证码已发送');
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                alert(json.message || '发送失败');
            }
        } catch { alert('网络错误'); }
        finally { setSendingCode(false); }
    };

    const handleChangePhone = async () => {
        if (!phoneForm.newPhone || !phoneForm.verifyCode) {
            alert('请填写完整');
            return;
        }

        setChangingPhone(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant/change-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    newPhone: phoneForm.newPhone,
                    verifyCode: phoneForm.verifyCode
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('手机号修改成功');
                setShowPhoneModal(false);
                setPhoneForm({ newPhone: '', verifyCode: '' });
                loadProfile();
            } else {
                alert(json.message || '修改失败');
            }
        } catch { alert('网络错误'); }
        finally { setChangingPhone(false); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-400">加载中...</div>;

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <h1 className="text-3xl font-black text-slate-900">账户设置</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column: Basic Info */}
                <Card className="col-span-2 rounded-[32px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">基本信息</h2>
                            <p className="mt-1 text-sm font-medium text-slate-400">管理您的账户基本资料</p>
                        </div>
                        {!editing ? (
                            <Button
                                onClick={() => setEditing(true)}
                                className="h-10 rounded-[14px] bg-indigo-50 px-5 font-bold text-indigo-600 shadow-none hover:bg-indigo-100"
                            >
                                编辑资料
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setEditing(false); setFormData(profile); }}
                                    className="h-10 rounded-[14px] border-none bg-slate-100 px-5 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                                >
                                    取消
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-10 rounded-[14px] bg-indigo-600 px-5 font-bold text-white shadow-none hover:bg-indigo-700"
                                >
                                    {saving ? '保存中...' : '保存更改'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="h-24 w-24 overflow-hidden rounded-[24px] bg-slate-100 border-4 border-slate-50 shadow-sm">
                                    {formData.avatar ? (
                                        <Image src={formData.avatar} alt="Avatar" width={96} height={96} className="h-full w-full object-cover" unoptimized />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-4xl">👨‍💼</div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                    <span className="text-xs">📷</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} disabled={uploadingAvatar} />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{profile.merchantNo || '商家'}</h3>
                                <p className="text-sm font-medium text-slate-400">商户ID: {profile.merchantNo || '暂无编号'}</p>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">商户ID</label>
                                <Input disabled value={formData.merchantNo || '暂无编号'} className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-500" />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">手机号</label>
                                <Input disabled value={formData.phone} className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-500" />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">微信</label>
                                <Input
                                    disabled={!editing}
                                    value={formData.wechat || ''}
                                    onChange={e => setFormData({ ...formData, wechat: e.target.value })}
                                    placeholder={editing ? '请输入微信号' : '未设置'}
                                    className={cn(
                                        "h-12 w-full rounded-[16px] border-none font-bold text-slate-900 transition-all",
                                        editing ? "bg-slate-50 px-4 focus:ring-2 focus:ring-indigo-500/20" : "bg-slate-50 px-4 text-slate-500"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Column: Security */}
                <div className="space-y-6">
                    <Card className="rounded-[32px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <h2 className="mb-6 text-xl font-bold text-slate-900">账号安全</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-[20px] bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">🔒</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">登录密码</div>
                                        <div className="text-xs font-medium text-slate-400">定期修改密码保护账号安全</div>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowPasswordModal(true)}
                                    className="h-8 rounded-[10px] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    修改
                                </Button>
                            </div>

                            <div className="flex items-center justify-between rounded-[20px] bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">📱</div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">手机绑定</div>
                                        <div className="text-xs font-medium text-slate-400">已绑定: {profile.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowPhoneModal(true)}
                                    className="h-8 rounded-[10px] bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    修改
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[32px] border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 p-8 text-white shadow-lg shadow-indigo-500/20">
                        <div className="mb-4 text-3xl">🛡️</div>
                        <h3 className="mb-2 text-lg font-bold">安全贴士</h3>
                        <p className="text-sm font-medium text-indigo-100 opacity-80">
                            请不要将密码透露给他人。平台工作人员不会向您索要密码或验证码。建议每个月更改一次密码。
                        </p>
                    </Card>
                </div>
            </div>

            {/* Password Modal */}
            <Modal title="修改登录密码" open={showPasswordModal} onClose={() => setShowPasswordModal(false)} className="rounded-[32px]">
                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">原密码</label>
                        <Input
                            type="password"
                            value={passwordForm.oldPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                            placeholder="请输入当前密码"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">新密码</label>
                        <Input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder="6-20位，包含字母和数字"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">确认新密码</label>
                        <Input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="请再次输入新密码"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPasswordModal(false)}
                            className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                            className={cn(
                                "h-11 rounded-[16px] bg-indigo-600 px-6 font-bold text-white shadow-none hover:bg-indigo-700",
                                changingPassword && "cursor-not-allowed opacity-70"
                            )}
                        >
                            {changingPassword ? '修改中...' : '确认修改'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Phone Modal */}
            <Modal title="修改手机号" open={showPhoneModal} onClose={() => setShowPhoneModal(false)} className="rounded-[32px]">
                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">新手机号</label>
                        <Input
                            type="tel"
                            value={phoneForm.newPhone}
                            onChange={e => setPhoneForm({ ...phoneForm, newPhone: e.target.value })}
                            placeholder="请输入新手机号"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">验证码</label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={phoneForm.verifyCode}
                                onChange={e => setPhoneForm({ ...phoneForm, verifyCode: e.target.value })}
                                placeholder="请输入验证码"
                                className="h-12 flex-1 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            />
                            <Button
                                onClick={handleSendCode}
                                disabled={sendingCode || countdown > 0}
                                className={cn(
                                    "h-12 rounded-[16px] bg-indigo-600 px-6 font-bold text-white shadow-none hover:bg-indigo-700 whitespace-nowrap",
                                    (sendingCode || countdown > 0) && "cursor-not-allowed opacity-70"
                                )}
                            >
                                {countdown > 0 ? `${countdown}秒` : sendingCode ? '发送中...' : '获取验证码'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPhoneModal(false)}
                            className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleChangePhone}
                            disabled={changingPhone}
                            className={cn(
                                "h-11 rounded-[16px] bg-indigo-600 px-6 font-bold text-white shadow-none hover:bg-indigo-700",
                                changingPhone && "cursor-not-allowed opacity-70"
                            )}
                        >
                            {changingPhone ? '修改中...' : '确认修改'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
