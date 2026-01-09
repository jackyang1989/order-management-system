'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

interface BuyerAccount {
    id: string;
    userId: string;
    user?: { username: string; phone: string };
    platform: string;
    accountName: string;
    province?: string;
    city?: string;
    district?: string;
    receiverName?: string;
    receiverPhone?: string;
    fullAddress?: string;
    alipayName?: string;
    idCardImage?: string;
    alipayImage?: string;
    archiveImage?: string;
    ipImage?: string;
    wangwangProvince?: string;
    wangwangCity?: string;
    addressRemark?: string;
    star: number;
    status: number;
    rejectReason?: string;
    createdAt: string;
}

const platformNames: Record<string, string> = {
    '淘宝': '淘宝', '京东': '京东', '拼多多': '拼多多',
    '1': '淘宝', '2': '京东', '3': '拼多多',
};

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '已通过', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已删除', color: 'slate' }
};

export default function AdminBuyerAccountsPage() {
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('0');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<BuyerAccount | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => { loadAccounts(); }, [page, filterStatus]);

    const loadAccounts = async () => {
        setLoading(true);
        setSelectedIds(new Set());
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');
            if (filterStatus) params.append('status', filterStatus);

            const res = await fetch(`${BASE_URL}/admin/buyer-accounts?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(data.data || []);
                setTotal(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / 20));
            }
        } catch (error) {
            console.error('获取买号列表失败:', error);
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        if (!confirm('确定要通过该买号吗？')) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ approved: true })
            });
            const data = await res.json();
            if (data.success) { alert('审核通过'); loadAccounts(); setDetailModal(null); }
            else alert(data.message);
        } catch { alert('操作失败'); }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) { alert('请输入拒绝理由'); return; }
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ approved: false, rejectReason })
            });
            const data = await res.json();
            if (data.success) { alert('已拒绝'); setRejectingId(null); setRejectReason(''); loadAccounts(); setDetailModal(null); }
            else alert(data.message);
        } catch { alert('操作失败'); }
    };

    const handleSetStar = async (id: string, star: number) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/star`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ star })
            });
            const data = await res.json();
            if (data.success) { alert('星级设置成功'); loadAccounts(); }
            else alert(data.message);
        } catch { alert('操作失败'); }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = accounts.filter(a => a.status === 0).map(a => a.id);
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

        const rejectReasonInput = approved ? '' : prompt('请输入拒绝原因（可选）：') || '';
        setBatchLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/batch-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify({ ids: Array.from(selectedIds), approved, rejectReason: rejectReasonInput })
            });
            const data = await res.json();
            if (data.success) { alert(data.message); loadAccounts(); }
            else alert(data.message || '操作失败');
        } catch { alert('操作失败'); }
        finally { setBatchLoading(false); }
    };

    const pendingAccounts = accounts.filter(a => a.status === 0);
    const allPendingSelected = pendingAccounts.length > 0 && pendingAccounts.every(a => selectedIds.has(a.id));

    const renderImageThumbnail = (url: string | undefined, label: string) => {
        if (!url) return null;
        return (
            <div className="text-center">
                <img src={url} alt={label} className="h-20 w-[120px] cursor-pointer rounded border border-[#e5e7eb] object-cover" onClick={() => setImageModal(url)} />
                <div className="mt-1 text-xs text-[#6b7280]">{label}</div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-medium">买号审核</span>
                        <Select
                            value={filterStatus}
                            onChange={v => { setFilterStatus(v); setPage(1); }}
                            options={[
                                { value: '', label: '全部状态' },
                                { value: '0', label: '待审核' },
                                { value: '1', label: '已通过' },
                                { value: '2', label: '已拒绝' },
                            ]}
                            className="w-32"
                        />
                    </div>
                    {filterStatus === '0' && (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleBatchReview(true)}
                                disabled={batchLoading || selectedIds.size === 0}
                                className={cn('bg-green-500 text-white hover:bg-success-400', selectedIds.size === 0 && 'cursor-not-allowed opacity-50')}
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
                        </div>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-10 text-center text-[#9ca3af]">加载中...</div>
                ) : accounts.length === 0 ? (
                    <div className="py-10 text-center text-[#9ca3af]">暂无数据</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        {filterStatus === '0' && (
                                            <th className="w-[50px] px-4 py-3.5 text-center text-sm font-medium">
                                                <input type="checkbox" checked={allPendingSelected} onChange={e => handleSelectAll(e.target.checked)} className="cursor-pointer" />
                                            </th>
                                        )}
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">买号</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">平台</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">收货信息</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">星级</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">提交时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(a => (
                                        <tr key={a.id} className="border-b border-[#f3f4f6]">
                                            {filterStatus === '0' && (
                                                <td className="px-4 py-3.5 text-center">
                                                    {a.status === 0 && <input type="checkbox" checked={selectedIds.has(a.id)} onChange={e => handleSelectOne(a.id, e.target.checked)} className="cursor-pointer" />}
                                                </td>
                                            )}
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-primary-600">{a.accountName}</div>
                                                {a.alipayName && <div className="text-xs text-[#9ca3af]">支付宝: {a.alipayName}</div>}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs">{platformNames[a.platform] || a.platform || '未知'}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-sm">{a.receiverName} {a.receiverPhone}</div>
                                                <div className="text-xs text-[#9ca3af]">{a.province} {a.city}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <select
                                                    value={a.star}
                                                    onChange={e => handleSetStar(a.id, parseInt(e.target.value))}
                                                    className="rounded border border-[#e5e7eb] px-2 py-1 text-xs"
                                                >
                                                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={statusLabels[a.status]?.color}>{statusLabels[a.status]?.text}</Badge>
                                                {a.rejectReason && <div className="mt-1 text-[11px] text-danger-400">{a.rejectReason}</div>}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{new Date(a.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex flex-wrap justify-center gap-1.5">
                                                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(a)}>查看</Button>
                                                    {a.status === 0 && (
                                                        <>
                                                            <Button size="sm" className="bg-green-500 text-white hover:bg-success-400" onClick={() => handleApprove(a.id)}>通过</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => setRejectingId(a.id)}>拒绝</Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 p-4">
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn(page === 1 && 'cursor-not-allowed opacity-50')}>上一页</Button>
                                <span className="px-4 text-sm text-[#6b7280]">{page} / {totalPages} (共 {total} 条)</span>
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={cn(page === totalPages && 'cursor-not-allowed opacity-50')}>下一页</Button>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Detail Modal */}
            <Modal title="买号详情" open={detailModal !== null} onClose={() => setDetailModal(null)} className="max-w-2xl">
                {detailModal && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">基本信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">买号：</span><span className="font-medium">{detailModal.accountName}</span></div>
                                <div><span className="text-[#9ca3af]">平台：</span>{platformNames[detailModal.platform] || detailModal.platform}</div>
                                <div><span className="text-[#9ca3af]">支付宝姓名：</span>{detailModal.alipayName || '-'}</div>
                                <div><span className="text-[#9ca3af]">星级：</span>{detailModal.star}星</div>
                                <div><span className="text-[#9ca3af]">状态：</span><Badge variant="soft" color={statusLabels[detailModal.status]?.color}>{statusLabels[detailModal.status]?.text}</Badge></div>
                                <div><span className="text-[#9ca3af]">提交时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                            </div>
                        </div>

                        {/* Receiver Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">收货信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">收货人：</span>{detailModal.receiverName || '-'}</div>
                                <div><span className="text-[#9ca3af]">手机号：</span>{detailModal.receiverPhone || '-'}</div>
                                <div><span className="text-[#9ca3af]">省份：</span>{detailModal.province || '-'}</div>
                                <div><span className="text-[#9ca3af]">城市：</span>{detailModal.city || '-'}</div>
                                <div className="col-span-2"><span className="text-[#9ca3af]">详细地址：</span>{detailModal.fullAddress || '-'}</div>
                            </div>
                        </div>

                        {/* Wangwang Info */}
                        {(detailModal.wangwangProvince || detailModal.wangwangCity || detailModal.addressRemark) && (
                            <div>
                                <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">常用登录地</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-[#9ca3af]">登录省份：</span>{detailModal.wangwangProvince || '-'}</div>
                                    <div><span className="text-[#9ca3af]">登录城市：</span>{detailModal.wangwangCity || '-'}</div>
                                    {detailModal.addressRemark && <div className="col-span-2"><span className="text-[#9ca3af]">地址备注：</span>{detailModal.addressRemark}</div>}
                                </div>
                            </div>
                        )}

                        {/* Images */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">认证图片</h4>
                            <div className="flex flex-wrap gap-4">
                                {renderImageThumbnail(detailModal.idCardImage, '身份证截图')}
                                {renderImageThumbnail(detailModal.alipayImage, '支付宝实名截图')}
                                {renderImageThumbnail(detailModal.archiveImage, '账号主页截图')}
                                {renderImageThumbnail(detailModal.ipImage, '淘气值截图')}
                                {!detailModal.idCardImage && !detailModal.alipayImage && !detailModal.archiveImage && !detailModal.ipImage && (
                                    <div className="p-5 text-[#9ca3af]">暂无认证图片</div>
                                )}
                            </div>
                        </div>

                        {/* Reject Reason */}
                        {detailModal.rejectReason && (
                            <div className="rounded border border-red-200 bg-red-50 p-3">
                                <span className="font-medium text-danger-400">拒绝原因：</span>
                                <span className="text-danger-400">{detailModal.rejectReason}</span>
                            </div>
                        )}

                        {/* Actions */}
                        {detailModal.status === 0 && (
                            <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                                <Button variant="destructive" onClick={() => { setRejectingId(detailModal.id); setDetailModal(null); }}>拒绝</Button>
                                <Button className="bg-green-500 text-white hover:bg-success-400" onClick={() => handleApprove(detailModal.id)}>通过审核</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Image Preview */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80">
                    <img src={imageModal} alt="预览" className="max-h-[90%] max-w-[90%] object-contain" />
                </div>
            )}

            {/* Reject Modal */}
            <Modal title="拒绝买号" open={rejectingId !== null} onClose={() => { setRejectingId(null); setRejectReason(''); }} className="max-w-sm">
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">拒绝理由</label>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="请输入拒绝理由..."
                            className="min-h-[80px] w-full resize-y rounded border border-[#d1d5db] p-2.5"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setRejectingId(null); setRejectReason(''); }}>取消</Button>
                        <Button variant="destructive" onClick={() => rejectingId && handleReject(rejectingId)}>确认拒绝</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
