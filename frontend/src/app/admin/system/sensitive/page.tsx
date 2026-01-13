'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
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
        <>
            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                <Card className="bg-white p-5 text-center">
                    <div className="text-2xl font-semibold text-primary-600">{words.length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">敏感词总数</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-2xl font-semibold text-success-400">{words.filter(w => w.isActive).length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">启用中</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-2xl font-semibold text-warning-400">{words.filter(w => !w.isActive).length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">已禁用</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-2xl font-semibold text-danger-400">{words.filter(w => w.level === 3).length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">高危词汇</div>
                </Card>
            </div>

            {/* Main Card */}
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">敏感词管理</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6b7280]">共 {filteredWords.length} 条记录</span>
                        <Button className="bg-success-400 hover:bg-success-500" onClick={() => setShowBatchModal(true)}>
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

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索敏感词..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="w-52"
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
                </div>

                <div className="overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                    ) : filteredWords.length === 0 ? (
                        <div className="py-12 text-center text-[#9ca3af]">暂无敏感词</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[800px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">敏感词</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">分类</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">风险等级</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWords.map(word => (
                                        <tr key={word.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-3.5 font-medium">{word.word}</td>
                                            <td className="px-4 py-3.5">{getCategoryLabel(word.category)}</td>
                                            <td className="px-4 py-3.5">{getLevelBadge(word.level)}</td>
                                            <td className="px-4 py-3.5">
                                                <Badge variant="soft" color={word.isActive ? 'green' : 'slate'}>
                                                    {word.isActive ? '启用' : '禁用'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#6b7280]">
                                                {new Date(word.createdAt).toLocaleString('zh-CN')}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
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
                </div>
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
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">分类</label>
                        <Select
                            value={formData.category}
                            onChange={v => setFormData({ ...formData, category: v })}
                            options={categories.map(c => ({ value: c.value, label: c.label }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">风险等级</label>
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
                                className="h-4 w-4 rounded border-[#d1d5db]"
                            />
                            <span className="text-sm">启用该敏感词</span>
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
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
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                            敏感词列表（每行一个）
                        </label>
                        <textarea
                            className="w-full resize-y rounded-md border border-[#d1d5db] px-3 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={10}
                            placeholder="请输入敏感词，每行一个..."
                            value={batchInput}
                            onChange={e => setBatchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowBatchModal(false)}>取消</Button>
                        <Button className="bg-success-400 hover:bg-success-500" onClick={handleBatchImport}>导入</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
