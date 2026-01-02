'use client';

import { useState, useEffect } from 'react';
import MerchantLayout from '../layout';
import { BASE_URL } from '../../../../apiConfig';

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
    searchEngine: string; // 'taobao', 'jd', 'pdd'
    orderType: string; // 'comprehensive', 'sales', 'price'
    amount: number; // Quantity
}

export default function KeywordsPage() {
    const [schemes, setSchemes] = useState<KeywordScheme[]>([]);
    const [selectedScheme, setSelectedScheme] = useState<KeywordScheme | null>(null);
    const [keywords, setKeywords] = useState<KeywordDetail[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
    const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);

    // Forms
    const [schemeForm, setSchemeForm] = useState({ id: '', name: '', description: '' });
    const [keywordForm, setKeywordForm] = useState({
        id: '',
        keyword: '',
        targetPrice: '',
        searchEngine: 'taobao',
        orderType: 'comprehensive',
        amount: '1'
    });

    useEffect(() => {
        fetchSchemes();
    }, []);

    useEffect(() => {
        if (selectedScheme) {
            fetchKeywords(selectedScheme.id);
        } else {
            setKeywords([]);
        }
    }, [selectedScheme]);

    const fetchSchemes = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setSchemes(json.data);
                if (json.data.length > 0 && !selectedScheme) {
                    setSelectedScheme(json.data[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKeywords = async (schemeId: string) => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes/${schemeId}/details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setKeywords(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch keywords:', error);
        }
    };

    // Scheme Operations
    const handleSchemeSubmit = async () => {
        if (!schemeForm.name) return alert('请输入方案名称');

        try {
            const token = localStorage.getItem('merchantToken');
            const url = schemeForm.id
                ? `${BASE_URL}/keywords/schemes/${schemeForm.id}`
                : `${BASE_URL}/keywords/schemes`;
            const method = schemeForm.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: schemeForm.name, description: schemeForm.description })
            });

            const json = await res.json();
            if (json.success) {
                fetchSchemes();
                setIsSchemeModalOpen(false);
                setSchemeForm({ id: '', name: '', description: '' });
            } else {
                alert(json.message);
            }
        } catch (error) {
            console.error('Scheme Op Failed:', error);
        }
    };

    const deleteScheme = async (id: string) => {
        if (!confirm('确定删除该方案及其所有关键词吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            await fetch(`${BASE_URL}/keywords/schemes/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSchemes();
            if (selectedScheme?.id === id) setSelectedScheme(null);
        } catch (error) {
            console.error('Delete Scheme Failed:', error);
        }
    };

    // Keyword Operations
    const handleKeywordSubmit = async () => {
        if (!selectedScheme) return;
        if (!keywordForm.keyword) return alert('请输入关键词');

        try {
            const token = localStorage.getItem('merchantToken');
            const url = keywordForm.id
                ? `${BASE_URL}/keywords/details/${keywordForm.id}`
                : `${BASE_URL}/keywords/schemes/${selectedScheme.id}/details`;
            const method = keywordForm.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    keyword: keywordForm.keyword,
                    targetPrice: Number(keywordForm.targetPrice),
                    searchEngine: keywordForm.searchEngine,
                    orderType: keywordForm.orderType,
                    amount: Number(keywordForm.amount)
                })
            });

            const json = await res.json();
            if (json.success) {
                fetchKeywords(selectedScheme.id);
                setIsKeywordModalOpen(false);
                setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: 'taobao', orderType: 'comprehensive', amount: '1' });
            } else {
                alert(json.message);
            }
        } catch (error) {
            console.error('Keyword Op Failed:', error);
        }
    };

    const deleteKeyword = async (id: string) => {
        if (!confirm('确定删除该关键词吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            await fetch(`${BASE_URL}/keywords/details/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedScheme) fetchKeywords(selectedScheme.id);
        } catch (error) {
            console.error('Delete Keyword Failed:', error);
        }
    };

    return (
        <MerchantLayout>
            <div style={{ padding: '24px', display: 'flex', gap: '24px', height: 'calc(100vh - 100px)' }}>
                {/* Left: Schemes List */}
                <div style={{ width: '300px', background: '#fff', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>关键词方案</h2>
                        <button
                            onClick={() => { setSchemeForm({ id: '', name: '', description: '' }); setIsSchemeModalOpen(true); }}
                            style={{ color: '#1890ff', border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}
                        >
                            +
                        </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {schemes.map(scheme => (
                            <div
                                key={scheme.id}
                                onClick={() => setSelectedScheme(scheme)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '6px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    background: selectedScheme?.id === scheme.id ? '#e6f7ff' : '#f5f5f5',
                                    border: selectedScheme?.id === scheme.id ? '1px solid #1890ff' : '1px solid transparent',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '500' }}>{scheme.name}</div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>{scheme.description || '无描述'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSchemeForm(scheme); setIsSchemeModalOpen(true); }}
                                        style={{ color: '#1890ff', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        编辑
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteScheme(scheme.id); }}
                                        style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Keywords List */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    {selectedScheme ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedScheme.name} - 关键词列表</h2>
                                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>管理该方案下的所有搜索关键词配置</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setKeywordForm({ id: '', keyword: '', targetPrice: '', searchEngine: 'taobao', orderType: 'comprehensive', amount: '1' });
                                        setIsKeywordModalOpen(true);
                                    }}
                                    style={{ padding: '8px 16px', background: '#1890ff', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                >
                                    + 添加关键词
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>关键词</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>搜索引擎</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>排序方式</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>卡不到价格</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>数量</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {keywords.map(kw => (
                                            <tr key={kw.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '12px' }}>{kw.keyword}</td>
                                                <td style={{ padding: '12px' }}>
                                                    {kw.searchEngine === 'taobao' ? '淘宝/天猫' : kw.searchEngine === 'jd' ? '京东' : '拼多多'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {kw.orderType === 'comprehensive' ? '综合排序' : kw.orderType === 'sales' ? '销量排序' : '价格排序'}
                                                </td>
                                                <td style={{ padding: '12px' }}>{kw.targetPrice || '-'}</td>
                                                <td style={{ padding: '12px' }}>{kw.amount}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <button
                                                        onClick={() => {
                                                            setKeywordForm({
                                                                id: kw.id,
                                                                keyword: kw.keyword,
                                                                targetPrice: kw.targetPrice?.toString() || '',
                                                                searchEngine: kw.searchEngine,
                                                                orderType: kw.orderType,
                                                                amount: kw.amount.toString()
                                                            });
                                                            setIsKeywordModalOpen(true);
                                                        }}
                                                        style={{ color: '#1890ff', border: 'none', background: 'none', cursor: 'pointer', marginRight: '8px' }}
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => deleteKeyword(kw.id)}
                                                        style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}
                                                    >
                                                        删除
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {keywords.length === 0 && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>暂无关键词，请点击右上角添加</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                            请先在左侧选择或创建一个方案
                        </div>
                    )}
                </div>

                {/* Scheme Modal */}
                {isSchemeModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '400px' }}>
                            <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>{schemeForm.id ? '编辑方案' : '新建方案'}</h3>
                            <input
                                value={schemeForm.name}
                                onChange={e => setSchemeForm({ ...schemeForm, name: e.target.value })}
                                placeholder="方案名称"
                                style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                            />
                            <textarea
                                value={schemeForm.description}
                                onChange={e => setSchemeForm({ ...schemeForm, description: e.target.value })}
                                placeholder="方案描述 (选填)"
                                style={{ width: '100%', padding: '8px', marginBottom: '20px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box', height: '80px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setIsSchemeModalOpen(false)} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>取消</button>
                                <button onClick={handleSchemeSubmit} style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: '#1890ff', color: '#fff', cursor: 'pointer' }}>确定</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Keyword Modal */}
                {isKeywordModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '500px' }}>
                            <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>{keywordForm.id ? '编辑关键词' : '添加关键词'}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>关键词</label>
                                    <input
                                        value={keywordForm.keyword}
                                        onChange={e => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>搜索引擎</label>
                                    <select
                                        value={keywordForm.searchEngine}
                                        onChange={e => setKeywordForm({ ...keywordForm, searchEngine: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                    >
                                        <option value="taobao">淘宝/天猫</option>
                                        <option value="jd">京东</option>
                                        <option value="pdd">拼多多</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>排序方式</label>
                                    <select
                                        value={keywordForm.orderType}
                                        onChange={e => setKeywordForm({ ...keywordForm, orderType: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                    >
                                        <option value="comprehensive">综合排序</option>
                                        <option value="sales">销量排序</option>
                                        <option value="price">价格排序</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>卡不到价格 (选填)</label>
                                    <input
                                        type="number"
                                        value={keywordForm.targetPrice}
                                        onChange={e => setKeywordForm({ ...keywordForm, targetPrice: e.target.value })}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>数量</label>
                                    <input
                                        type="number"
                                        value={keywordForm.amount}
                                        onChange={e => setKeywordForm({ ...keywordForm, amount: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button onClick={() => setIsKeywordModalOpen(false)} style={{ padding: '6px 16px', borderRadius: '4px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>取消</button>
                                <button onClick={handleKeywordSubmit} style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: '#1890ff', color: '#fff', cursor: 'pointer' }}>确定</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MerchantLayout>
    );
}
