'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';

interface MerchantInfo { id: string; username: string; phone: string; qq?: string; companyName?: string; businessLicense?: string; contactName?: string; balance: number; silver: number; vip: boolean; vipExpireAt?: string; status: number; createdAt: string; }

export default function MerchantSettingPage() {
    const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ phone: '', qq: '', companyName: '', contactName: '' });
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => { fetchMerchantInfo(); }, []);

    const fetchMerchantInfo = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setMerchant(data.data); setFormData({ phone: data.data.phone || '', qq: data.data.qq || '', companyName: data.data.companyName || '', contactName: data.data.contactName || '' }); }
        } catch (error) { console.error('获取商家信息失败:', error); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (data.success) { setMessage({ type: 'success', text: '保存成功' }); setEditing(false); fetchMerchantInfo(); }
            else setMessage({ type: 'error', text: data.message || '保存失败' });
        } catch { setMessage({ type: 'error', text: '网络错误' }); }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) { setMessage({ type: 'error', text: '两次密码输入不一致' }); return; }
        if (passwordForm.newPassword.length < 6) { setMessage({ type: 'error', text: '密码长度至少6位' }); return; }
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }) });
            const data = await res.json();
            if (data.success) { setMessage({ type: 'success', text: '密码修改成功' }); setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }
            else setMessage({ type: 'error', text: data.message || '修改失败' });
        } catch { setMessage({ type: 'error', text: '网络错误' }); }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) return <div className="flex h-[400px] items-center justify-center text-[#6b7280]">加载中...</div>;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold">账户设置</h1>

            {message.text && (
                <div className={cn('rounded-md px-4 py-3', message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>{message.text}</div>
            )}

            {/* Basic Info */}
            <Card className="bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">基本信息</h2>
                    {!editing ? (
                        <Button size="sm" onClick={() => setEditing(true)}>编辑</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>取消</Button>
                            <Button size="sm" onClick={handleSave}>保存</Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">用户名</label>
                        <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#374151]">{merchant?.username}</div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">手机号</label>
                        {editing ? <Input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            : <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#374151]">{merchant?.phone || '-'}</div>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">QQ</label>
                        {editing ? <Input type="text" value={formData.qq} onChange={e => setFormData({ ...formData, qq: e.target.value })} />
                            : <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#374151]">{merchant?.qq || '-'}</div>}
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">联系人</label>
                        {editing ? <Input type="text" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                            : <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#374151]">{merchant?.contactName || '-'}</div>}
                    </div>
                    <div className="col-span-2">
                        <label className="mb-1 block text-sm text-[#6b7280]">公司名称</label>
                        {editing ? <Input type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                            : <div className="rounded-md bg-[#f3f4f6] px-3 py-2.5 text-[#374151]">{merchant?.companyName || '-'}</div>}
                    </div>
                </div>
            </Card>

            {/* Account Status */}
            <Card className="bg-white p-6">
                <h2 className="mb-5 text-lg font-semibold">账户状态</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-md bg-green-50 p-4 text-center">
                        <div className="text-2xl font-bold text-success-400">¥{parseFloat(String(merchant?.balance || 0)).toFixed(2)}</div>
                        <div className="mt-1 text-sm text-[#6b7280]">账户余额</div>
                    </div>
                    <div className="rounded-md bg-amber-50 p-4 text-center">
                        <div className="text-2xl font-bold text-warning-500">{parseFloat(String(merchant?.silver || 0)).toFixed(0)}</div>
                        <div className="mt-1 text-sm text-[#6b7280]">银锭</div>
                    </div>
                    <div className={cn('rounded-md p-4 text-center', merchant?.vip ? 'bg-purple-50' : 'bg-[#f3f4f6]')}>
                        <div className={cn('text-2xl font-bold', merchant?.vip ? 'text-purple-600' : 'text-[#9ca3af]')}>{merchant?.vip ? 'VIP' : '普通'}</div>
                        <div className="mt-1 text-sm text-[#6b7280]">会员状态</div>
                    </div>
                </div>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white p-6">
                <h2 className="mb-5 text-lg font-semibold">安全设置</h2>
                <div className="flex items-center justify-between border-b border-[#f3f4f6] py-3">
                    <div>
                        <div className="font-medium">登录密码</div>
                        <div className="text-sm text-[#6b7280]">定期更换密码可以保护账户安全</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>修改密码</Button>
                </div>
            </Card>

            {/* Password Modal */}
            <Modal title="修改密码" open={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">当前密码</label>
                        <Input type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">新密码</label>
                        <Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-[#6b7280]">确认新密码</label>
                        <Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}>取消</Button>
                    <Button onClick={handleChangePassword}>确认修改</Button>
                </div>
            </Modal>
        </div>
    );
}
