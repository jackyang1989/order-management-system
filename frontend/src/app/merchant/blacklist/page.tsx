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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-medium">黑名单管理</h1>
                <Button onClick={() => setShowAddModal(true)}>+ 添加黑名单</Button>
            </div>

            {/* Search */}
            <Card noPadding className="bg-white">
                <div className="flex items-center gap-3 p-4">
                    <Input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索买号..." className="w-[200px]" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                    <Button onClick={handleSearch}>搜索</Button>
                </div>
            </Card>

            {/* List */}
            <Card className="bg-white p-6">
                {loading ? (
                    <div className="py-10 text-center text-[#f9fafb]0">加载中...</div>
                ) : blacklist.length === 0 ? (
                    <div className="py-10 text-center text-[#9ca3af]">暂无黑名单记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[700px] w-full border-collapse">
                                <thead>
                                    <tr className="bg-[#f9fafb]">
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">买号</th>
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">类型</th>
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">结束时间</th>
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">原因</th>
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">添加时间</th>
                                        <th className="border-b border-[#f3f4f6] px-4 py-4 text-left text-sm font-medium text-[#4b5563]">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blacklist.map(item => (
                                        <tr key={item.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-4 font-medium">{item.accountName}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant="solid" color={item.type === BlacklistType.PERMANENT ? 'red' : 'amber'}>
                                                    {item.type === BlacklistType.PERMANENT ? '永久拉黑' : '限时拉黑'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-[#9ca3af]">
                                                {item.type === BlacklistType.TEMPORARY && item.endTime ? new Date(item.endTime).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm">{item.reason || '-'}</td>
                                            <td className="px-4 py-4 text-sm text-[#9ca3af]">{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-4">
                                                <button onClick={() => handleDelete(item.id)} className="text-sm text-red-500 hover:underline">移除</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn('rounded border border-[#e5e7eb] px-4 py-2', page === 1 ? 'cursor-not-allowed bg-[#f3f4f6]' : 'bg-white')}>上一页</button>
                                <span className="px-4">{page} / {totalPages} (共 {total} 条)</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={cn('rounded border border-[#e5e7eb] px-4 py-2', page === totalPages ? 'cursor-not-allowed bg-[#f3f4f6]' : 'bg-white')}>下一页</button>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Add Modal */}
            <Modal title="添加黑名单" open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm">买号 <span className="text-red-500">*</span></label>
                        <Input type="text" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="请输入买号" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm">拉黑类型</label>
                        <Select value={String(form.type)} onChange={v => setForm({ ...form, type: parseInt(v) })} options={[{ value: String(BlacklistType.PERMANENT), label: '永久拉黑' }, { value: String(BlacklistType.TEMPORARY), label: '限时拉黑' }]} />
                    </div>
                    {form.type === BlacklistType.TEMPORARY && (
                        <div>
                            <label className="mb-2 block text-sm">结束时间 <span className="text-red-500">*</span></label>
                            <Input type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm">拉黑原因</label>
                        <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="可选填写拉黑原因" className="min-h-[80px] w-full resize-y rounded-md border border-[#e5e7eb] px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>取消</Button>
                    <Button onClick={handleAdd} disabled={submitting} className={cn(submitting && 'cursor-not-allowed opacity-70')}>{submitting ? '添加中...' : '确定添加'}</Button>
                </div>
            </Modal>
        </div>
    );
}
