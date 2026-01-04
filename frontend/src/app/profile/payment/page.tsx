'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';
import { fetchBankCards, addBankCard, deleteBankCard, setDefaultBankCard, BankCard } from '../../../services/userService';

// 银行列表
const bankList = ['工商银行', '建设银行', '农业银行', '中国银行', '招商银行', '交通银行', '邮储银行', '兴业银行', '民生银行', '浦发银行'];

export default function PaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        accountName: '',
        bankName: '',
        cardNumber: '',
        branchName: '',
        province: '',
        city: '',
        phone: '',
        wechatQrCode: '',
        alipayQrCode: ''
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const cards = await fetchBankCards();
            setBankCards(cards);
        } catch (error) {
            console.error('Load bank cards error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'wechatQrCode' | 'alipayQrCode') => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setForm(prev => ({ ...prev, [field]: base64 }));
            } catch (error) {
                console.error('File read error:', error);
                alert('图片读取失败');
            }
        }
    };

    const handleSubmit = async () => {
        // 表单验证
        if (!form.accountName) { alert('请输入开户名'); return; }
        if (!form.bankName) { alert('请选择银行'); return; }
        if (!form.cardNumber) { alert('请输入银行卡号'); return; }
        if (!/^(\d{16}|\d{17}|\d{18}|\d{19})$/.test(form.cardNumber)) { alert('银行卡号格式不正确'); return; }
        if (!form.phone) { alert('请输入银行预留手机号码'); return; }
        if (!/^1[3-9]\d{9}$/.test(form.phone)) { alert('手机号码格式不正确'); return; }
        if (!form.wechatQrCode) { alert('请上传微信收款码'); return; }
        if (!form.alipayQrCode) { alert('请上传支付宝收款码'); return; }

        setSubmitting(true);
        try {
            const result = await addBankCard({
                bankName: form.bankName,
                accountName: form.accountName,
                cardNumber: form.cardNumber,
                phone: form.phone,
                province: form.province,
                city: form.city,
                branchName: form.branchName,
                wechatQrCode: form.wechatQrCode,
                alipayQrCode: form.alipayQrCode
            });

            if (result.success) {
                alert(result.message || '绑定成功');
                setShowForm(false);
                // 重置表单
                setForm({
                    accountName: '',
                    bankName: '',
                    cardNumber: '',
                    branchName: '',
                    province: '',
                    city: '',
                    phone: '',
                    wechatQrCode: '',
                    alipayQrCode: ''
                });
                // 刷新列表
                await loadData();
            } else {
                alert(result.message || '绑定失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要解绑此银行卡吗？')) return;

        const result = await deleteBankCard(id);
        if (result.success) {
            alert(result.message || '解绑成功');
            await loadData();
        } else {
            alert(result.message || '解绑失败');
        }
    };

    const handleSetDefault = async (id: string) => {
        const result = await setDefaultBankCard(id);
        if (result.success) {
            await loadData();
        } else {
            alert(result.message || '设置失败');
        }
    };

    const getStatusText = (status: number | string) => {
        if (status === 0 || status === 'PENDING') return { text: '待审核', color: '#e6a23c' };
        if (status === 1 || status === 'APPROVED') return { text: '已通过', color: '#67c23a' };
        if (status === 2 || status === 'REJECTED') return { text: '未通过', color: '#f56c6c' };
        return { text: '未知', color: '#999' };
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    const cellStyle = {
        display: 'flex',
        padding: '12px 15px',
        borderBottom: '1px solid #f5f5f5',
        alignItems: 'center',
        background: '#fff'
    };

    const labelStyle = {
        width: '110px',
        fontSize: '14px',
        color: '#666'
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#333' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>收款账户管理</div>
            </div>

            {/* 未绑定状态 */}
            {bankCards.length === 0 && !showForm && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>💳</div>
                    <div style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>暂未绑定银行卡</div>
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            background: '#409eff',
                            border: 'none',
                            color: '#fff',
                            padding: '12px 30px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        + 绑定银行卡
                    </button>
                </div>
            )}

            {/* 已绑定银行卡列表 */}
            {bankCards.length > 0 && !showForm && (
                <div>
                    <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                        <span>已绑定账户 ({bankCards.length})</span>
                        <span
                            onClick={() => setShowForm(true)}
                            style={{ color: '#409eff', cursor: 'pointer' }}
                        >
                            + 添加银行卡
                        </span>
                    </div>
                    {bankCards.map((card) => (
                        <div key={card.id} style={{ background: '#fff', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', margin: '0 10px 10px' }}>
                            <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    background: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}>
                                    {card.bankName.substring(0, 2)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>{card.bankName}</span>
                                        {card.isDefault && (
                                            <span style={{ fontSize: '10px', background: '#fdf6ec', color: '#e6a23c', padding: '1px 6px', borderRadius: '10px' }}>默认</span>
                                        )}
                                        <span style={{ fontSize: '10px', background: getStatusText(card.status).color + '20', color: getStatusText(card.status).color, padding: '1px 6px', borderRadius: '10px' }}>
                                            {getStatusText(card.status).text}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#999' }}>
                                        {card.cardNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1 **** **** $3')}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                        {card.accountName} · {card.phone}
                                    </div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid #f5f5f5', padding: '10px 15px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                {!card.isDefault && (
                                    <span
                                        onClick={() => handleSetDefault(card.id)}
                                        style={{ fontSize: '13px', color: '#409eff', cursor: 'pointer' }}
                                    >
                                        设为默认
                                    </span>
                                )}
                                <span
                                    onClick={() => handleDelete(card.id)}
                                    style={{ fontSize: '13px', color: '#f56c6c', cursor: 'pointer' }}
                                >
                                    解绑
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 绑定表单 */}
            {showForm && (
                <div>
                    <div style={{ padding: '10px 15px', fontSize: '12px', color: '#999' }}>绑定银行卡</div>
                    <div style={{ background: '#fff' }}>
                        <div style={cellStyle}>
                            <div style={labelStyle}>开户名 <span style={{ color: 'red' }}>*</span></div>
                            <input
                                type="text"
                                placeholder="请输入真实姓名"
                                value={form.accountName}
                                onChange={e => setForm({ ...form, accountName: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>银行 <span style={{ color: 'red' }}>*</span></div>
                            <select
                                value={form.bankName}
                                onChange={e => setForm({ ...form, bankName: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none', background: 'transparent' }}
                            >
                                <option value="">请选择银行</option>
                                {bankList.map(bank => (
                                    <option key={bank} value={bank}>{bank}</option>
                                ))}
                            </select>
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>银行卡号 <span style={{ color: 'red' }}>*</span></div>
                            <input
                                type="text"
                                placeholder="请输入银行卡号"
                                value={form.cardNumber}
                                onChange={e => setForm({ ...form, cardNumber: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>开户行支行</div>
                            <input
                                type="text"
                                placeholder="如：XX市XX区支行"
                                value={form.branchName}
                                onChange={e => setForm({ ...form, branchName: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>开户省份</div>
                            <input
                                type="text"
                                placeholder="如：广东省"
                                value={form.province}
                                onChange={e => setForm({ ...form, province: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>开户城市</div>
                            <input
                                type="text"
                                placeholder="如：深圳市"
                                value={form.city}
                                onChange={e => setForm({ ...form, city: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={cellStyle}>
                            <div style={labelStyle}>预留手机号 <span style={{ color: 'red' }}>*</span></div>
                            <input
                                type="text"
                                placeholder="请输入银行预留手机号"
                                maxLength={11}
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>
                        <div style={{ ...cellStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>微信收款码 <span style={{ color: 'red' }}>*</span></div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'wechatQrCode')}
                                style={{ width: '100%', fontSize: '14px' }}
                            />
                            {form.wechatQrCode && (
                                <img
                                    src={form.wechatQrCode}
                                    alt="微信收款码"
                                    style={{ width: '100px', height: '100px', objectFit: 'contain', marginTop: '10px', border: '1px solid #eee' }}
                                />
                            )}
                        </div>
                        <div style={{ ...cellStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>支付宝收款码 <span style={{ color: 'red' }}>*</span></div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'alipayQrCode')}
                                style={{ width: '100%', fontSize: '14px' }}
                            />
                            {form.alipayQrCode && (
                                <img
                                    src={form.alipayQrCode}
                                    alt="支付宝收款码"
                                    style={{ width: '100px', height: '100px', objectFit: 'contain', marginTop: '10px', border: '1px solid #eee' }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{
                                flex: 1,
                                background: '#fff',
                                border: '1px solid #ddd',
                                color: '#666',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                flex: 2,
                                background: submitting ? '#ccc' : '#409eff',
                                border: 'none',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: submitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {submitting ? '提交中...' : '提交'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
