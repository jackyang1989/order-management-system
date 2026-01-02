'use client';

import { useState, useEffect } from 'react';
import {
    fetchBlacklist,
    addBlacklist,
    deleteBlacklist,
    MerchantBlacklist,
    BlacklistType,
    CreateBlacklistDto
} from '../../../services/blacklistService';

export default function MerchantBlacklistPage() {
    const [blacklist, setBlacklist] = useState<MerchantBlacklist[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<CreateBlacklistDto>({
        accountName: '',
        type: BlacklistType.PERMANENT,
        endTime: '',
        reason: ''
    });

    const totalPages = Math.ceil(total / 20);

    useEffect(() => {
        loadBlacklist();
    }, [page]);

    const loadBlacklist = async () => {
        setLoading(true);
        const result = await fetchBlacklist({
            accountName: searchText || undefined,
            page,
            limit: 20
        });
        setBlacklist(result.data);
        setTotal(result.total);
        setLoading(false);
    };

    const handleSearch = () => {
        setPage(1);
        loadBlacklist();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要移除该账号吗？')) return;
        const res = await deleteBlacklist(id);
        if (res.success) {
            alert('移除成功');
            loadBlacklist();
        } else {
            alert(res.message);
        }
    };

    const handleAdd = async () => {
        if (!form.accountName.trim()) {
            alert('请输入买号账号');
            return;
        }
        if (form.type === BlacklistType.TEMPORARY && !form.endTime) {
            alert('限时拉黑请选择结束时间');
            return;
        }

        setSubmitting(true);
        const res = await addBlacklist(form);
        setSubmitting(false);

        if (res.success) {
            alert('添加成功');
            setShowAddModal(false);
            setForm({
                accountName: '',
                type: BlacklistType.PERMANENT,
                endTime: '',
                reason: ''
            });
            loadBlacklist();
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

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '500' }}>黑名单管理</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        padding: '10px 20px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + 添加黑名单
                </button>
            </div>

            {/* 搜索 */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索账号名..."
                    style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', width: '200px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    style={{ padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    搜索
                </button>
            </div>

            {/* 列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
                ) : blacklist.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        暂无黑名单记录
                    </div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>买号账号</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>结束时间</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>原因</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>添加时间</th>
                                    <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blacklist.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '16px', fontWeight: '500' }}>{item.accountName}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                background: item.type === BlacklistType.PERMANENT ? '#ff4d4f' : '#faad14',
                                                color: '#fff',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {item.type === BlacklistType.PERMANENT ? '永久拉黑' : '限时拉黑'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#999' }}>
                                            {item.type === BlacklistType.TEMPORARY && item.endTime
                                                ? new Date(item.endTime).toLocaleString()
                                                : '-'}
                                        </td>
                                        <td style={{ padding: '16px' }}>{item.reason || '-'}</td>
                                        <td style={{ padding: '16px', color: '#999' }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                移除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 分页 */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                                        background: page === 1 ? '#f5f5f5' : '#fff'
                                    }}
                                >
                                    上一页
                                </button>
                                <span style={{ padding: '0 16px' }}>
                                    {page} / {totalPages} (共 {total} 条)
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                        background: page === totalPages ? '#f5f5f5' : '#fff'
                                    }}
                                >
                                    下一页
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 添加弹窗 */}
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
                        width: '450px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>添加黑名单</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>买号账号 <span style={{ color: '#ff4d4f' }}>*</span></label>
                                <input
                                    type="text"
                                    value={form.accountName}
                                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                                    placeholder="请输入旺旺号/淘宝账号"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>拉黑类型</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: parseInt(e.target.value) })}
                                    style={inputStyle}
                                >
                                    <option value={BlacklistType.PERMANENT}>永久拉黑</option>
                                    <option value={BlacklistType.TEMPORARY}>限时拉黑</option>
                                </select>
                            </div>

                            {form.type === BlacklistType.TEMPORARY && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>结束时间 <span style={{ color: '#ff4d4f' }}>*</span></label>
                                    <input
                                        type="datetime-local"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>拉黑原因</label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder="可选填写拉黑原因"
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setForm({ accountName: '', type: BlacklistType.PERMANENT, endTime: '', reason: '' });
                                }}
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
                                onClick={handleAdd}
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
                                {submitting ? '添加中...' : '确定添加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
