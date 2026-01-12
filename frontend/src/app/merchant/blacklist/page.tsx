'use client';

import { useState, useEffect } from 'react';
import { fetchBlacklist, addBlacklist, deleteBlacklist, MerchantBlacklist, BlacklistType, CreateBlacklistDto } from '../../../services/blacklistService';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';
import { Badge } from '../../../components/ui/badge';

export default function MerchantBlacklistPage() {
    const [blacklist, setBlacklist] = useState<MerchantBlacklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<CreateBlacklistDto>({ accountName: '', type: BlacklistType.PERMANENT, endTime: '', reason: '' });

    const totalPages = Math.ceil(total / 20);

    useEffect(() => { loadBlacklist(); }, [page]);

    const loadBlacklist = async () => {
        setLoading(true);
        const result = await fetchBlacklist({ accountName: searchText || undefined, page, limit: 20 });
        setBlacklist(result.data); setTotal(result.total); setLoading(false);
    };

    const handleSearch = () => { setPage(1); loadBlacklist(); };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要移除该账号吗？')) return;
        const res = await deleteBlacklist(id);
        if (res.success) { alert('移除成功'); loadBlacklist(); } else alert(res.message);
    };

    const handleAdd = async () => {
        if (!form.accountName.trim()) { alert('请输入买号'); return; }
        if (form.type === BlacklistType.TEMPORARY && !form.endTime) { alert('限时拉黑请选择结束时间'); return; }
        setSubmitting(true);
        const res = await addBlacklist(form);
        setSubmitting(false);
        if (res.success) { alert('添加成功'); setShowAddModal(false); setForm({ accountName: '', type: BlacklistType.PERMANENT, endTime: '', reason: '' }); loadBlacklist(); }
        else alert(res.message);
    };

    const resetForm = () => setForm({ accountName: '', type: BlacklistType.PERMANENT, endTime: '', reason: '' });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-900">黑名单管理</h1>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="h-11 rounded-[16px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700"
                >
                    + 添加黑名单
                </Button>
            </div>

            {/* Search */}
            <Card className="rounded-[24px] border-0 bg-white p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <div className="flex-1 px-2">
                        <Input
                            type="text"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            placeholder="搜索买号..."
                            className="h-12 w-full border-none bg-transparent px-2 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0"
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} className="h-10 rounded-[14px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700">搜索</Button>
                </div>
            </Card>

            {/* List */}
            <Card className="overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                    <div className="py-20 text-center font-bold text-slate-400">加载中...</div>
                ) : blacklist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 text-5xl opacity-20">🚫</div>
                        <div className="font-bold text-slate-400">暂无黑名单记录</div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50 bg-slate-50/50">
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">买号</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">类型</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">结束时间</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">原因</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">添加时间</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {blacklist.map(item => (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.accountName}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="solid" color={item.type === BlacklistType.PERMANENT ? 'red' : 'amber'} className="rounded-full">
                                                    {item.type === BlacklistType.PERMANENT ? '永久拉黑' : '限时拉黑'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                                {item.type === BlacklistType.TEMPORARY && item.endTime ? new Date(item.endTime).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.reason || '-'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-danger-400 hover:text-danger-600 hover:underline">移除</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="border-t border-slate-50 p-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn('flex h-9 w-9 items-center justify-center rounded-[10px] bg-slate-100 font-bold text-slate-500 hover:bg-slate-200', page === 1 && 'cursor-not-allowed opacity-50')}>&lt;</button>
                                    <span className="text-sm font-bold text-slate-500">{page} / {totalPages}</span>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={cn('flex h-9 w-9 items-center justify-center rounded-[10px] bg-slate-100 font-bold text-slate-500 hover:bg-slate-200', page === totalPages && 'cursor-not-allowed opacity-50')}>&gt;</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Add Modal */}
            <Modal title="添加黑名单" open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} className="rounded-[32px]">
                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">买号 <span className="text-danger-400">*</span></label>
                        <Input
                            type="text"
                            value={form.accountName}
                            onChange={e => setForm({ ...form, accountName: e.target.value })}
                            placeholder="请输入买号"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">拉黑类型</label>
                        <Select
                            value={String(form.type)}
                            onChange={v => setForm({ ...form, type: parseInt(v) })}
                            options={[{ value: String(BlacklistType.PERMANENT), label: '永久拉黑' }, { value: String(BlacklistType.TEMPORARY), label: '限时拉黑' }]}
                            className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    {form.type === BlacklistType.TEMPORARY && (
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">结束时间 <span className="text-danger-400">*</span></label>
                            <Input
                                type="datetime-local"
                                value={form.endTime}
                                onChange={e => setForm({ ...form, endTime: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">拉黑原因</label>
                        <textarea
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="可选填写拉黑原因"
                            className="min-h-[100px] w-full resize-y rounded-[16px] border-none bg-slate-50 p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => { setShowAddModal(false); resetForm(); }}
                            className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleAdd}
                            disabled={submitting}
                            className={cn(
                                "h-11 rounded-[16px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700",
                                submitting && "cursor-not-allowed opacity-70"
                            )}
                        >
                            {submitting ? '添加中...' : '确定添加'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
