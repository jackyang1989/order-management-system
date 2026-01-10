'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';
import { Input } from '../../../../components/ui/input';

interface BuyerAccount {
    id: string;
    userId: string;
    user?: { username: string; phone: string };
    platform: string;
    platformAccount: string;
    province?: string;
    city?: string;
    district?: string;
    buyerName?: string;
    buyerPhone?: string;
    fullAddress?: string;
    realName?: string;
    idCardImage?: string;
    payAuthImg?: string;
    profileImg?: string;
    creditImg?: string;
    scoreImg?: string;
    loginProvince?: string;
    loginCity?: string;
    addressRemark?: string;
    star: number;
    status: number;
    rejectReason?: string;
    createdAt: string;
    freezeUntil?: string;
}

const platformNames: Record<string, string> = {
    '淘宝': '淘宝', '京东': '京东', '拼多多': '拼多多',
    '1': '淘宝', '2': '京东', '3': '拼多多',
};

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '未审核', color: 'amber' },
    1: { text: '审核通过', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已删除', color: 'slate' }
};

function AdminBuyerAccountsPageContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // 筛选条件 - 与原版一致
    const [filterUsername, setFilterUsername] = useState<string>('');
    const [filterPlatformAccount, setFilterPlatformAccount] = useState<string>('');
    const [filterPhone, setFilterPhone] = useState<string>('');
    const [filterAddress, setFilterAddress] = useState<string>('');
    const [filterAlipayName, setFilterAlipayName] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<BuyerAccount | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);

    // 编辑弹窗
    const [editModal, setEditModal] = useState<BuyerAccount | null>(null);
    const [editForm, setEditForm] = useState({
        platformAccount: '',
        realName: '',
        buyerName: '',
        buyerPhone: '',
        province: '',
        city: '',
        district: '',
        fullAddress: '',
        star: 1,
        status: 0,
        freezeUntil: '',
        remark: ''
    });

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => { loadAccounts(); }, [page, filterStatus, userId]);

    const loadAccounts = async () => {
        setLoading(true);
        setSelectedIds(new Set());
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');
            if (filterStatus) params.append('status', filterStatus);
            if (userId) params.append('userId', userId);
            if (filterUsername) params.append('username', filterUsername);
            if (filterPhone) params.append('phone', filterPhone);
            if (filterPlatformAccount) params.append('platformAccount', filterPlatformAccount);
            if (filterAddress) params.append('address', filterAddress);
            if (filterAlipayName) params.append('realName', filterAlipayName);

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

    const handleSearch = () => {
        setPage(1);
        loadAccounts();
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
            if (data.success) { alert('审核通过'); loadAccounts(); setDetailModal(null); setEditModal(null); }
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
            if (data.success) { alert('已拒绝'); setRejectingId(null); setRejectReason(''); loadAccounts(); setDetailModal(null); setEditModal(null); }
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

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该买号吗？此操作不可恢复！')) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) { alert('删除成功'); loadAccounts(); }
            else alert(data.message || '删除失败');
        } catch { alert('操作失败'); }
    };

    const openEditModal = (a: BuyerAccount) => {
        setEditForm({
            platformAccount: a.platformAccount || '',
            realName: a.realName || '',
            buyerName: a.buyerName || '',
            buyerPhone: a.buyerPhone || '',
            province: a.province || '',
            city: a.city || '',
            district: a.district || '',
            fullAddress: a.fullAddress || '',
            star: a.star || 1,
            status: a.status,
            freezeUntil: a.freezeUntil ? a.freezeUntil.split('T')[0] : '',
            remark: a.addressRemark || ''
        });
        setEditModal(a);
    };

    const handleSaveEdit = async () => {
        if (!editModal) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${editModal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                alert('保存成功');
                setEditModal(null);
                loadAccounts();
            } else {
                alert(data.message || '保存失败');
            }
        } catch { alert('操作失败'); }
    };

    const pendingAccounts = accounts.filter(a => a.status === 0);
    const allPendingSelected = pendingAccounts.length > 0 && pendingAccounts.every(a => selectedIds.has(a.id));

    const renderImageCell = (url: string | undefined, label: string) => {
        if (!url) return <span className="text-xs text-[#9ca3af]">-</span>;
        return (
            <img
                src={url}
                alt={label}
                className="h-[80px] w-[100px] cursor-pointer rounded border border-[#e5e7eb] object-cover"
                onClick={() => setImageModal(url)}
            />
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-white">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-medium">买号列表</span>
                        {userId && (
                            <span className="text-sm text-[#6b7280]">
                                (用户ID: {userId})
                            </span>
                        )}
                        <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                    </div>
                    <div className="flex gap-2">
                        {filterStatus === '0' && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
                {/* 筛选栏 - 与原版一致 */}
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="用户名"
                        value={filterUsername}
                        onChange={e => setFilterUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-28"
                    />
                    <Input
                        placeholder="旺旺号"
                        value={filterPlatformAccount}
                        onChange={e => setFilterPlatformAccount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-32"
                    />
                    <Input
                        placeholder="收货人手机号"
                        value={filterPhone}
                        onChange={e => setFilterPhone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-32"
                    />
                    <Input
                        placeholder="收货地址"
                        value={filterAddress}
                        onChange={e => setFilterAddress(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-36"
                    />
                    <Input
                        placeholder="支付宝姓名"
                        value={filterAlipayName}
                        onChange={e => setFilterAlipayName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-28"
                    />
                    <Select
                        value={filterStatus}
                        onChange={v => { setFilterStatus(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: '0', label: '未审核' },
                            { value: '1', label: '审核通过' },
                            { value: '2', label: '已禁用' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                    <Button variant="secondary" onClick={loadAccounts}>刷新</Button>
                </div>
            </Card>

            {/* Table - 与原版列一致 */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-10 text-center text-[#9ca3af]">加载中...</div>
                ) : accounts.length === 0 ? (
                    <div className="py-10 text-center text-[#9ca3af]">暂无数据</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1400px] w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        {filterStatus === '0' && (
                                            <th className="w-[40px] px-2 py-3 text-center">
                                                <input type="checkbox" checked={allPendingSelected} onChange={e => handleSelectAll(e.target.checked)} className="cursor-pointer" />
                                            </th>
                                        )}
                                        <th className="w-[50px] px-2 py-3 text-center font-medium">序号</th>
                                        <th className="w-[110px] px-2 py-3 text-left font-medium">收货人手机</th>
                                        <th className="w-[100px] px-2 py-3 text-left font-medium">旺旺号</th>
                                        <th className="w-[80px] px-2 py-3 text-left font-medium">用户名</th>
                                        <th className="w-[80px] px-2 py-3 text-left font-medium">支付宝姓名</th>
                                        <th className="w-[180px] px-2 py-3 text-left font-medium">收货地址</th>
                                        <th className="w-[110px] px-2 py-3 text-center font-medium">旺旺档案</th>
                                        <th className="w-[110px] px-2 py-3 text-center font-medium">淘气值</th>
                                        <th className="w-[110px] px-2 py-3 text-center font-medium">支付宝实名</th>
                                        <th className="w-[110px] px-2 py-3 text-center font-medium">芝麻信用</th>
                                        <th className="w-[70px] px-2 py-3 text-center font-medium">星级</th>
                                        <th className="w-[80px] px-2 py-3 text-center font-medium">状态</th>
                                        <th className="w-[160px] px-2 py-3 text-center font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((a, idx) => (
                                        <tr key={a.id} className="border-b border-[#f3f4f6] hover:bg-[#fafbfc]">
                                            {filterStatus === '0' && (
                                                <td className="px-2 py-2 text-center">
                                                    {a.status === 0 && <input type="checkbox" checked={selectedIds.has(a.id)} onChange={e => handleSelectOne(a.id, e.target.checked)} className="cursor-pointer" />}
                                                </td>
                                            )}
                                            <td className="px-2 py-2 text-center text-[#6b7280]">{(page - 1) * 20 + idx + 1}</td>
                                            <td className="px-2 py-2">{a.buyerPhone || '-'}</td>
                                            <td className="px-2 py-2 font-medium text-primary-600">{a.platformAccount}</td>
                                            <td className="px-2 py-2">{a.user?.username || '-'}</td>
                                            <td className="px-2 py-2">{a.realName || '-'}</td>
                                            <td className="px-2 py-2">
                                                <div className="max-w-[180px] truncate text-xs" title={`${a.province || ''} ${a.city || ''} ${a.district || ''} ${a.fullAddress || ''}`}>
                                                    {a.province} {a.city} {a.district}
                                                </div>
                                                <div className="max-w-[180px] truncate text-xs text-[#9ca3af]">{a.fullAddress || ''}</div>
                                            </td>
                                            <td className="px-2 py-2 text-center">{renderImageCell(a.profileImg, '旺旺档案')}</td>
                                            <td className="px-2 py-2 text-center">{renderImageCell(a.creditImg, '淘气值')}</td>
                                            <td className="px-2 py-2 text-center">{renderImageCell(a.payAuthImg, '支付宝实名')}</td>
                                            <td className="px-2 py-2 text-center">{renderImageCell(a.scoreImg || a.idCardImage, '芝麻信用')}</td>
                                            <td className="px-2 py-2 text-center">
                                                <select
                                                    value={a.star}
                                                    onChange={e => handleSetStar(a.id, parseInt(e.target.value))}
                                                    className="w-14 rounded border border-[#e5e7eb] px-1 py-0.5 text-xs"
                                                >
                                                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <Badge variant="soft" color={statusLabels[a.status]?.color}>{statusLabels[a.status]?.text}</Badge>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => openEditModal(a)}>审核</Button>
                                                    <Button size="sm" variant="outline" onClick={() => openEditModal(a)}>编辑</Button>
                                                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(a.id)}>删除</Button>
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

            {/* Edit Modal - 与原版一致的编辑弹窗 */}
            <Modal title="审核 | 编辑买号" open={editModal !== null} onClose={() => setEditModal(null)} className="max-w-3xl">
                {editModal && (
                    <div className="space-y-5">
                        {/* 基本信息编辑 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">旺旺ID</label>
                                <Input value={editForm.platformAccount} onChange={e => setEditForm({...editForm, platformAccount: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">支付宝姓名</label>
                                <Input value={editForm.realName} onChange={e => setEditForm({...editForm, realName: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">收件人</label>
                                <Input value={editForm.buyerName} onChange={e => setEditForm({...editForm, buyerName: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">手机号</label>
                                <Input value={editForm.buyerPhone} onChange={e => setEditForm({...editForm, buyerPhone: e.target.value})} />
                            </div>
                        </div>

                        {/* 地址编辑 */}
                        <div>
                            <label className="mb-1 block text-sm text-[#6b7280]">收货地址</label>
                            <div className="mb-2 grid grid-cols-3 gap-2">
                                <Input placeholder="省" value={editForm.province} onChange={e => setEditForm({...editForm, province: e.target.value})} />
                                <Input placeholder="市" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                                <Input placeholder="区" value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} />
                            </div>
                            <Input placeholder="详细地址" value={editForm.fullAddress} onChange={e => setEditForm({...editForm, fullAddress: e.target.value})} />
                        </div>

                        {/* 星级和冻结 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">星级</label>
                                <select
                                    value={editForm.star}
                                    onChange={e => setEditForm({...editForm, star: parseInt(e.target.value)})}
                                    className="w-full rounded border border-[#d1d5db] px-3 py-2"
                                >
                                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">冻结买号到期时间</label>
                                <Input type="date" value={editForm.freezeUntil} onChange={e => setEditForm({...editForm, freezeUntil: e.target.value})} />
                            </div>
                        </div>

                        {/* 审核状态 */}
                        <div>
                            <label className="mb-1 block text-sm text-[#6b7280]">审核状态</label>
                            <select
                                value={editForm.status}
                                onChange={e => setEditForm({...editForm, status: parseInt(e.target.value)})}
                                className="w-full rounded border border-[#d1d5db] px-3 py-2"
                            >
                                <option value={0}>未审核</option>
                                <option value={1}>审核通过</option>
                                <option value={2}>拒绝/禁用</option>
                            </select>
                        </div>

                        {/* 备注 */}
                        <div>
                            <label className="mb-1 block text-sm text-[#6b7280]">备注</label>
                            <textarea
                                value={editForm.remark}
                                onChange={e => setEditForm({...editForm, remark: e.target.value})}
                                placeholder="请输入备注..."
                                className="min-h-[60px] w-full resize-y rounded border border-[#d1d5db] p-2.5"
                            />
                        </div>

                        {/* 图片预览 */}
                        <div>
                            <label className="mb-2 block text-sm text-[#6b7280]">认证图片</label>
                            <div className="flex flex-wrap gap-3">
                                {editModal.profileImg && (
                                    <div className="text-center">
                                        <img src={editModal.profileImg} alt="旺旺档案" className="h-[100px] w-[130px] cursor-pointer rounded border object-cover" onClick={() => setImageModal(editModal.profileImg!)} />
                                        <div className="mt-1 text-xs text-[#6b7280]">旺旺档案</div>
                                    </div>
                                )}
                                {editModal.creditImg && (
                                    <div className="text-center">
                                        <img src={editModal.creditImg} alt="淘气值" className="h-[100px] w-[130px] cursor-pointer rounded border object-cover" onClick={() => setImageModal(editModal.creditImg!)} />
                                        <div className="mt-1 text-xs text-[#6b7280]">淘气值</div>
                                    </div>
                                )}
                                {editModal.payAuthImg && (
                                    <div className="text-center">
                                        <img src={editModal.payAuthImg} alt="支付宝实名" className="h-[100px] w-[130px] cursor-pointer rounded border object-cover" onClick={() => setImageModal(editModal.payAuthImg!)} />
                                        <div className="mt-1 text-xs text-[#6b7280]">支付宝实名</div>
                                    </div>
                                )}
                                {(editModal.scoreImg || editModal.idCardImage) && (
                                    <div className="text-center">
                                        <img src={editModal.scoreImg || editModal.idCardImage!} alt="芝麻信用" className="h-[100px] w-[130px] cursor-pointer rounded border object-cover" onClick={() => setImageModal((editModal.scoreImg || editModal.idCardImage)!)} />
                                        <div className="mt-1 text-xs text-[#6b7280]">芝麻信用</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setEditModal(null)}>取消</Button>
                            {editModal.status === 0 && (
                                <>
                                    <Button variant="destructive" onClick={() => { setRejectingId(editModal.id); setEditModal(null); }}>拒绝</Button>
                                    <Button className="bg-green-500 text-white hover:bg-success-400" onClick={() => handleApprove(editModal.id)}>通过审核</Button>
                                </>
                            )}
                            <Button onClick={handleSaveEdit}>保存修改</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Detail Modal */}
            <Modal title="买号详情" open={detailModal !== null} onClose={() => setDetailModal(null)} className="max-w-2xl">
                {detailModal && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">基本信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">买号：</span><span className="font-medium">{detailModal.platformAccount}</span></div>
                                <div><span className="text-[#9ca3af]">平台：</span>{platformNames[detailModal.platform] || detailModal.platform}</div>
                                <div><span className="text-[#9ca3af]">实名姓名：</span>{detailModal.realName || '-'}</div>
                                <div><span className="text-[#9ca3af]">星级：</span>{detailModal.star}星</div>
                                <div><span className="text-[#9ca3af]">状态：</span><Badge variant="soft" color={statusLabels[detailModal.status]?.color}>{statusLabels[detailModal.status]?.text}</Badge></div>
                                <div><span className="text-[#9ca3af]">提交时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                            </div>
                        </div>

                        {/* Receiver Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">收货信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">收货人：</span>{detailModal.buyerName || '-'}</div>
                                <div><span className="text-[#9ca3af]">手机号：</span>{detailModal.buyerPhone || '-'}</div>
                                <div><span className="text-[#9ca3af]">省份：</span>{detailModal.province || '-'}</div>
                                <div><span className="text-[#9ca3af]">城市：</span>{detailModal.city || '-'}</div>
                                <div className="col-span-2"><span className="text-[#9ca3af]">详细地址：</span>{detailModal.fullAddress || '-'}</div>
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

export default function AdminBuyerAccountsPage() {
    return (
        <Suspense fallback={<div className="py-10 text-center text-[#9ca3af]">加载中...</div>}>
            <AdminBuyerAccountsPageContent />
        </Suspense>
    );
}
