'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';

interface KeywordScheme {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

interface KeywordDetail {
    id: string;
    keyword: string;
    targetPrice: number;
    searchEngine: string;
    orderType: string;
    amount: number;
}

export default function KeywordsPage() {
    const router = useRouter();
    const [schemes, setSchemes] = useState<KeywordScheme[]>([]);
    const [selectedScheme, setSelectedScheme] = useState<KeywordScheme | null>(null);
    const [keywords, setKeywords] = useState<KeywordDetail[]>([]);
    const [loading, setLoading] = useState(true);

    const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
    const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);

    const [schemeForm, setSchemeForm] = useState({ id: '', name: '', description: '' });
    const [keywordForm, setKeywordForm] = useState({ id: '', keyword: '', targetPrice: '', searchEngine: 'taobao', orderType: 'comprehensive', amount: '1' });

    useEffect(() => { fetchSchemes(); }, []);

    useEffect(() => {
        if (selectedScheme) fetchKeywords(selectedScheme.id);
        else setKeywords([]);
    }, [selectedScheme]);

    const fetchSchemes = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) {
                setSchemes(json.data);
                if (json.data.length > 0 && !selectedScheme) setSelectedScheme(json.data[0]);
            }
        } catch (error) { console.error('Failed to fetch schemes:', error); }
        finally { setLoading(false); }
    };

    const fetchKeywords = async (schemeId: string) => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes/${schemeId}/details`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setKeywords(json.data);
        } catch (error) { console.error('Failed to fetch keywords:', error); }
    };

    const handleSchemeSubmit = async () => {
        if (!schemeForm.name) return alert('请输入方案名称');
        try {
            const token = localStorage.getItem('merchantToken');
            const url = schemeForm.id ? `${BASE_URL}/keywords/schemes/${schemeForm.id}` : `${BASE_URL}/keywords/schemes`;
            const method = schemeForm.id ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: schemeForm.name, description: schemeForm.description }) });
            const json = await res.json();
            if (json.success) { fetchSchemes(); setIsSchemeModalOpen(false); setSchemeForm({ id: '', name: '', description: '' }); }
            else alert(json.message);
        } catch (error) { console.error('Scheme Op Failed:', error); }
    };

    const deleteScheme = async (id: string) => {
        if (!confirm('确定删除该方案及其所有关键词吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            await fetch(`${BASE_URL}/keywords/schemes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            fetchSchemes();
            if (selectedScheme?.id === id) setSelectedScheme(null);
        } catch (error) { console.error('Delete Scheme Failed:', error); }
    };

    const handleKeywordSubmit = async () => {
        if (!selectedScheme) return;
        if (!keywordForm.keyword) return alert('请输入关键词');
        try {
            const token = localStorage.getItem('merchantToken');
            const url = keywordForm.id ? `${BASE_URL}/keywords/details/${keywordForm.id}` : `${BASE_URL}/keywords/schemes/${selectedScheme.id}/details`;
            const method = keywordForm.id ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ keyword: keywordForm.keyword, targetPrice: Number(keywordForm.targetPrice), searchEngine: keywordForm.searchEngine, orderType: keywordForm.orderType, amount: Number(keywordForm.amount) }) });
            const json = await res.json();
            if (json.success) { fetchKeywords(selectedScheme.id); setIsKeywordModalOpen(false); setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: 'taobao', orderType: 'comprehensive', amount: '1' }); }
            else alert(json.message);
        } catch (error) { console.error('Keyword Op Failed:', error); }
    };

    const deleteKeyword = async (id: string) => {
        if (!confirm('确定删除该关键词吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            await fetch(`${BASE_URL}/keywords/details/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (selectedScheme) fetchKeywords(selectedScheme.id);
        } catch (error) { console.error('Delete Keyword Failed:', error); }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 p-6">
            {/* Left: Schemes List */}
            <Card className="flex w-[300px] flex-col bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">关键词方案</h2>
                    <button onClick={() => { setSchemeForm({ id: '', name: '', description: '' }); setIsSchemeModalOpen(true); }} className="cursor-pointer border-none bg-transparent text-xl text-blue-500">+</button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {schemes.map(scheme => (
                        <div
                            key={scheme.id}
                            onClick={() => setSelectedScheme(scheme)}
                            className={cn(
                                'mb-2 flex cursor-pointer items-center justify-between rounded-md border p-3',
                                selectedScheme?.id === scheme.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-[#f3f4f6]'
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{scheme.name}</div>
                                <div className="truncate text-xs text-[#9ca3af]">{scheme.description || '无描述'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); router.push(`/merchant/keywords/${scheme.id}`); }} className="cursor-pointer border-none bg-transparent text-xs text-green-600">详情</button>
                                <button onClick={(e) => { e.stopPropagation(); setSchemeForm(scheme); setIsSchemeModalOpen(true); }} className="cursor-pointer border-none bg-transparent text-xs text-blue-500">编辑</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteScheme(scheme.id); }} className="cursor-pointer border-none bg-transparent text-xs text-red-500">删除</button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Right: Keywords List */}
            <Card className="flex min-w-0 flex-1 flex-col bg-white p-6">
                {selectedScheme ? (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">{selectedScheme.name} - 关键词列表</h2>
                                <div className="mt-1 text-sm text-[#f9fafb]0">管理该方案下的所有搜索关键词配置</div>
                            </div>
                            <Button onClick={() => { setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: 'taobao', orderType: 'comprehensive', amount: '1' }); setIsKeywordModalOpen(true); }}>+ 添加关键词</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="min-w-[700px] w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                            <th className="px-3 py-3 text-left text-sm font-medium">关键词</th>
                                            <th className="px-3 py-3 text-left text-sm font-medium">搜索引擎</th>
                                            <th className="px-3 py-3 text-left text-sm font-medium">排序方式</th>
                                            <th className="px-3 py-3 text-left text-sm font-medium">卡不到价格</th>
                                            <th className="px-3 py-3 text-left text-sm font-medium">数量</th>
                                            <th className="px-3 py-3 text-left text-sm font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keywords.map(kw => (
                                            <tr key={kw.id} className="border-b border-[#f3f4f6]">
                                                <td className="px-3 py-3">{kw.keyword}</td>
                                                <td className="px-3 py-3">{kw.searchEngine === 'taobao' ? '淘宝/天猫' : kw.searchEngine === 'jd' ? '京东' : '拼多多'}</td>
                                                <td className="px-3 py-3">{kw.orderType === 'comprehensive' ? '综合排序' : kw.orderType === 'sales' ? '销量排序' : '价格排序'}</td>
                                                <td className="px-3 py-3">{kw.targetPrice || '-'}</td>
                                                <td className="px-3 py-3">{kw.amount}</td>
                                                <td className="px-3 py-3">
                                                    <button
                                                        onClick={() => { setKeywordForm({ id: kw.id, keyword: kw.keyword, targetPrice: kw.targetPrice?.toString() || '', searchEngine: kw.searchEngine, orderType: kw.orderType, amount: kw.amount.toString() }); setIsKeywordModalOpen(true); }}
                                                        className="mr-2 cursor-pointer border-none bg-transparent text-blue-500"
                                                    >编辑</button>
                                                    <button onClick={() => deleteKeyword(kw.id)} className="cursor-pointer border-none bg-transparent text-red-500">删除</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {keywords.length === 0 && <div className="py-10 text-center text-[#9ca3af]">暂无关键词，请点击右上角添加</div>}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-[#9ca3af]">请先在左侧选择或创建一个方案</div>
                )}
            </Card>

            {/* Scheme Modal */}
            <Modal title={schemeForm.id ? '编辑方案' : '新建方案'} open={isSchemeModalOpen} onClose={() => setIsSchemeModalOpen(false)}>
                <div className="space-y-3">
                    <Input value={schemeForm.name} onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })} placeholder="方案名称" />
                    <textarea
                        value={schemeForm.description}
                        onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })}
                        placeholder="方案描述 (选填)"
                        className="h-20 w-full resize-none rounded border border-[#e5e7eb] p-2"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsSchemeModalOpen(false)}>取消</Button>
                        <Button onClick={handleSchemeSubmit}>确定</Button>
                    </div>
                </div>
            </Modal>

            {/* Keyword Modal */}
            <Modal title={keywordForm.id ? '编辑关键词' : '添加关键词'} open={isKeywordModalOpen} onClose={() => setIsKeywordModalOpen(false)} className="w-[500px]">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="mb-1.5 block text-xs text-[#f9fafb]0">关键词</label>
                        <Input value={keywordForm.keyword} onChange={e => setKeywordForm({ ...keywordForm, keyword: e.target.value })} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs text-[#f9fafb]0">搜索引擎</label>
                        <Select
                            value={keywordForm.searchEngine}
                            onChange={v => setKeywordForm({ ...keywordForm, searchEngine: v })}
                            options={[{ value: 'taobao', label: '淘宝/天猫' }, { value: 'jd', label: '京东' }, { value: 'pdd', label: '拼多多' }]}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs text-[#f9fafb]0">排序方式</label>
                        <Select
                            value={keywordForm.orderType}
                            onChange={v => setKeywordForm({ ...keywordForm, orderType: v })}
                            options={[{ value: 'comprehensive', label: '综合排序' }, { value: 'sales', label: '销量排序' }, { value: 'price', label: '价格排序' }]}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs text-[#f9fafb]0">卡不到价格 (选填)</label>
                        <Input type="number" value={keywordForm.targetPrice} onChange={e => setKeywordForm({ ...keywordForm, targetPrice: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs text-[#f9fafb]0">数量</label>
                        <Input type="number" value={keywordForm.amount} onChange={e => setKeywordForm({ ...keywordForm, amount: e.target.value })} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => setIsKeywordModalOpen(false)}>取消</Button>
                    <Button onClick={handleKeywordSubmit}>确定</Button>
                </div>
            </Modal>
        </div>
    );
}
