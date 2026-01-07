'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Modal } from '../../../components/ui/modal';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated, logout } from '../../../services/authService';
import {
    fetchUserProfile,
    sendProfileSmsCode,
    changePassword,
    changePayPassword,
    changePhone,
    UserProfile
} from '../../../services/userService';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ type: 'login' | 'pay' | 'phone' | null }>({ type: null });
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);

    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        payPassword: '',
        newPhone: '',
        smsCode: ''
    });

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadProfile();
    }, [router]);

    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const loadProfile = async () => {
        try {
            const data = await fetchUserProfile();
            setProfile(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleSendSms = async () => {
        if (smsCountdown > 0) return;
        const phone = modal.type === 'phone' ? form.newPhone : profile?.phone;
        if (!phone || phone.length !== 11) { toastError('手机号格式不正确'); return; }
        try {
            await sendProfileSmsCode(phone);
            toastSuccess('验证码已发送');
            setSmsCountdown(60);
        } catch (e: any) { toastError(e?.message || '发送失败'); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (modal.type === 'login') {
                await changePassword(form.oldPassword, form.newPassword);
                toastSuccess('登录密码修改成功');
            } else if (modal.type === 'pay') {
                await changePayPassword(form.payPassword, form.smsCode);
                toastSuccess('支付密码设置成功');
            } else if (modal.type === 'phone') {
                await changePhone(form.newPhone, form.smsCode);
                toastSuccess('手机号修改成功');
            }
            setModal({ type: null });
            setForm({ oldPassword: '', newPassword: '', payPassword: '', newPhone: '', smsCode: '' });
            loadProfile();
        } catch (e: any) {
            toastError(e?.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const SettingItem = ({ label, value, onClick, danger }: { label: string; value?: string; onClick: () => void; danger?: boolean }) => (
        <button onClick={onClick} className="flex w-full items-center justify-between py-5 group transition-all active:scale-[0.98]">
            <span className={cn('text-sm font-bold', danger ? 'text-rose-500' : 'text-slate-900')}>{label}</span>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs font-bold text-slate-400 italic">{value}</span>}
                <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" /></svg>
            </div>
        </button>
    );

    const FormInput = ({ label, type = 'text', value, onChange, placeholder, maxLength }: any) => (
        <div className="space-y-2 text-left">
            <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
                className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none border-none" />
        </div>
    );

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">个人设置</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-4">
                {/* Account Summary */}
                <div className="flex flex-col items-center py-6">
                    <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center text-4xl shadow-inner border-[6px] border-white shadow-slate-100">👤</div>
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{profile?.username}</h2>
                        <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{profile?.phone}</p>
                    </div>
                </div>

                {/* Settings Groups */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">账号安全</h3>
                        <Card className="rounded-[32px] border-none bg-white px-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] divide-y divide-slate-50">
                            <SettingItem label="登录密码" value="修改" onClick={() => setModal({ type: 'login' })} />
                            <SettingItem label="支付密码" value={profile?.hasPayPassword ? '已设置' : '未设置'} onClick={() => setModal({ type: 'pay' })} />
                            <SettingItem label="密保手机" value={profile?.phone} onClick={() => setModal({ type: 'phone' })} />
                        </Card>
                    </div>

                    <div className="space-y-2">
                        <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">会员信息</h3>
                        <Card className="rounded-[32px] border-none bg-white px-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] divide-y divide-slate-50">
                            <SettingItem label="VIP 会员" value={profile?.vip ? '已激活' : '未激活'} onClick={() => router.push('/profile/vip')} />
                            <div className="flex w-full items-center justify-between py-5">
                                <span className="text-sm font-bold text-slate-900">累计任务</span>
                                <span className="text-xs font-black text-blue-600">{profile?.experience || 0}</span>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-4 pt-4 px-2">
                        <button onClick={() => { logout(); router.push('/login'); }}
                            className="w-full rounded-[24px] bg-white py-5 text-sm font-black text-rose-500 shadow-xl shadow-slate-100 transition-all active:scale-95">退出当前账号</button>
                        <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Version 2.0.0 (Premium Flat)</p>
                    </div>
                </div>
            </div>

            {/* Redesigned Modals */}
            <Modal open={!!modal.type} onClose={() => setModal({ type: null })} title={modal.type === 'login' ? '修改登录密码' : modal.type === 'pay' ? '设置支付密码' : '修改手机号'}>
                <div className="p-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {modal.type === 'login' && (
                            <>
                                <FormInput label="原密码" type="password" value={form.oldPassword} onChange={(e: any) => setForm({ ...form, oldPassword: e.target.value })} placeholder="请输入当前登录密码" />
                                <FormInput label="新密码" type="password" value={form.newPassword} onChange={(e: any) => setForm({ ...form, newPassword: e.target.value })} placeholder="请输入 6-20 位新密码" />
                            </>
                        )}
                        {modal.type === 'pay' && (
                            <>
                                <FormInput label="支付密码" type="password" value={form.payPassword} onChange={(e: any) => setForm({ ...form, payPassword: e.target.value })} placeholder="设置 6 位纯数字支付密码" maxLength={6} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">验证码</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none"
                                            placeholder="短息验证码" value={form.smsCode} onChange={(e: any) => setForm({ ...form, smsCode: e.target.value })} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={cn('shrink-0 rounded-[20px] px-6 text-[10px] font-black text-white transition-all active:scale-90 shadow-lg', smsCountdown > 0 ? 'bg-slate-200' : 'bg-blue-600 shadow-blue-50')}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '获取'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        {modal.type === 'phone' && (
                            <>
                                <FormInput label="新手机号" value={form.newPhone} onChange={(e: any) => setForm({ ...form, newPhone: e.target.value })} placeholder="请输入 11 位新手机号" maxLength={11} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">验证码</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none"
                                            placeholder="短息验证码" value={form.smsCode} onChange={(e: any) => setForm({ ...form, smsCode: e.target.value })} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={cn('shrink-0 rounded-[20px] px-6 text-[10px] font-black text-white transition-all active:scale-90 shadow-lg', smsCountdown > 0 ? 'bg-slate-200' : 'bg-blue-600 shadow-blue-50')}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '获取'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                        <button type="submit" disabled={submitting}
                            className="mt-4 w-full rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                            {submitting ? <Spinner size="sm" /> : '确认提交修改'}
                        </button>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
