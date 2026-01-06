'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { Modal } from '../../../components/ui/modal';
import { Button } from '../../../components/ui/button';
import { isAuthenticated, getToken } from '../../../services/authService';
import { fetchUserProfile } from '../../../services/userService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

export default function ProfileSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState({
        username: '',
        mobile: '',
        qq: '',
        realName: '',
        vip: false,
        vipExpireTime: ''
    });

    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPayPwdModal, setShowPayPwdModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [phoneForm, setPhoneForm] = useState({ oldPhoneNum: '', zhifuPassWord: '', newPhoneNum: '', newYzmNum: '' });
    const [passwordForm, setPasswordForm] = useState({ oldPassWord: '', newPassWord: '', queRenPassWord: '', phoneNum: '', newYzmNum: '' });
    const [payPwdForm, setPayPwdForm] = useState({ newZhiFuPassWord: '', queRenZhiFuPassWord: '', phoneNum: '', yzmNum: '' });

    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmDisabled2, setYzmDisabled2] = useState(false);
    const [yzmDisabled3, setYzmDisabled3] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const [yzmMsg2, setYzmMsg2] = useState('发送验证码');
    const [yzmMsg3, setYzmMsg3] = useState('发送验证码');

    const timerRef1 = useRef<NodeJS.Timeout | null>(null);
    const timerRef2 = useRef<NodeJS.Timeout | null>(null);
    const timerRef3 = useRef<NodeJS.Timeout | null>(null);

    const phoneReg = /^1[3-9]\d{9}$/;
    const zhifuReg = /^\d{6}$/;

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
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
            if (!data) { console.error('Failed to fetch user profile'); return; }
            setUserInfo({
                username: data.username || '',
                mobile: data.phone || '',
                qq: data.qq || '',
                realName: data.realName || '',
                vip: data.vip || false,
                vipExpireTime: data.vipExpireAt ? new Date(data.vipExpireAt).toLocaleDateString() : ''
            });
            setPayPwdForm(prev => ({ ...prev, phoneNum: data.phone || '' }));
            setPasswordForm(prev => ({ ...prev, phoneNum: data.phone || '' }));
            setPhoneForm(prev => ({ ...prev, oldPhoneNum: data.phone || '' }));
        } catch (error) { console.error('Failed to load user info:', error); }
        finally { setLoading(false); }
    };

    const sendYzm = async (type: 1 | 2 | 3) => {
        const phone = type === 1 ? phoneForm.newPhoneNum : type === 2 ? passwordForm.phoneNum : payPwdForm.phoneNum;
        if (!phone) { toastError('手机号码不能为空'); return; }
        if (!phoneReg.test(phone)) { toastError('手机号码格式不规范'); return; }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: phone }),
            });
        } catch (error) { }

        let num = 60;
        const setDisabled = type === 1 ? setYzmDisabled : type === 2 ? setYzmDisabled2 : setYzmDisabled3;
        const setMsg = type === 1 ? setYzmMsg : type === 2 ? setYzmMsg2 : setYzmMsg3;
        const timerRef = type === 1 ? timerRef1 : type === 2 ? timerRef2 : timerRef3;

        setDisabled(true);
        setMsg(`${num}秒`);

        timerRef.current = setInterval(() => {
            num--;
            setMsg(`${num}秒`);
            if (num <= 0) {
                clearInterval(timerRef.current!);
                setMsg('重新发送');
                setDisabled(false);
            } else if (num === 59) {
                toastSuccess('验证码发送成功');
            }
        }, 1000);
    };

    const phoneBtnActive = async () => {
        if (!phoneForm.oldPhoneNum) { toastError('原手机号码不能为空'); return; }
        if (!phoneForm.zhifuPassWord) { toastError('支付密码不能为空'); return; }
        if (!phoneForm.newPhoneNum) { toastError('新手机号码不能为空'); return; }
        if (!phoneForm.newYzmNum) { toastError('验证码不能为空'); return; }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/editphone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({
                    oldphone: phoneForm.oldPhoneNum, pay_pwd: phoneForm.zhifuPassWord,
                    mobile: phoneForm.newPhoneNum, dxyzm: phoneForm.newYzmNum,
                }),
            });
            const data = await response.json();
            if (data.code === 1) {
                toastSuccess(data.msg);
                setTimeout(() => { data.url ? router.push(data.url) : (setShowPhoneModal(false), loadUserInfo()); }, 2000);
            } else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const editBtnActive = async () => {
        if (!passwordForm.oldPassWord) { toastError('原登录密码不能为空'); return; }
        if (!passwordForm.newPassWord) { toastError('新登录密码不能为空'); return; }
        if (!passwordForm.queRenPassWord) { toastError('确认登录密码不能为空'); return; }
        if (!passwordForm.phoneNum) { toastError('手机号码不能为空'); return; }
        if (!passwordForm.newYzmNum) { toastError('验证码不能为空'); return; }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_login_pwd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({
                    oldloginpwd: passwordForm.oldPassWord, login_pwd: passwordForm.newPassWord,
                    login_pwd2: passwordForm.queRenPassWord, mobile: passwordForm.phoneNum, dxyzm: passwordForm.newYzmNum,
                }),
            });
            const data = await response.json();
            if (data.code === 1) {
                toastSuccess(data.msg);
                setTimeout(() => { data.url ? router.push(data.url) : setShowPasswordModal(false); }, 2000);
            } else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const zhiFuBtnActive = async () => {
        if (!payPwdForm.newZhiFuPassWord) { toastError('新支付密码不能为空'); return; }
        if (!payPwdForm.queRenZhiFuPassWord) { toastError('确认新密码不能为空'); return; }
        if (!payPwdForm.phoneNum) { toastError('手机号码不能为空'); return; }
        if (!payPwdForm.yzmNum) { toastError('验证码不能为空'); return; }
        if (!zhifuReg.test(payPwdForm.newZhiFuPassWord)) { toastError('支付密码格式不规范'); return; }

        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/mobile/my/edit_pay_pwd`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({
                    pay_pwd: payPwdForm.newZhiFuPassWord, pay_pwd2: payPwdForm.queRenZhiFuPassWord,
                    mobile: payPwdForm.phoneNum, dxyzm: payPwdForm.yzmNum,
                }),
            });
            const data = await response.json();
            if (data.code === 1) {
                toastSuccess(data.msg);
                setTimeout(() => { data.url ? router.push(data.url) : setShowPayPwdModal(false); }, 2000);
            } else { toastError(data.msg); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    const maskedPhone = userInfo.mobile ? userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';

    const InfoRow = ({ label, value, action }: { label: string; value: string; action?: () => void }) => (
        <div className="flex items-center border-b border-slate-100 px-4 py-3.5">
            <span className="w-20 text-sm text-slate-500">{label}</span>
            <span className="flex-1 text-right text-sm text-slate-800">{value}</span>
            {action && (
                <button onClick={action} className="ml-3 rounded border border-blue-500 px-3 py-1 text-xs text-blue-500">
                    修改
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">基本信息</h1>
            </header>

            <ProfileContainer className="py-4">
                {/* Avatar Section */}
                <div className="mb-4 flex flex-col items-center rounded-xl border border-slate-200 bg-white py-6 shadow-sm">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                        👤
                    </div>
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
                    <InfoRow label="到期时间" value={userInfo.vipExpireTime || '-'} />
                </div>

                {/* Security Settings */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">安全设置</div>
                    <InfoRow label="登陆密码" value="**********" action={() => setShowPasswordModal(true)} />
                    <div className="flex items-center px-4 py-3.5">
                        <span className="w-20 text-sm text-slate-500">支付密码</span>
                        <span className="flex-1 text-right text-sm text-slate-800">**********</span>
                        <button onClick={() => setShowPayPwdModal(true)} className="ml-3 rounded border border-blue-500 px-3 py-1 text-xs text-blue-500">
                            修改
                        </button>
                    </div>
                </div>
            </ProfileContainer>

            {/* Phone Modal */}
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

            {/* Password Modal */}
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
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="手机号" value={passwordForm.phoneNum} onChange={e => setPasswordForm(p => ({ ...p, phoneNum: e.target.value }))} />
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

            {/* Payment Password Modal */}
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
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="手机号" value={payPwdForm.phoneNum} onChange={e => setPayPwdForm(p => ({ ...p, phoneNum: e.target.value }))} />
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
