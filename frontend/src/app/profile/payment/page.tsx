'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { Button } from '../../../components/ui/button';
import { isAuthenticated } from '../../../services/authService';
import { fetchBankCards, addBankCard, deleteBankCard, setDefaultBankCard, BankCard } from '../../../services/userService';

const bankList = ['工商银行', '建设银行', '农业银行', '中国银行', '招商银行', '交通银行', '邮储银行', '兴业银行', '民生银行', '浦发银行'];

export default function PaymentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        accountName: '', bankName: '', cardNumber: '', branchName: '',
        province: '', city: '', phone: '', wechatQrCode: '', alipayQrCode: ''
    });

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try { const cards = await fetchBankCards(); setBankCards(cards); }
        catch (error) { console.error('Load bank cards error:', error); }
        finally { setLoading(false); }
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
            try { const base64 = await fileToBase64(file); setForm(prev => ({ ...prev, [field]: base64 })); }
            catch (error) { console.error('File read error:', error); alert('图片读取失败'); }
        }
    };

    const handleSubmit = async () => {
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
                bankName: form.bankName, accountName: form.accountName, cardNumber: form.cardNumber,
                phone: form.phone, province: form.province, city: form.city, branchName: form.branchName,
                wechatQrCode: form.wechatQrCode, alipayQrCode: form.alipayQrCode
            });
            if (result.success) {
                alert(result.message || '绑定成功');
                setShowForm(false);
                setForm({ accountName: '', bankName: '', cardNumber: '', branchName: '', province: '', city: '', phone: '', wechatQrCode: '', alipayQrCode: '' });
                await loadData();
            } else { alert(result.message || '绑定失败'); }
        } catch (error) { alert('网络错误，请重试'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要解绑此银行卡吗？')) return;
        const result = await deleteBankCard(id);
        if (result.success) { alert(result.message || '解绑成功'); await loadData(); }
        else { alert(result.message || '解绑失败'); }
    };

    const handleSetDefault = async (id: string) => {
        const result = await setDefaultBankCard(id);
        if (result.success) { await loadData(); }
        else { alert(result.message || '设置失败'); }
    };

    const getStatusText = (status: number | string) => {
        if (status === 0 || status === 'PENDING') return { text: '待审核', color: 'amber' };
        if (status === 1 || status === 'APPROVED') return { text: '已通过', color: 'green' };
        if (status === 2 || status === 'REJECTED') return { text: '未通过', color: 'red' };
        return { text: '未知', color: 'slate' };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">收款账户管理</h1>
            </header>

            {/* Empty State */}
            {bankCards.length === 0 && !showForm && (
                <div className="py-16 text-center">
                    <div className="mb-5 text-5xl">💳</div>
                    <div className="mb-5 text-sm text-slate-400">暂未绑定银行卡</div>
                    <Button onClick={() => setShowForm(true)} className="bg-blue-500 hover:bg-blue-600">
                        + 绑定银行卡
                    </Button>
                </div>
            )}

            {/* Card List */}
            {bankCards.length > 0 && !showForm && (
                <ProfileContainer className="py-4">
                    <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-slate-400">已绑定账户 ({bankCards.length})</span>
                        <button onClick={() => setShowForm(true)} className="text-blue-500">+ 添加银行卡</button>
                    </div>
                    <div className="space-y-3">
                        {bankCards.map((card) => {
                            const status = getStatusText(card.status);
                            return (
                                <div key={card.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center gap-3 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">
                                            {card.bankName.substring(0, 2)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800">{card.bankName}</span>
                                                {card.isDefault && (
                                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-600">默认</span>
                                                )}
                                                <span className={cn(
                                                    'rounded px-1.5 py-0.5 text-xs',
                                                    status.color === 'amber' && 'bg-amber-100 text-amber-600',
                                                    status.color === 'green' && 'bg-green-100 text-green-600',
                                                    status.color === 'red' && 'bg-red-100 text-red-600'
                                                )}>
                                                    {status.text}
                                                </span>
                                            </div>
                                            <div className="mt-0.5 text-sm text-slate-400">
                                                {card.cardNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1 **** **** $3')}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-400">
                                                {card.accountName} · {card.phone}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-4 border-t border-slate-100 px-4 py-2.5">
                                        {!card.isDefault && (
                                            <button onClick={() => handleSetDefault(card.id)} className="text-sm text-blue-500">设为默认</button>
                                        )}
                                        <button onClick={() => handleDelete(card.id)} className="text-sm text-red-500">解绑</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ProfileContainer>
            )}

            {/* Add Form */}
            {showForm && (
                <ProfileContainer className="py-4">
                    <div className="mb-3 text-sm text-slate-400">绑定银行卡</div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <FormRow label="开户名" required>
                            <input type="text" placeholder="请输入真实姓名" value={form.accountName}
                                onChange={e => setForm({ ...form, accountName: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <FormRow label="银行" required>
                            <select value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none">
                                <option value="">请选择银行</option>
                                {bankList.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                            </select>
                        </FormRow>
                        <FormRow label="银行卡号" required>
                            <input type="text" placeholder="请输入银行卡号" value={form.cardNumber}
                                onChange={e => setForm({ ...form, cardNumber: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <FormRow label="开户行支行">
                            <input type="text" placeholder="如：XX市XX区支行" value={form.branchName}
                                onChange={e => setForm({ ...form, branchName: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <FormRow label="开户省份">
                            <input type="text" placeholder="如：广东省" value={form.province}
                                onChange={e => setForm({ ...form, province: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <FormRow label="开户城市">
                            <input type="text" placeholder="如：深圳市" value={form.city}
                                onChange={e => setForm({ ...form, city: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <FormRow label="预留手机号" required>
                            <input type="text" placeholder="请输入银行预留手机号" maxLength={11} value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none" />
                        </FormRow>
                        <div className="border-b border-slate-100 p-4">
                            <div className="mb-2 text-sm text-slate-500">微信收款码 <span className="text-red-500">*</span></div>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'wechatQrCode')} className="text-sm" />
                            {form.wechatQrCode && <img src={form.wechatQrCode} alt="微信收款码" className="mt-2 h-24 w-24 rounded border object-contain" />}
                        </div>
                        <div className="p-4">
                            <div className="mb-2 text-sm text-slate-500">支付宝收款码 <span className="text-red-500">*</span></div>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'alipayQrCode')} className="text-sm" />
                            {form.alipayQrCode && <img src={form.alipayQrCode} alt="支付宝收款码" className="mt-2 h-24 w-24 rounded border object-contain" />}
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">取消</Button>
                        <Button onClick={handleSubmit} loading={submitting} className="flex-[2] bg-blue-500 hover:bg-blue-600">提交</Button>
                    </div>
                </ProfileContainer>
            )}
        </div>
    );
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex items-center border-b border-slate-100 px-4 py-3">
            <span className="w-24 text-sm text-slate-500">{label} {required && <span className="text-red-500">*</span>}</span>
            {children}
        </div>
    );
}
