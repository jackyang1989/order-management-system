'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchBankCards, addBankCard, deleteBankCard, setDefaultBankCard, BankCard } from '../../../services/userService';

export default function PaymentSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<BankCard[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        bankName: '', accountName: '', cardNumber: '', phone: '',
        province: '', city: '', branchName: '', alipayQrCode: '', wechatQrCode: ''
    });

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadCards(); }, []);

    const loadCards = async () => {
        setLoading(true);
        try { const result = await fetchBankCards(); setCards(result); }
        catch (error) { console.error('Load cards error:', error); }
        finally { setLoading(false); }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.bankName || !form.accountName || !form.cardNumber) { toastError('请填写完整必填信息'); return; }
        setSubmitting(true);
        try {
            const result = await addBankCard(form);
            if (result.success) { toastSuccess('银行卡添加成功'); setShowAddModal(false); setForm({ bankName: '', accountName: '', cardNumber: '', phone: '', province: '', city: '', branchName: '', alipayQrCode: '', wechatQrCode: '' }); loadCards(); }
            else { toastError(result.message || '添加失败'); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('确定要删除这张银行卡吗？')) return;
        try {
            const result = await deleteBankCard(id);
            if (result.success) { toastSuccess('删除成功'); loadCards(); }
            else { toastError(result.message); }
        } catch (error) { toastError('网络错误'); }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const result = await setDefaultBankCard(id);
            if (result.success) { toastSuccess('设置成功'); loadCards(); }
            else { toastError(result.message); }
        } catch (error) { toastError('网络错误'); }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">银行卡管理</h1>
                    <button onClick={() => setShowAddModal(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 active:scale-95 transition-transform">ADD NEW</button>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {loading ? (
                    <div className="py-20 flex justify-center"><Spinner size="lg" className="text-blue-600" /></div>
                ) : cards.length === 0 ? (
                    <div className="rounded-[24px] bg-white p-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="mb-6 text-5xl">💳</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No cards linked yet</p>
                        <Button className="mt-8 rounded-[16px] bg-slate-900 px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-transform active:scale-95" onClick={() => setShowAddModal(true)}>
                            BIND NOW
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cards.map(card => (
                            <Card key={card.id} className={cn('relative overflow-hidden border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all rounded-[24px]', card.isDefault ? 'bg-slate-900 text-white' : 'bg-white')}>
                                {card.isDefault && (
                                    <div className="absolute right-6 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                                        <span className="text-[10px]">✓</span>
                                    </div>
                                )}
                                <div className="p-8">
                                    <div className="mb-8 flex items-center gap-4">
                                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-[16px] text-xl shadow-inner', card.isDefault ? 'bg-slate-800' : 'bg-slate-50')}>🏦</div>
                                        <div>
                                            <div className={cn('text-sm font-black uppercase tracking-tight', card.isDefault ? 'text-white' : 'text-slate-900')}>{card.bankName}</div>
                                            <div className={cn('text-[10px] font-bold uppercase tracking-widest', card.isDefault ? 'text-slate-400' : 'text-slate-400')}>{card.accountName}</div>
                                        </div>
                                    </div>
                                    <div className={cn('mb-8 text-xl font-black tracking-[0.2em] tabular-nums', card.isDefault ? 'text-white' : 'text-slate-700')}>
                                        •••• •••• •••• {card.cardNumber.slice(-4)}
                                    </div>
                                    <div className={cn('flex justify-end gap-6 pt-6 border-t', card.isDefault ? 'border-slate-800' : 'border-slate-50')}>
                                        {!card.isDefault && <button onClick={() => handleSetDefault(card.id)} className="text-[10px] font-black uppercase tracking-widest text-blue-500 active:scale-95 transition-transform">SET DEFAULT</button>}
                                        <button onClick={() => handleDeleteCard(card.id)} className="text-[10px] font-black uppercase tracking-widest text-rose-500 active:scale-95 transition-transform">DELETE</button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 rounded-[24px] bg-amber-50/50 p-6 border border-amber-100/50">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-widest leading-none">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        绑定须知 • TIPS
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold text-amber-800/60 leading-relaxed uppercase tracking-wide">
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">01</span> 请务必填写正确的开户行及分支行信息，否则将导致提现失败。</li>
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">02</span> 银行卡持卡人姓名必须与实名认证姓名一致。</li>
                        <li className="flex gap-2"><span className="opacity-40 italic font-black">03</span> 建议绑定主流银行卡（招商、工商、建设等）以获得更快的到账体验。</li>
                    </ul>
                </div>
            </ProfileContainer>

            {/* Add Card Modal */}
            <Modal title="添加银行卡" open={showAddModal} onClose={() => setShowAddModal(false)} className="rounded-[32px] p-8">
                <form onSubmit={handleAddCard} className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">银行名称 <span className="text-rose-500">*</span></label>
                            <input className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="如：招商银行" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">持卡人姓名 <span className="text-rose-500">*</span></label>
                            <input className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="姓名" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">银行卡号 <span className="text-rose-500">*</span></label>
                        <input className="w-full rounded-[16px] border-none bg-slate-50 px-8 py-5 text-center text-xl font-black text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="0000 0000 0000 0000" value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">省份</label>
                            <input className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="省份" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">城市</label>
                            <input className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="城市" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">支行信息 <span className="text-rose-500">*</span></label>
                        <input className="w-full rounded-[16px] border-none bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-blue-500/20" placeholder="如：某某支行" value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} />
                    </div>
                    <div className="flex gap-4 pt-6">
                        <Button type="submit" loading={submitting} className="flex-1 rounded-[20px] bg-slate-900 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-transform active:scale-95">确定并绑定</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
