'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';

interface BankCard { id: string; bankName: string; cardNumber: string; cardHolder: string; isDefault: boolean; createdAt: string; }

export default function MerchantBankPage() {
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false });

    useEffect(() => { loadCards(); }, []);

    const loadCards = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setCards(json.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!form.bankName || !form.cardNumber || !form.cardHolder) return alert('请填写完整信息');
        setSubmitting(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(form) });
            const json = await res.json();
            if (json.success) { alert('添加成功'); setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false }); loadCards(); }
            else alert(json.message || '添加失败');
        } catch { alert('网络错误'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该银行卡吗？')) return;
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { alert('删除成功'); loadCards(); }
            else alert(json.message || '删除失败');
        } catch { alert('网络错误'); }
    };

    const handleSetDefault = async (id: string) => {
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}/set-default`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) loadCards();
            else alert(json.message || '设置失败');
        } catch { alert('网络错误'); }
    };

    const bankOptions = ['中国工商银行', '中国建设银行', '中国农业银行', '中国银行', '招商银行', '交通银行', '中国邮政储蓄银行', '中信银行', '光大银行', '浦发银行', '民生银行', '兴业银行', '平安银行'];
    const maskCardNumber = (num: string) => num.length <= 8 ? num : num.slice(0, 4) + ' **** **** ' + num.slice(-4);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">银行卡管理</h1>
                    <p className="mt-1 text-sm text-[#6b7280]">绑定银行卡用于提现</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>+ 添加银行卡</Button>
            </div>

            {/* Cards List */}
            {loading ? (
                <div className="py-16 text-center text-[#6b7280]">加载中...</div>
            ) : cards.length === 0 ? (
                <Card className="bg-white py-16 text-center">
                    <div className="mb-4 text-5xl">💳</div>
                    <div className="mb-6 text-[#6b7280]">暂未绑定银行卡</div>
                    <Button onClick={() => setShowAddModal(true)}>立即绑定</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-5">
                    {cards.map(card => (
                        <div key={card.id} className="relative min-h-[160px] rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 p-6 text-white">
                            {card.isDefault && (
                                <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs">默认</span>
                            )}
                            <div className="mb-6 text-lg font-semibold">{card.bankName}</div>
                            <div className="mb-6 font-mono text-xl tracking-wider">{maskCardNumber(card.cardNumber)}</div>
                            <div className="flex items-end justify-between">
                                <div className="text-sm opacity-90">{card.cardHolder}</div>
                                <div className="flex gap-3">
                                    {!card.isDefault && (
                                        <button onClick={() => handleSetDefault(card.id)} className="rounded-md bg-white/20 px-3 py-1.5 text-xs">设为默认</button>
                                    )}
                                    <button onClick={() => handleDelete(card.id)} className="rounded-md bg-white/20 px-3 py-1.5 text-xs">删除</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal title="添加银行卡" open={showAddModal} onClose={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false }); }}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm text-[#4b5563]">开户银行 <span className="text-danger-400">*</span></label>
                        <Select value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} options={[{ value: '', label: '请选择银行' }, ...bankOptions.map(b => ({ value: b, label: b }))]} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm text-[#4b5563]">银行卡号 <span className="text-danger-400">*</span></label>
                        <Input type="text" value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, '') })} placeholder="请输入银行卡号" maxLength={19} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm text-[#4b5563]">持卡人姓名 <span className="text-danger-400">*</span></label>
                        <Input type="text" value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value })} placeholder="请输入持卡人姓名" />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                        <span className="text-sm text-[#4b5563]">设为默认提现银行卡</span>
                    </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false }); }}>取消</Button>
                    <Button onClick={handleAdd} disabled={submitting} className={cn(submitting && 'cursor-not-allowed opacity-70')}>{submitting ? '添加中...' : '确定添加'}</Button>
                </div>
            </Modal>
        </div>
    );
}
