'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface BlacklistItem {
    id: string;
    sellerId: string;
    accountName: string;
    type: number;
    status: number;
    endTime: string | null;
    reason: string;
    adminRemark: string;
    createdAt: string;
    seller?: {
        id: string;
        merchantName: string;
        phone: string;
    };
}

const typeLabels: Record<number, { text: string; color: string }> = {
    0: { text: '永久拉黑', color: '#ff4d4f' },
    1: { text: '限时拉黑', color: '#faad14' },
};

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: '#faad14' },
    1: { text: '已通过', color: '#52c41a' },
    2: { text: '已拒绝', color: '#ff4d4f' },
};

export default function AdminBlacklistPage() {
    const [items, setItems] = useState<BlacklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        loadItems();
    }, [filter, page]);

    const loadItems = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedIds(new Set());
        try {
            let url = `${BASE_URL}/admin/blacklist?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            if (search) url += `&accountName=${encodeURIComponent(search)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setItems(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id: string, approved: boolean) => {
        const token = localStorage.getItem('adminToken');
        const adminRemark = approved ? '' : prompt('请输入拒绝原因：') || '';
        try {
            const res = await fetch(`${BASE_URL}/admin/blacklist/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ approved, adminRemark })
            });
            const json = await res.json();
            if (json.success) {
                alert(approved ? '已通过' : '已拒绝');
                loadItems();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该黑名单记录？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/blacklist/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                alert('删除成功');
                loadItems();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = items.filter(i => i.status === 0).map(i => i.id);
            setSelectedIds(new Set(pendingIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleBatchReview = async (approved: boolean) => {
        if (selectedIds.size === 0) {
            alert('请先选择要操作的记录');
            return;
        }
        const action = approved ? '批量通过' : '批量拒绝';
        if (!confirm(`确定要${action}选中的 ${selectedIds.size} 条记录吗？`)) return;

        const adminRemark = approved ? '' : prompt('请输入拒绝原因（可选）：') || '';
        const token = localStorage.getItem('adminToken');
        setBatchLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/blacklist/batch-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ids: Array.from(selectedIds), approved, adminRemark })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                loadItems();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        } finally {
            setBatchLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadItems();
    };

    const filteredItems = items;
    const allPendingSelected = filteredItems.filter(i => i.status === 0).length > 0 &&
        filteredItems.filter(i => i.status === 0).every(i => selectedIds.has(i.id));

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>状态筛选：</span>
                    {[
                        { label: '全部', value: undefined },
                        { label: '待审核', value: 0 },
                        { label: '已通过', value: 1 },
                        { label: '已拒绝', value: 2 },
                    ].map(item => (
                        <button key={String(item.value)} onClick={() => { setFilter(item.value); setPage(1); }} style={{ padding: '6px 16px', borderRadius: '4px', border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9', background: filter === item.value ? '#e6f7ff' : '#fff', color: filter === item.value ? '#1890ff' : '#666', cursor: 'pointer' }}>
                            {item.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="搜索买号账号..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', width: '200px' }}
                    />
                    <button onClick={handleSearch} style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', background: '#1890ff', color: '#fff', cursor: 'pointer' }}>
                        搜索
                    </button>
                </div>
            </div>

            {/* 批量操作栏 */}
            {filter === 0 && (
                <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>批量操作：</span>
                    <button
                        onClick={() => handleBatchReview(true)}
                        disabled={batchLoading || selectedIds.size === 0}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '4px',
                            border: 'none',
                            background: selectedIds.size === 0 ? '#d9d9d9' : '#52c41a',
                            color: '#fff',
                            cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {batchLoading ? '处理中...' : `批量通过 (${selectedIds.size})`}
                    </button>
                    <button
                        onClick={() => handleBatchReview(false)}
                        disabled={batchLoading || selectedIds.size === 0}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '4px',
                            border: '1px solid #ff4d4f',
                            background: selectedIds.size === 0 ? '#f5f5f5' : '#fff',
                            color: selectedIds.size === 0 ? '#999' : '#ff4d4f',
                            cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        批量拒绝
                    </button>
                </div>
            )}

            {/* 列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : items.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无黑名单记录</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    {filter === 0 && (
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0', width: '50px' }}>
                                            <input
                                                type="checkbox"
                                                checked={allPendingSelected}
                                                onChange={e => handleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                    )}
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>买号账号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>商家</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>原因</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>到期时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        {filter === 0 && (
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                {item.status === 0 && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.id)}
                                                        onChange={e => handleSelectOne(item.id, e.target.checked)}
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.accountName}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>
                                            {item.seller?.merchantName || '-'}
                                            {item.seller?.phone && <div style={{ fontSize: '12px', color: '#999' }}>{item.seller.phone}</div>}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (typeLabels[item.type]?.color || '#999') + '20', color: typeLabels[item.type]?.color || '#999' }}>
                                                {typeLabels[item.type]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[item.status]?.color || '#999') + '20', color: statusLabels[item.status]?.color || '#999' }}>
                                                {statusLabels[item.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.reason || '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>
                                            {item.type === 1 && item.endTime ? new Date(item.endTime).toLocaleString('zh-CN') : '-'}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>
                                            {new Date(item.createdAt).toLocaleString('zh-CN')}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {item.status === 0 && (
                                                    <>
                                                        <button onClick={() => handleReview(item.id, true)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>通过</button>
                                                        <button onClick={() => handleReview(item.id, false)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '13px' }}>拒绝</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDelete(item.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', color: '#666', cursor: 'pointer', fontSize: '13px' }}>删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#999' }}>共 {total} 条记录</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                                <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={items.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: items.length < 20 ? 'not-allowed' : 'pointer', opacity: items.length < 20 ? 0.5 : 1 }}>下一页</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
