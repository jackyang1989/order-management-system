'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

interface SensitiveWord {
    id: string;
    word: string;
    category: string;
    level: number;
    isActive: boolean;
    createdAt: string;
}

export default function SensitiveWordsPage() {
    const [words, setWords] = useState<SensitiveWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingWord, setEditingWord] = useState<SensitiveWord | null>(null);
    const [formData, setFormData] = useState({
        word: '',
        category: 'general',
        level: 1,
        isActive: true
    });
    const [batchInput, setBatchInput] = useState('');
    const [showBatchModal, setShowBatchModal] = useState(false);

    const categories = [
        { value: 'general', label: '通用' },
        { value: 'politics', label: '政治' },
        { value: 'violence', label: '暴力' },
        { value: 'fraud', label: '欺诈' },
        { value: 'ad', label: '广告' },
        { value: 'other', label: '其他' },
    ];

    useEffect(() => {
        loadWords();
    }, []);

    const loadWords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/sensitive-words/admin`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setWords(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            setWords([
                { id: '1', word: '测试敏感词1', category: 'general', level: 1, isActive: true, createdAt: new Date().toISOString() },
                { id: '2', word: '测试敏感词2', category: 'fraud', level: 2, isActive: true, createdAt: new Date().toISOString() },
                { id: '3', word: '广告词汇', category: 'ad', level: 1, isActive: false, createdAt: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingWord
                ? `${BASE_URL}/sensitive-words/admin/${editingWord.id}`
                : `${BASE_URL}/sensitive-words/admin`;
            const method = editingWord ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            setShowModal(false);
            setEditingWord(null);
            setFormData({ word: '', category: 'general', level: 1, isActive: true });
            loadWords();
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleBatchImport = async () => {
        if (!batchInput.trim()) {
            alert('请输入敏感词');
            return;
        }
        try {
            const token = localStorage.getItem('adminToken');
            const wordsToImport = batchInput.split('\n').filter(w => w.trim());
            await fetch(`${BASE_URL}/sensitive-words/admin/batch-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ words: wordsToImport }),
            });

            setShowBatchModal(false);
            setBatchInput('');
            loadWords();
            alert(`成功导入 ${wordsToImport.length} 个敏感词`);
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该敏感词？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/sensitive-words/admin/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadWords();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const handleToggleActive = async (word: SensitiveWord) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/sensitive-words/admin/${word.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...word, isActive: !word.isActive }),
            });
            loadWords();
        } catch (error) {
            console.error('更新失败:', error);
        }
    };

    const openEdit = (word: SensitiveWord) => {
        setEditingWord(word);
        setFormData({
            word: word.word,
            category: word.category,
            level: word.level,
            isActive: word.isActive
        });
        setShowModal(true);
    };

    const filteredWords = words.filter(w => {
        if (searchKeyword && !w.word.includes(searchKeyword)) return false;
        if (categoryFilter && w.category !== categoryFilter) return false;
        return true;
    });

    const getLevelBadge = (level: number) => {
        const variants: Record<number, { color: 'blue' | 'amber' | 'red'; text: string }> = {
            1: { color: 'blue', text: '低' },
            2: { color: 'amber', text: '中' },
            3: { color: 'red', text: '高' },
        };
        const variant = variants[level] || variants[1];
        return <Badge variant="soft" color={variant.color}>{variant.text}</Badge>;
    };

    const getCategoryLabel = (category: string) => {
        return categories.find(c => c.value === category)?.label || category;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">敏感词管理</h2>
                    <p className="mt-1 text-sm text-slate-500">管理系统敏感词过滤规则</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowBatchModal(true)}>
                        批量导入
                    </Button>
                    <Button onClick={() => {
                        setEditingWord(null);
                        setFormData({ word: '', category: 'general', level: 1, isActive: true });
                        setShowModal(true);
                    }}>
                        + 添加敏感词
                    </Button>
                </div>
            </div>

            {/* Filter Area */}
            <Card className="flex flex-wrap items-center gap-4 bg-white">
                <Input
                    placeholder="搜索敏感词..."
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    className="w-60"
                />
                <Select
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                        { value: '', label: '全部分类' },
                        ...categories.map(c => ({ value: c.value, label: c.label }))
                    ]}
                    className="w-32"
                />
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-blue-600">{words.length}</div>
                    <div className="mt-1 text-sm text-slate-500">敏感词总数</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-green-600">{words.filter(w => w.isActive).length}</div>
                    <div className="mt-1 text-sm text-slate-500">启用中</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-amber-500">{words.filter(w => !w.isActive).length}</div>
                    <div className="mt-1 text-sm text-slate-500">已禁用</div>
                </Card>
                <Card className="bg-white text-center">
                    <div className="text-3xl font-bold text-red-500">{words.filter(w => w.level === 3).length}</div>
                    <div className="mt-1 text-sm text-slate-500">高危词汇</div>
                </Card>
            </div>

            {/* Word List */}
            <Card className="overflow-hidden bg-white">
                <div className="border-b border-slate-100 px-6 py-4 text-sm font-medium">
                    敏感词列表 ({filteredWords.length})
                </div>
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : filteredWords.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="mb-4 text-5xl">🔍</div>
                        <div>暂无敏感词</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-4 text-left text-sm font-medium">敏感词</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">分类</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">风险等级</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">状态</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">创建时间</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWords.map(word => (
                                    <tr key={word.id} className="border-b border-slate-100">
                                        <td className="px-4 py-4 font-medium">{word.word}</td>
                                        <td className="px-4 py-4">{getCategoryLabel(word.category)}</td>
                                        <td className="px-4 py-4">{getLevelBadge(word.level)}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={word.isActive ? 'green' : 'slate'}>
                                                {word.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-500">
                                            {new Date(word.createdAt).toLocaleString('zh-CN')}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        word.isActive
                                                            ? 'border border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                            : 'border border-green-400 bg-green-50 text-green-600 hover:bg-green-100'
                                                    )}
                                                    onClick={() => handleToggleActive(word)}
                                                >
                                                    {word.isActive ? '禁用' : '启用'}
                                                </Button>
                                                <Button size="sm" variant="secondary" onClick={() => openEdit(word)}>
                                                    编辑
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(word.id)}>
                                                    删除
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={editingWord ? '编辑敏感词' : '添加敏感词'}
                open={showModal}
                onClose={() => setShowModal(false)}
            >
                <div className="space-y-4">
                    <Input
                        label="敏感词"
                        placeholder="请输入敏感词"
                        value={formData.word}
                        onChange={e => setFormData({ ...formData, word: e.target.value })}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">分类</label>
                        <Select
                            value={formData.category}
                            onChange={v => setFormData({ ...formData, category: v })}
                            options={categories.map(c => ({ value: c.value, label: c.label }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">风险等级</label>
                        <Select
                            value={String(formData.level)}
                            onChange={v => setFormData({ ...formData, level: Number(v) })}
                            options={[
                                { value: '1', label: '低' },
                                { value: '2', label: '中' },
                                { value: '3', label: '高' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm">启用该敏感词</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSubmit}>保存</Button>
                    </div>
                </div>
            </Modal>

            {/* Batch Import Modal */}
            <Modal
                title="批量导入敏感词"
                open={showBatchModal}
                onClose={() => setShowBatchModal(false)}
                className="max-w-lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            敏感词列表（每行一个）
                        </label>
                        <textarea
                            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={10}
                            placeholder="请输入敏感词，每行一个..."
                            value={batchInput}
                            onChange={e => setBatchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <Button variant="secondary" onClick={() => setShowBatchModal(false)}>取消</Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleBatchImport}>导入</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
