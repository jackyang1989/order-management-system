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

    const [platforms, setPlatforms] = useState<{ label: string; value: string }[]>([
        { value: 'taobao', label: '淘宝/天猫' },
        { value: 'jd', label: '京东' },
        { value: 'pdd', label: '拼多多' }
    ]);

    useEffect(() => {
        fetchSchemes();
        fetchSystemConfig();
    }, []);

    useEffect(() => {
        if (selectedScheme) fetchKeywords(selectedScheme.id);
        else setKeywords([]);
    }, [selectedScheme]);

    const fetchSystemConfig = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/system-config/global`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data?.enabledPlatforms) {
                let enabled: string[] = [];
                try {
                    enabled = typeof json.data.enabledPlatforms === 'string'
                        ? JSON.parse(json.data.enabledPlatforms)
                        : json.data.enabledPlatforms;
                } catch (e) {
                    console.error('Failed to parse enabledPlatforms', e);
                    enabled = ['taobao', 'jd', 'pdd'];
                }

                const platformMap: Record<string, string> = {
                    'taobao': '淘宝/天猫',
                    'tmall': '天猫',
                    'jd': '京东',
                    'pdd': '拼多多',
                    'douyin': '抖音',
                    'kuaishou': '快手'
                };

                const newPlatforms = enabled.map(p => ({
                    value: p,
                    label: platformMap[p] || p
                }));

                if (newPlatforms.length > 0) {
                    setPlatforms(newPlatforms);
                }
            }
        } catch (error) {
            console.error('Failed to fetch system config:', error);
        }
    };

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

    const deleteScheme = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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
            if (json.success) { fetchKeywords(selectedScheme.id); setIsKeywordModalOpen(false); setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: platforms[0]?.value || 'taobao', orderType: 'comprehensive', amount: '1' }); }
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

    const getPlatformLabel = (value: string) => {
        const found = platforms.find(p => p.value === value);
        return found ? found.label : (value === 'taobao' ? '淘宝/天猫' : value === 'jd' ? '京东' : value === 'pdd' ? '拼多多' : value);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-8">
            {/* Left: Schemes List */}
            <Card className="flex w-[320px] flex-col rounded-[32px] border-0 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">方案列表</h2>
                    <button
                        onClick={() => { setSchemeForm({ id: '', name: '', description: '' }); setIsSchemeModalOpen(true); }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                        {schemes.map(scheme => (
                            <div
                                key={scheme.id}
                                onClick={() => setSelectedScheme(scheme)}
                                className={cn(
                                    'group relative cursor-pointer rounded-[20px] border p-4 transition-all duration-200',
                                    selectedScheme?.id === scheme.id
                                        ? 'border-transparent bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                                        : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                                )}
                            >
                                <div className="mb-1 pr-16 truncate text-base font-bold">
                                    {scheme.name}
                                </div>
                                <div className={cn(
                                    "truncate text-xs font-medium",
                                    selectedScheme?.id === scheme.id ? "text-primary-100" : "text-slate-400"
                                )}>
                                    {scheme.description || '暂无描述'}
                                </div>

                                <div className={cn(
                                    "absolute right-3 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                                    selectedScheme?.id === scheme.id && "text-white"
                                )}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSchemeForm(scheme); setIsSchemeModalOpen(true); }}
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                                            selectedScheme?.id === scheme.id ? "hover:bg-white/20" : "hover:bg-slate-200 text-slate-400 hover:text-primary-600"
                                        )}
                                    >
                                        <span className="text-xs">✎</span>
                                    </button>
                                    <button
                                        onClick={(e) => deleteScheme(scheme.id, e)}
                                        className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                                            selectedScheme?.id === scheme.id ? "hover:bg-white/20" : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                                        )}
                                    >
                                        <span className="text-xs">×</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {schemes.length === 0 && (
                            <div className="flex h-32 flex-col items-center justify-center rounded-[20px] bg-slate-50 text-slate-400">
                                <span className="mb-2 text-2xl">📝</span>
                                <span className="text-sm">暂无方案</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* Right: Keywords List */}
            <Card className="flex min-w-0 flex-1 flex-col rounded-[32px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedScheme ? (
                    <>
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{selectedScheme.name}</h2>
                                <p className="mt-1 text-sm font-medium text-slate-400">
                                    {selectedScheme.description || '管理该方案下的所有搜索关键词配置'}
                                </p>
                            </div>
                            <Button
                                onClick={() => { setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: platforms[0]?.value || 'taobao', orderType: 'comprehensive', amount: '1' }); setIsKeywordModalOpen(true); }}
                                className="h-10 rounded-[14px] bg-primary-600 px-5 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/30"
                            >
                                + 添加关键词
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">关键词</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">平台分类</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">排序方式</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">卡位价格</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">数量</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {keywords.map(kw => (
                                            <tr key={kw.id} className="group transition-colors hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-slate-700">{kw.keyword}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold",
                                                        (kw.searchEngine === 'taobao' || kw.searchEngine === 'tmall') ? "bg-orange-50 text-orange-600" :
                                                            kw.searchEngine === 'jd' ? "bg-red-50 text-red-600" :
                                                                kw.searchEngine === 'pdd' ? "bg-emerald-50 text-emerald-600" :
                                                                    "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {getPlatformLabel(kw.searchEngine)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {kw.orderType === 'comprehensive' ? '综合排序' : kw.orderType === 'sales' ? '销量排序' : '价格排序'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm font-bold text-slate-700">
                                                        {kw.targetPrice ? `¥${kw.targetPrice}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                        {kw.amount}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <button
                                                            onClick={() => { setKeywordForm({ id: kw.id, keyword: kw.keyword, targetPrice: kw.targetPrice?.toString() || '', searchEngine: kw.searchEngine || platforms[0]?.value || 'taobao', orderType: kw.orderType, amount: kw.amount?.toString() || '1' }); setIsKeywordModalOpen(true); }}
                                                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-slate-200 hover:bg-primary-50 hover:ring-primary-100"
                                                        >
                                                            编辑
                                                        </button>
                                                        <button
                                                            onClick={() => deleteKeyword(kw.id)}
                                                            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm ring-1 ring-slate-200 hover:bg-red-50 hover:ring-red-100"
                                                        >
                                                            删除
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {keywords.length === 0 && (
                                <div className="flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl shadow-sm">🔍</div>
                                    <p className="mt-4 text-sm font-bold text-slate-400">暂无关键词配置</p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: platforms[0]?.value || 'taobao', orderType: 'comprehensive', amount: '1' }); setIsKeywordModalOpen(true); }}
                                        className="mt-2 font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        立即添加
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-300">
                        <div className="mb-4 text-6xl opacity-50">📋</div>
                        <p className="font-bold">请选择或创建一个方案</p>
                    </div>
                )}
            </Card>

            {/* Scheme Modal */}
            <Modal title={schemeForm.id ? '编辑方案' : '新建方案'} open={isSchemeModalOpen} onClose={() => setIsSchemeModalOpen(false)} className="rounded-[32px]">
                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">方案名称</label>
                        <Input
                            value={schemeForm.name}
                            onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })}
                            placeholder="给方案起个名字"
                            className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">方案描述</label>
                        <textarea
                            value={schemeForm.description}
                            onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })}
                            placeholder="写点备注 (选填)"
                            className="w-full resize-none rounded-[16px] border-none bg-slate-50 p-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none min-h-[100px]"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setIsSchemeModalOpen(false)}
                            className="h-11 rounded-[14px] border-none bg-slate-100 px-6 font-bold text-slate-600 hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleSchemeSubmit}
                            className="h-11 rounded-[14px] bg-primary-600 px-6 font-bold text-white hover:bg-primary-700"
                        >
                            确定
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Keyword Modal */}
            <Modal title={keywordForm.id ? '编辑关键词' : '添加关键词'} open={isKeywordModalOpen} onClose={() => setIsKeywordModalOpen(false)} className="w-[600px] rounded-[32px]">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="col-span-2">
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">搜索关键词</label>
                            <Input
                                value={keywordForm.keyword}
                                onChange={e => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                                placeholder="输入买家搜索用的关键词"
                                className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                        <div className="relative">
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">平台分类</label>
                            <Select
                                value={keywordForm.searchEngine}
                                onChange={v => setKeywordForm({ ...keywordForm, searchEngine: v })}
                                options={platforms}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                            <div className="pointer-events-none absolute right-4 top-[42px] -translate-y-1/2 text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                        <div className="relative">
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">排序方式</label>
                            <Select
                                value={keywordForm.orderType}
                                onChange={v => setKeywordForm({ ...keywordForm, orderType: v })}
                                options={[{ value: 'comprehensive', label: '综合排序' }, { value: 'sales', label: '销量排序' }, { value: 'price', label: '价格排序' }]}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                            <div className="pointer-events-none absolute right-4 top-[42px] -translate-y-1/2 text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">卡位价格 (选填)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                                <Input
                                    type="number"
                                    value={keywordForm.targetPrice}
                                    onChange={e => setKeywordForm({ ...keywordForm, targetPrice: e.target.value })}
                                    placeholder="0.00"
                                    className="h-12 rounded-[16px] border-none bg-slate-50 px-4 pl-8 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">数量</label>
                            <Input
                                type="number"
                                value={keywordForm.amount}
                                onChange={e => setKeywordForm({ ...keywordForm, amount: e.target.value })}
                                className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => setIsKeywordModalOpen(false)}
                            className="h-11 rounded-[14px] border-none bg-slate-100 px-6 font-bold text-slate-600 hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleKeywordSubmit}
                            className="h-11 rounded-[14px] bg-primary-600 px-6 font-bold text-white hover:bg-primary-700"
                        >
                            确定
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

