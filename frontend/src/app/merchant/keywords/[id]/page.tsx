'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    fetchKeywordSchemeById,
    fetchKeywordDetails,
    addKeywordDetail,
    updateKeywordDetail,
    deleteKeywordDetail,
    updateKeywordScheme,
    GoodsKey,
    KeywordDetail,
    KeywordTerminal,
    KeywordPlatform,
    platformNames,
    terminalNames,
    CreateKeywordDetailDto
} from '../../../../services/keywordService';

export default function KeywordDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [scheme, setScheme] = useState<GoodsKey | null>(null);
    const [details, setDetails] = useState<KeywordDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDetail, setEditingDetail] = useState<KeywordDetail | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<CreateKeywordDetailDto>({
        keyword: '',
        terminal: KeywordTerminal.PC,
        filter: '',
        sort: '',
        maxPrice: 0,
        minPrice: 0,
        province: ''
    });

    useEffect(() => {
        loadData();
    }, [resolvedParams.id]);

    const loadData = async () => {
        setLoading(true);
        const [schemeData, detailsData] = await Promise.all([
            fetchKeywordSchemeById(resolvedParams.id),
            fetchKeywordDetails(resolvedParams.id)
        ]);
        setScheme(schemeData);
        setDetails(detailsData);
        setLoading(false);
    };

    const resetForm = () => {
        setForm({
            keyword: '',
            terminal: KeywordTerminal.PC,
            filter: '',
            sort: '',
            maxPrice: 0,
            minPrice: 0,
            province: ''
        });
    };

    const handleAdd = () => {
        resetForm();
        setEditingDetail(null);
        setShowAddModal(true);
    };

    const handleEdit = (detail: KeywordDetail) => {
        setForm({
            keyword: detail.keyword,
            terminal: detail.terminal,
            filter: detail.filter || '',
            sort: detail.sort || '',
            maxPrice: detail.maxPrice || 0,
            minPrice: detail.minPrice || 0,
            province: detail.province || ''
        });
        setEditingDetail(detail);
        setShowAddModal(true);
    };

    const handleDelete = async (detailId: string) => {
        if (!confirm('确定要删除该关键词吗？')) return;
        const res = await deleteKeywordDetail(detailId);
        if (res.success) {
            alert('删除成功');
            loadData();
        } else {
            alert(res.message);
        }
    };

    const handleSubmit = async () => {
        if (!form.keyword.trim()) {
            alert('请输入关键词');
            return;
        }

        setSubmitting(true);

        let res;
        if (editingDetail) {
            res = await updateKeywordDetail(editingDetail.id, form);
        } else {
            res = await addKeywordDetail(resolvedParams.id, form);
        }

        setSubmitting(false);

        if (res.success) {
            alert(editingDetail ? '更新成功' : '添加成功');
            setShowAddModal(false);
            resetForm();
            setEditingDetail(null);
            loadData();
        } else {
            alert(res.message);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        fontSize: '14px'
    };

    if (loading) {
        return <div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>;
    }

    if (!scheme) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>方案不存在</div>
                <button onClick={() => router.back()} style={{ color: '#1890ff' }}>返回</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => router.push('/merchant/keywords')}
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: '14px' }}
                >
                    ← 返回方案列表
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '8px' }}>{scheme.name}</h1>
                    <span style={{
                        padding: '4px 8px',
                        background: scheme.platform === KeywordPlatform.TAOBAO ? '#ff6600' :
                            scheme.platform === KeywordPlatform.TMALL ? '#e60012' : '#1890ff',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }}>
                        {platformNames[scheme.platform as KeywordPlatform] || '淘宝'}
                    </span>
                </div>
                <button
                    onClick={handleAdd}
                    style={{
                        padding: '10px 20px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + 添加关键词
                </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
                {details.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        <div style={{ marginBottom: '16px' }}>暂无关键词</div>
                        <button onClick={handleAdd} style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                            立即添加
                        </button>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>关键词</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>终端</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>价格区间</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>筛选条件</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>发货地</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {details.map(detail => (
                                <tr key={detail.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{detail.keyword}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            background: detail.terminal === KeywordTerminal.PC ? '#e6f7ff' : '#f6ffed',
                                            color: detail.terminal === KeywordTerminal.PC ? '#1890ff' : '#52c41a',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {terminalNames[detail.terminal as KeywordTerminal] || '电脑端'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {detail.minPrice || detail.maxPrice ? (
                                            <span>¥{detail.minPrice} - ¥{detail.maxPrice}</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>不限</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {detail.filter || detail.sort ? (
                                            <span>{detail.filter} {detail.sort}</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px' }}>{detail.province || '-'}</td>
                                    <td style={{ padding: '16px' }}>
                                        <button
                                            onClick={() => handleEdit(detail)}
                                            style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => handleDelete(detail.id)}
                                            style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 添加/编辑弹窗 */}
            {showAddModal && (
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
                        borderRadius: '8px',
                        padding: '24px',
                        width: '500px',
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>{editingDetail ? '编辑关键词' : '添加关键词'}</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>关键词 <span style={{ color: '#ff4d4f' }}>*</span></label>
                                <input
                                    type="text"
                                    value={form.keyword}
                                    onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                                    placeholder="请输入搜索关键词"
                                    style={inputStyle}
                                    maxLength={100}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>终端类型</label>
                                <select
                                    value={form.terminal}
                                    onChange={(e) => setForm({ ...form, terminal: Number(e.target.value) })}
                                    style={inputStyle}
                                >
                                    <option value={KeywordTerminal.PC}>电脑端</option>
                                    <option value={KeywordTerminal.MOBILE}>手机端</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>最低价格</label>
                                    <input
                                        type="number"
                                        value={form.minPrice}
                                        onChange={(e) => setForm({ ...form, minPrice: Number(e.target.value) })}
                                        placeholder="0"
                                        style={inputStyle}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>最高价格</label>
                                    <input
                                        type="number"
                                        value={form.maxPrice}
                                        onChange={(e) => setForm({ ...form, maxPrice: Number(e.target.value) })}
                                        placeholder="0"
                                        style={inputStyle}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>筛选分类</label>
                                <input
                                    type="text"
                                    value={form.filter}
                                    onChange={(e) => setForm({ ...form, filter: e.target.value })}
                                    placeholder="如：女装"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>排序方式</label>
                                <input
                                    type="text"
                                    value={form.sort}
                                    onChange={(e) => setForm({ ...form, sort: e.target.value })}
                                    placeholder="如：销量排序"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>发货地</label>
                                <input
                                    type="text"
                                    value={form.province}
                                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                                    placeholder="如：浙江"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => { setShowAddModal(false); resetForm(); setEditingDetail(null); }}
                                style={{
                                    padding: '10px 24px',
                                    background: '#fff',
                                    color: '#666',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    padding: '10px 24px',
                                    background: submitting ? '#ccc' : '#1890ff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: submitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
