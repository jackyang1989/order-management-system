'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
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
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">银行卡管理</h1>
                    <button onClick={() => setShowAddModal(true)} className="text-sm font-medium text-blue-500">添加</button>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : cards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
                        <div className="mb-3 text-4xl">💳</div>
                        <p className="text-sm">暂未绑定银行卡</p>
                        <Button className="mt-4 bg-blue-500" onClick={() => setShowAddModal(true)}>立即绑定</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cards.map(card => (
                            <Card key={card.id} className={cn('relative overflow-hidden border-slate-200 transition-all', card.isDefault ? 'border-blue-500 bg-blue-50/30' : 'bg-white')}>
                                {card.isDefault && <div className="absolute right-0 top-0 rounded-bl-lg bg-blue-500 px-3 py-1 text-[10px] text-white">默认</div>}
                                <div className="p-4">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl">🏦</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{card.bankName}</div>
                                            <div className="text-xs text-slate-400">{card.accountName}</div>
                                        </div>
                                    </div>
                                    <div className="mb-4 text-lg font-medium tracking-wider text-slate-700">
                                        **** **** **** {card.cardNumber.slice(-4)}
                                    </div>
                                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                        {!card.isDefault && <button onClick={() => handleSetDefault(card.id)} className="text-xs text-blue-500">设为默认</button>}
                                        <button onClick={() => handleDeleteCard(card.id)} className="text-xs text-red-500">删除</button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-6 rounded-lg bg-amber-50 p-4 text-xs text-amber-700 leading-relaxed">
                    <div className="mb-2 font-bold flex items-center gap-1">⚠️ 绑定须知</div>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>请务必填写正确的开户行及分支行信息，否则将导致提现失败。</li>
                        <li>银行卡持卡人姓名必须与实名认证姓名一致。</li>
                        <li>建议绑定主流银行卡（招商、工商、建设等）以获得更快的到账体验。</li>
                    </ul>
                </div>
            </ProfileContainer>

            {/* Add Card Modal */}
            <Modal title="添加银行卡" open={showAddModal} onClose={() => setShowAddModal(false)}>
                <form onSubmit={handleAddCard} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">银行名称 <span className="text-red-500">*</span></label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500" placeholder="如：招商银行" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">持卡人姓名 <span className="text-red-500">*</span></label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500" placeholder="姓名" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">银行卡号 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500" placeholder="请输入银行卡号" value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">省份</label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" placeholder="省份" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">城市</label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" placeholder="城市" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">支行信息 <span className="text-red-500">*</span></label>
                        <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500" placeholder="如：某某支行" value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">取消</Button>
                        <Button type="submit" loading={submitting} className="flex-1 bg-blue-500 hover:bg-blue-600">确定</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
