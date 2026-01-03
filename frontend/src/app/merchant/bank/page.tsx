'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface BankCard {
    id: string;
    bankName: string;
    cardNumber: string;
    cardHolder: string;
    isDefault: boolean;
    createdAt: string;
}

export default function MerchantBankPage() {
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        bankName: '',
        cardNumber: '',
        cardHolder: '',
        isDefault: false
    });

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setCards(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!form.bankName || !form.cardNumber || !form.cardHolder) {
            alert('请填写完整信息');
            return;
        }

        setSubmitting(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.success) {
                alert('添加成功');
                setShowAddModal(false);
                setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false });
                loadCards();
            } else {
                alert(json.message || '添加失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该银行卡吗？')) return;

        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                alert('删除成功');
                loadCards();
            } else {
                alert(json.message || '删除失败');
            }
        } catch (e) {
            alert('网络错误');
        }
    };

    const handleSetDefault = async (id: string) => {
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}/set-default`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadCards();
            } else {
                alert(json.message || '设置失败');
            }
        } catch (e) {
            alert('网络错误');
        }
    };

    const bankOptions = [
        '中国工商银行', '中国建设银行', '中国农业银行', '中国银行',
        '招商银行', '交通银行', '中国邮政储蓄银行', '中信银行',
        '光大银行', '浦发银行', '民生银行', '兴业银行', '平安银行'
    ];

    const maskCardNumber = (num: string) => {
        if (num.length <= 8) return num;
        return num.slice(0, 4) + ' **** **** ' + num.slice(-4);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>银行卡管理</h1>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>绑定银行卡用于提现</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '10px 20px',
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    + 添加银行卡
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>加载中...</div>
            ) : cards.length === 0 ? (
                <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '60px',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                    <div style={{ color: '#6b7280', marginBottom: '24px' }}>暂未绑定银行卡</div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            padding: '10px 24px',
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        立即绑定
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {cards.map(card => (
                        <div
                            key={card.id}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: '#fff',
                                position: 'relative',
                                minHeight: '160px'
                            }}
                        >
                            {card.isDefault && (
                                <span style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '4px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px'
                                }}>
                                    默认
                                </span>
                            )}
                            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                                {card.bankName}
                            </div>
                            <div style={{ fontSize: '22px', letterSpacing: '2px', marginBottom: '24px', fontFamily: 'monospace' }}>
                                {maskCardNumber(card.cardNumber)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                    {card.cardHolder}
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {!card.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(card.id)}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                color: '#fff',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            设为默认
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '450px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>添加银行卡</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                                    开户银行 <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    value={form.bankName}
                                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="">请选择银行</option>
                                    {bankOptions.map(bank => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                                    银行卡号 <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.cardNumber}
                                    onChange={e => setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, '') })}
                                    placeholder="请输入银行卡号"
                                    maxLength={19}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                                    持卡人姓名 <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.cardHolder}
                                    onChange={e => setForm({ ...form, cardHolder: e.target.value })}
                                    placeholder="请输入持卡人姓名"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.isDefault}
                                        onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                                    />
                                    <span style={{ fontSize: '14px', color: '#374151' }}>设为默认提现银行卡</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false });
                                }}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={submitting}
                                style={{
                                    padding: '10px 24px',
                                    background: submitting ? '#9ca3af' : '#4f46e5',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? '添加中...' : '确定添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
