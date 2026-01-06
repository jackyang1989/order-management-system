'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchKeywordSchemeById, fetchKeywordDetails, addKeywordDetail, updateKeywordDetail, deleteKeywordDetail, GoodsKey, KeywordDetail, KeywordTerminal, KeywordPlatform, platformNames, terminalNames, CreateKeywordDetailDto } from '../../../../services/keywordService';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';
import { Badge } from '../../../../components/ui/badge';

const platformColorMap: Record<number, string> = { [KeywordPlatform.TAOBAO]: 'bg-orange-500', [KeywordPlatform.TMALL]: 'bg-red-600' };

export default function KeywordDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [scheme, setScheme] = useState<GoodsKey | null>(null);
    const [details, setDetails] = useState<KeywordDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDetail, setEditingDetail] = useState<KeywordDetail | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<CreateKeywordDetailDto>({ keyword: '', terminal: KeywordTerminal.PC, filter: '', sort: '', maxPrice: 0, minPrice: 0, province: '' });

    useEffect(() => { loadData(); }, [resolvedParams.id]);

    const loadData = async () => {
        setLoading(true);
        const [schemeData, detailsData] = await Promise.all([fetchKeywordSchemeById(resolvedParams.id), fetchKeywordDetails(resolvedParams.id)]);
        setScheme(schemeData); setDetails(detailsData); setLoading(false);
    };

    const resetForm = () => setForm({ keyword: '', terminal: KeywordTerminal.PC, filter: '', sort: '', maxPrice: 0, minPrice: 0, province: '' });

    const handleAdd = () => { resetForm(); setEditingDetail(null); setShowAddModal(true); };

    const handleEdit = (detail: KeywordDetail) => {
        setForm({ keyword: detail.keyword, terminal: detail.terminal, filter: detail.filter || '', sort: detail.sort || '', maxPrice: detail.maxPrice || 0, minPrice: detail.minPrice || 0, province: detail.province || '' });
        setEditingDetail(detail); setShowAddModal(true);
    };

    const handleDelete = async (detailId: string) => {
        if (!confirm('确定要删除该关键词吗？')) return;
        const res = await deleteKeywordDetail(detailId);
        if (res.success) { alert('删除成功'); loadData(); } else alert(res.message);
    };

    const handleSubmit = async () => {
        if (!form.keyword.trim()) { alert('请输入关键词'); return; }
        setSubmitting(true);
        const res = editingDetail ? await updateKeywordDetail(editingDetail.id, form) : await addKeywordDetail(resolvedParams.id, form);
        setSubmitting(false);
        if (res.success) { alert(editingDetail ? '更新成功' : '添加成功'); setShowAddModal(false); resetForm(); setEditingDetail(null); loadData(); }
        else alert(res.message);
    };

    if (loading) return <div className="py-6 text-center text-slate-500">加载中...</div>;

    if (!scheme) {
        return (
            <div className="py-6 text-center">
                <div className="mb-4 text-red-500">方案不存在</div>
                <button onClick={() => router.back()} className="text-blue-500">返回</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Back Link */}
            <button onClick={() => router.push('/merchant/keywords')} className="text-sm text-blue-500 hover:underline">← 返回方案列表</button>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="mb-2 text-2xl font-medium">{scheme.name}</h1>
                    <span className={cn('rounded px-2 py-1 text-xs text-white', platformColorMap[scheme.platform as KeywordPlatform] || 'bg-blue-500')}>
                        {platformNames[scheme.platform as KeywordPlatform] || '淘宝'}
                    </span>
                </div>
                <Button onClick={handleAdd}>+ 添加关键词</Button>
            </div>

            {/* Keywords Table */}
            <Card className="bg-white p-6">
                {details.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                        <div className="mb-4">暂无关键词</div>
                        <button onClick={handleAdd} className="text-blue-500 hover:underline">立即添加</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">关键词</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">终端</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">价格区间</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">筛选条件</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">发货地</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.map(detail => (
                                    <tr key={detail.id} className="border-b border-slate-100">
                                        <td className="px-4 py-4 font-medium">{detail.keyword}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={detail.terminal === KeywordTerminal.PC ? 'blue' : 'green'}>
                                                {terminalNames[detail.terminal as KeywordTerminal] || '电脑端'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {detail.minPrice || detail.maxPrice ? <span>¥{detail.minPrice} - ¥{detail.maxPrice}</span> : <span className="text-slate-400">不限</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {detail.filter || detail.sort ? <span>{detail.filter} {detail.sort}</span> : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-4 py-4 text-sm">{detail.province || '-'}</td>
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleEdit(detail)} className="mr-3 text-sm text-blue-500 hover:underline">编辑</button>
                                            <button onClick={() => handleDelete(detail.id)} className="text-sm text-red-500 hover:underline">删除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal title={editingDetail ? '编辑关键词' : '添加关键词'} open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); setEditingDetail(null); }}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm">关键词 <span className="text-red-500">*</span></label>
                        <Input type="text" value={form.keyword} onChange={e => setForm({ ...form, keyword: e.target.value })} placeholder="请输入搜索关键词" maxLength={100} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm">终端类型</label>
                        <Select value={String(form.terminal)} onChange={v => setForm({ ...form, terminal: Number(v) })} options={[{ value: String(KeywordTerminal.PC), label: '电脑端' }, { value: String(KeywordTerminal.MOBILE), label: '手机端' }]} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-2 block text-sm">最低价格</label>
                            <Input type="number" value={String(form.minPrice)} onChange={e => setForm({ ...form, minPrice: Number(e.target.value) })} placeholder="0" min={0} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm">最高价格</label>
                            <Input type="number" value={String(form.maxPrice)} onChange={e => setForm({ ...form, maxPrice: Number(e.target.value) })} placeholder="0" min={0} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm">筛选分类</label>
                        <Input type="text" value={form.filter} onChange={e => setForm({ ...form, filter: e.target.value })} placeholder="如：女装" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm">排序方式</label>
                        <Input type="text" value={form.sort} onChange={e => setForm({ ...form, sort: e.target.value })} placeholder="如：销量排序" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm">发货地</label>
                        <Input type="text" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} placeholder="如：浙江" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); setEditingDetail(null); }}>取消</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className={cn(submitting && 'cursor-not-allowed opacity-70')}>{submitting ? '保存中...' : '保存'}</Button>
                </div>
            </Modal>
        </div>
    );
}
