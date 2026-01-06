'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';

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
    seller?: { id: string; merchantName: string; phone: string };
}

const typeLabels: Record<number, { text: string; color: 'red' | 'amber' }> = {
    0: { text: '永久拉黑', color: 'red' },
    1: { text: '限时拉黑', color: 'amber' },
};

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '已通过', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
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

    useEffect(() => { loadItems(); }, [filter, page]);

    const loadItems = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedIds(new Set());
        try {
            let url = `${BASE_URL}/admin/blacklist?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            if (search) url += `&accountName=${encodeURIComponent(search)}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { setItems(json.data || []); setTotal(json.total || 0); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
            if (json.success) { alert(approved ? '已通过' : '已拒绝'); loadItems(); }
            else alert(json.message || '操作失败');
        } catch { alert('操作失败'); }
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
            if (json.success) { alert('删除成功'); loadItems(); }
            else alert(json.message || '操作失败');
        } catch { alert('操作失败'); }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = items.filter(i => i.status === 0).map(i => i.id);
            setSelectedIds(new Set(pendingIds));
        } else setSelectedIds(new Set());
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id); else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleBatchReview = async (approved: boolean) => {
        if (selectedIds.size === 0) { alert('请先选择要操作的记录'); return; }
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
            if (json.success) { alert(json.message); loadItems(); }
            else alert(json.message || '操作失败');
        } catch { alert('操作失败'); }
        finally { setBatchLoading(false); }
    };

    const handleSearch = () => { setPage(1); loadItems(); };
    const allPendingSelected = items.filter(i => i.status === 0).length > 0 && items.filter(i => i.status === 0).every(i => selectedIds.has(i.id));

    const filterButtons = [
        { label: '全部', value: undefined },
        { label: '待审核', value: 0 },
        { label: '已通过', value: 1 },
        { label: '已拒绝', value: 2 },
    ];

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <Card className="flex flex-wrap items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3">
                    <span className="text-slate-500">状态筛选：</span>
                    {filterButtons.map(item => (
                        <button
                            key={String(item.value)}
                            onClick={() => { setFilter(item.value); setPage(1); }}
                            className={cn(
                                'cursor-pointer rounded border px-4 py-1.5 text-sm',
                                filter === item.value ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500'
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="搜索买号账号..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-52"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                </div>
            </Card>

            {/* Batch Actions */}
            {filter === 0 && (
                <Card className="flex items-center gap-3 bg-white">
                    <span className="text-slate-500">批量操作：</span>
                    <Button
                        onClick={() => handleBatchReview(true)}
                        disabled={batchLoading || selectedIds.size === 0}
                        className={cn('bg-green-500 hover:bg-green-600', selectedIds.size === 0 && 'cursor-not-allowed opacity-50')}
                    >
                        {batchLoading ? '处理中...' : `批量通过 (${selectedIds.size})`}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleBatchReview(false)}
                        disabled={batchLoading || selectedIds.size === 0}
                        className={cn(selectedIds.size === 0 && 'cursor-not-allowed opacity-50')}
                    >
                        批量拒绝
                    </Button>
                </Card>
            )}

            {/* Table */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : items.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">暂无黑名单记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        {filter === 0 && (
                                            <th className="w-[50px] px-4 py-3.5 text-center text-sm font-medium">
                                                <input type="checkbox" checked={allPendingSelected} onChange={e => handleSelectAll(e.target.checked)} />
                                            </th>
                                        )}
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">买号账号</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">商家</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">类型</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">原因</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">到期时间</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            {filter === 0 && (
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.status === 0 && <input type="checkbox" checked={selectedIds.has(item.id)} onChange={e => handleSelectOne(item.id, e.target.checked)} />}
                                                </td>
                                            )}
                                            <td className="px-4 py-3.5 font-medium">{item.accountName}</td>
                                            <td className="px-4 py-3.5 text-slate-500">
                                                {item.seller?.merchantName || '-'}
                                                {item.seller?.phone && <div className="text-xs text-slate-400">{item.seller.phone}</div>}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={typeLabels[item.type]?.color || 'slate'}>{typeLabels[item.type]?.text || '未知'}</Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={statusLabels[item.status]?.color || 'slate'}>{statusLabels[item.status]?.text || '未知'}</Badge>
                                            </td>
                                            <td className="max-w-[200px] truncate px-4 py-3.5 text-slate-500">{item.reason || '-'}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">{item.type === 1 && item.endTime ? new Date(item.endTime).toLocaleString('zh-CN') : '-'}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    {item.status === 0 && (
                                                        <>
                                                            <Button size="sm" className="bg-green-500 text-white hover:bg-green-600" onClick={() => handleReview(item.id, true)}>通过</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleReview(item.id, false)}>拒绝</Button>
                                                        </>
                                                    )}
                                                    <Button size="sm" variant="secondary" onClick={() => handleDelete(item.id)}>删除</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 p-4">
                            <span className="text-slate-400">共 {total} 条记录</span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn(page === 1 && 'cursor-not-allowed opacity-50')}>上一页</Button>
                                <span className="px-3 text-sm text-slate-500">第 {page} 页</span>
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={items.length < 20} className={cn(items.length < 20 && 'cursor-not-allowed opacity-50')}>下一页</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
