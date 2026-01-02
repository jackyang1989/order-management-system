'use client';

import { useState, useEffect } from 'react';

import { BASE_URL } from '../../../../apiConfig';

interface MerchantInfo {
    id: string;
    username: string;
    phone: string;
    qq?: string;
    companyName?: string;
    businessLicense?: string;
    contactName?: string;
    balance: number;
    silver: number;
    vip: boolean;
    vipExpireAt?: string;
    status: number;
    createdAt: string;
}

export default function MerchantSettingPage() {
    const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        qq: '',
        companyName: '',
        contactName: '',
    });
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchMerchantInfo();
    }, []);

    const fetchMerchantInfo = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setMerchant(data.data);
                setFormData({
                    phone: data.data.phone || '',
                    qq: data.data.qq || '',
                    companyName: data.data.companyName || '',
                    contactName: data.data.contactName || '',
                });
            }
        } catch (error) {
            console.error('获取商家信息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: '保存成功' });
                setEditing(false);
                fetchMerchantInfo();
            } else {
                setMessage({ type: 'error', text: data.message || '保存失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '网络错误' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: '两次密码输入不一致' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: '密码长度至少6位' });
            return;
        }

        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/merchant/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    oldPassword: passwordForm.oldPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: '密码修改成功' });
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.message || '修改失败' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '网络错误' });
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) {
        return (

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                加载中...
            </div>
        );

    }

    return (

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>账户设置</h1>

            {message.text && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    borderRadius: '8px',
                    background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                }}>
                    {message.text}
                </div>
            )}

            {/* 基本信息 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600' }}>基本信息</h2>
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            编辑
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setEditing(false)}
                                style={{
                                    padding: '8px 16px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '8px 16px',
                                    background: '#4f46e5',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                保存
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            用户名
                        </label>
                        <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151' }}>
                            {merchant?.username}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            手机号
                        </label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        ) : (
                            <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151' }}>
                                {merchant?.phone || '-'}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            QQ
                        </label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.qq}
                                onChange={(e) => setFormData({ ...formData, qq: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        ) : (
                            <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151' }}>
                                {merchant?.qq || '-'}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            联系人
                        </label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        ) : (
                            <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151' }}>
                                {merchant?.contactName || '-'}
                            </div>
                        )}
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            公司名称
                        </label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        ) : (
                            <div style={{ padding: '10px', background: '#f3f4f6', borderRadius: '6px', color: '#374151' }}>
                                {merchant?.companyName || '-'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 账户状态 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>账户状态</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                            ¥{parseFloat(String(merchant?.balance || 0)).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>账户余额</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                            {parseFloat(String(merchant?.silver || 0)).toFixed(0)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>银锭</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '16px', background: merchant?.vip ? '#ede9fe' : '#f3f4f6', borderRadius: '8px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: merchant?.vip ? '#7c3aed' : '#9ca3af' }}>
                            {merchant?.vip ? 'VIP' : '普通'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>会员状态</div>
                    </div>
                </div>
            </div>

            {/* 安全设置 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>安全设置</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                        <div style={{ fontWeight: '500' }}>登录密码</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>定期更换密码可以保护账户安全</div>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        style={{
                            padding: '8px 16px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }}
                    >
                        修改密码
                    </button>
                </div>
            </div>

            {/* 修改密码弹窗 */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '400px',
                        maxWidth: '90%',
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>修改密码</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                当前密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                新密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                                确认新密码
                            </label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleChangePassword}
                                style={{
                                    padding: '10px 20px',
                                    background: '#4f46e5',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                确认修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}
