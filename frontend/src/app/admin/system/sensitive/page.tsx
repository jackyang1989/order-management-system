'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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
            // 模拟数据
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
        const styles: Record<number, { bg: string; color: string; text: string }> = {
            1: { bg: '#e6f7ff', color: '#1890ff', text: '低' },
            2: { bg: '#fff7e6', color: '#fa8c16', text: '中' },
            3: { bg: '#fff2f0', color: '#ff4d4f', text: '高' },
        };
        const style = styles[level] || styles[1];
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                background: style.bg,
                color: style.color
            }}>
                {style.text}
            </span>
        );
    };

    const getCategoryLabel = (category: string) => {
        return categories.find(c => c.value === category)?.label || category;
    };

    return (
        <div>
            {/* 页面标题 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>敏感词管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理系统敏感词过滤规则
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowBatchModal(true)}
                        style={{
                            padding: '10px 24px',
                            background: '#52c41a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        批量导入
                    </button>
                    <button
                        onClick={() => {
                            setEditingWord(null);
                            setFormData({ word: '', category: 'general', level: 1, isActive: true });
                            setShowModal(true);
                        }}
                        style={{
                            padding: '10px 24px',
                            background: '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        + 添加敏感词
                    </button>
                </div>
            </div>

            {/* 筛选区域 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="搜索敏感词..."
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        width: '240px',
                        fontSize: '14px'
                    }}
                />
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        fontSize: '14px'
                    }}
                >
                    <option value="">全部分类</option>
                    {categories.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
            </div>

            {/* 统计卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        {words.length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>敏感词总数</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                        {words.filter(w => w.isActive).length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>启用中</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#faad14' }}>
                        {words.filter(w => !w.isActive).length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>已禁用</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff4d4f' }}>
                        {words.filter(w => w.level === 3).length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>高危词汇</div>
                </div>
            </div>

            {/* 敏感词列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: '500',
                    fontSize: '15px'
                }}>
                    敏感词列表 ({filteredWords.length})
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : filteredWords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                        <div>暂无敏感词</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>敏感词</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>分类</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>风险等级</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>创建时间</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWords.map(word => (
                                <tr key={word.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{word.word}</td>
                                    <td style={{ padding: '16px' }}>{getCategoryLabel(word.category)}</td>
                                    <td style={{ padding: '16px' }}>{getLevelBadge(word.level)}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            background: word.isActive ? '#f6ffed' : '#f5f5f5',
                                            color: word.isActive ? '#52c41a' : '#999'
                                        }}>
                                            {word.isActive ? '启用' : '禁用'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
                                        {new Date(word.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleToggleActive(word)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: word.isActive ? '#fff7e6' : '#f6ffed',
                                                    border: `1px solid ${word.isActive ? '#ffd591' : '#b7eb8f'}`,
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: word.isActive ? '#d48806' : '#52c41a'
                                                }}
                                            >
                                                {word.isActive ? '禁用' : '启用'}
                                            </button>
                                            <button
                                                onClick={() => openEdit(word)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                编辑
                                            </button>
                                            <button
                                                onClick={() => handleDelete(word.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #ff4d4f',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: '#ff4d4f'
                                                }}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 添加/编辑弹窗 */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '480px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px' }}>
                            {editingWord ? '编辑敏感词' : '添加敏感词'}
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>敏感词</label>
                            <input
                                type="text"
                                value={formData.word}
                                onChange={e => setFormData({ ...formData, word: e.target.value })}
                                placeholder="请输入敏感词"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>分类</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                {categories.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>风险等级</label>
                            <select
                                value={formData.level}
                                onChange={e => setFormData({ ...formData, level: Number(e.target.value) })}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            >
                                <option value={1}>低</option>
                                <option value={2}>中</option>
                                <option value={3}>高</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                启用该敏感词
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                style={{
                                    padding: '10px 24px',
                                    background: '#1890ff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 批量导入弹窗 */}
            {showBatchModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        width: '560px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px' }}>批量导入敏感词</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                敏感词列表（每行一个）
                            </label>
                            <textarea
                                value={batchInput}
                                onChange={e => setBatchInput(e.target.value)}
                                placeholder="请输入敏感词，每行一个..."
                                rows={10}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowBatchModal(false)}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleBatchImport}
                                style={{
                                    padding: '10px 24px',
                                    background: '#52c41a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                }}
                            >
                                导入
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
