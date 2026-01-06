'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { isAuthenticated, getToken } from '../../../services/authService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface BuynoItem {
    id: string;
    wwid: string;
    mobile: string;
    address: string;
    is_default: number;
    state: string;
    status_text: string;
}

export default function BuynoPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
    const [accounts, setAccounts] = useState<BuynoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        wwid: '',
        name: '',
        mobile: '',
        province: '',
        city: '',
        area: '',
        address: '',
        alipayName: '',
        img3: null as any,
        img4: null as any,
    });

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/buynolist`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.code === 1) setAccounts(data.data || []);
        } catch (e) {
            console.error('Load accounts error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.wwid || !form.mobile || !form.address) { toastError('请填写必填信息'); return; }
        setSubmitting(true);
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/addbuyno`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.code === 1) {
                toastSuccess(data.msg || '提交成功');
                setTimeout(() => {
                    if (data.url) router.push(data.url);
                    else {
                        setActiveTab('list');
                        loadAccounts();
                        setForm({
                            wwid: '', name: '', mobile: '', province: '', city: '', area: '', address: '',
                            alipayName: '', img3: null, img4: null,
                        });
                    }
                }, 3000);
            } else {
                toastError(data.msg || '提交失败');
            }
        } catch (error) {
            toastError('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">买号添加</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 py-4">
                {/* Tabs */}
                <div className="mb-4 flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    {[{ key: 'list', label: '买号信息' }, { key: 'add', label: '添加账号' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-blue-500 text-white' : 'text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'list' ? (
                    <div className="space-y-4">
                        {accounts.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">
                                <div className="mb-3 text-4xl">🛒</div>
                                <p className="text-sm">暂无买号信息</p>
                                <Button className="mt-4 bg-blue-500" onClick={() => setActiveTab('add')}>立即添加</Button>
                            </div>
                        ) : (
                            accounts.map(acc => (
                                <Card key={acc.id} className="border-slate-200 p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-500">{acc.wwid.charAt(0).toUpperCase()}</div>
                                            <div>
                                                <div className="font-bold text-slate-800">{acc.wwid}</div>
                                                <div className="text-xs text-slate-400">{acc.mobile}</div>
                                            </div>
                                        </div>
                                        <Badge variant="soft" color={acc.state === '1' ? 'green' : acc.state === '0' ? 'amber' : 'red'}>
                                            {acc.status_text}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-500">收货地址: {acc.address}</div>
                                    {acc.is_default === 1 && <div className="mt-2 text-[10px] font-medium text-blue-500">默认买号</div>}
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">旺旺ID <span className="text-red-500">*</span></label>
                                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="淘宝用户名/旺旺号" value={form.wwid} onChange={e => setForm(f => ({ ...f, wwid: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">手机号码 <span className="text-red-500">*</span></label>
                                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="账号关联手机号" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">省份</label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500" placeholder="省" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">城市</label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500" placeholder="市" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">地区</label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500" placeholder="区" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">详细收货地址 <span className="text-red-500">*</span></label>
                                <textarea className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none" placeholder="建议复制淘宝收货地址" rows={3} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">支付宝账号姓名</label>
                                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-blue-500" placeholder="请填写支付宝实名" value={form.alipayName} onChange={e => setForm(f => ({ ...f, alipayName: e.target.value }))} />
                            </div>
                            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                                💡 请确保买号信息真实有效，以免影响任务审核和返款。
                            </div>
                            <Button type="submit" loading={submitting} className="mt-2 w-full bg-blue-500 py-6 text-base font-medium hover:bg-blue-600">提交申请</Button>
                        </form>
                    </Card>
                )}
            </div>
        </div>
    );
}
