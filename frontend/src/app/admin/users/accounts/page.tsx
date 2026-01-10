'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';
import { Input } from '../../../../components/ui/input';
import { DateInput } from '../../../../components/ui/date-input';
import { PLATFORM_CONFIG, PLATFORM_NAME_MAP } from '../../../../constants/platformConfig';
import Image from 'next/image';

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
    loginProvince?: string;
    loginCity?: string;
    // 截图字段 - 不同平台使用不同的截图
    profileImg?: string;      // 账号主页截图
    creditImg?: string;       // 淘气值截图(淘宝/天猫)
    payAuthImg?: string;      // 支付宝实名截图/实名认证截图
    scoreImg?: string;        // 芝麻信用截图(淘宝/天猫)
    addressRemark?: string;
    star: number;
    status: number;
    rejectReason?: string;
    createdAt: string;
    freezeUntil?: string;
}

// 根据平台获取截图配置
const getPlatformImages = (platform: string) => {
    const platformId = PLATFORM_NAME_MAP[platform] || platform?.toLowerCase();
    const config = PLATFORM_CONFIG[platformId];
    if (config?.requiredImages) {
        return config.requiredImages;
    }
    // 默认返回通用配置
    return [
        { key: 'profileImg', label: '账号主页截图' },
        { key: 'payAuthImg', label: '实名认证截图' },
    ];
};

// 获取平台账号标签
const getAccountLabel = (platform: string): string => {
    const platformId = PLATFORM_NAME_MAP[platform] || platform?.toLowerCase();
    const config = PLATFORM_CONFIG[platformId];
    return config?.accountLabel || `${platform}账号`;
};

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '已通过', color: 'green' },
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
    const [userInfo, setUserInfo] = useState<{ username: string; phone: string } | null>(null);

    // 筛选条件
    const [filterUsername, setFilterUsername] = useState<string>('');
    const [filterPlatformAccount, setFilterPlatformAccount] = useState<string>('');
    const [filterPhone, setFilterPhone] = useState<string>('');
    const [filterAddress, setFilterAddress] = useState<string>('');
    const [filterRealName, setFilterRealName] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPlatform, setFilterPlatform] = useState<string>('');

    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
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
        loginProvince: '',
        loginCity: '',
        star: 1,
        status: 0,
        freezeUntil: '',
        remark: ''
    });

    const getToken = () => localStorage.getItem('adminToken');

    const loadAccounts = useCallback(async () => {
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
            if (filterRealName) params.append('realName', filterRealName);
            if (filterPlatform) params.append('platform', filterPlatform);

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
    }, [page, filterStatus, filterPlatform, userId, filterUsername, filterPhone, filterPlatformAccount, filterAddress, filterRealName]);

    // 加载用户信息（当有userId参数时）
    const loadUserInfo = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setUserInfo({ username: data.data.username, phone: data.data.phone });
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    }, [userId]);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);
    useEffect(() => { loadUserInfo(); }, [loadUserInfo]);

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
            if (data.success) { alert('审核通过'); loadAccounts(); setEditModal(null); }
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
            if (data.success) { alert('已拒绝'); setRejectingId(null); setRejectReason(''); loadAccounts(); setEditModal(null); }
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
            loginProvince: a.loginProvince || '',
            loginCity: a.loginCity || '',
            star: a.star || 1,
            status: a.status,
            freezeUntil: a.freezeUntil ? a.freezeUntil.split('T')[0] : '',
            remark: ''
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

    // 获取当前账号需要显示的截图列表
    const getDisplayImages = (account: BuyerAccount) => {
        const platformImages = getPlatformImages(account.platform);
        return platformImages.map(img => ({
            key: img.key,
            label: img.label,
            url: account[img.key as keyof BuyerAccount] as string | undefined
        }));
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
                                {userInfo ? (
                                    <>用户: {userInfo.username} ({userInfo.phone})</>
                                ) : (
                                    <>用户ID: {userId.slice(0, 8)}...</>
                                )}
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
                {/* 筛选栏 */}
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="用户名"
                        value={filterUsername}
                        onChange={e => setFilterUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-28"
                    />
                    <Input
                        placeholder="平台账号"
                        value={filterPlatformAccount}
                        onChange={e => setFilterPlatformAccount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-32"
                    />
                    <Input
                        placeholder="收货人手机"
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
                        placeholder="实名姓名"
                        value={filterRealName}
                        onChange={e => setFilterRealName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-28"
                    />
                    <Select
                        value={filterPlatform}
                        onChange={v => { setFilterPlatform(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部平台' },
                            { value: '淘宝', label: '淘宝' },
                            { value: '天猫', label: '天猫' },
                            { value: '京东', label: '京东' },
                            { value: '拼多多', label: '拼多多' },
                            { value: '抖音', label: '抖音' },
                            { value: '快手', label: '快手' },
                        ]}
                        className="w-28"
                    />
                    <Select
                        value={filterStatus}
                        onChange={v => { setFilterStatus(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: '0', label: '待审核' },
                            { value: '1', label: '已通过' },
                            { value: '2', label: '已拒绝' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                    <Button variant="secondary" onClick={loadAccounts}>刷新</Button>
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
                            <table className="min-w-[1200px] w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        {filterStatus === '0' && (
                                            <th className="w-[40px] px-2 py-3 text-center">
                                                <input type="checkbox" checked={allPendingSelected} onChange={e => handleSelectAll(e.target.checked)} className="cursor-pointer" />
                                            </th>
                                        )}
                                        <th className="w-[50px] px-2 py-3 text-center font-medium">序号</th>
                                        <th className="w-[70px] px-2 py-3 text-center font-medium">平台</th>
                                        <th className="w-[100px] px-2 py-3 text-left font-medium">平台账号</th>
                                        <th className="w-[80px] px-2 py-3 text-left font-medium">用户名</th>
                                        <th className="w-[80px] px-2 py-3 text-left font-medium">实名姓名</th>
                                        <th className="w-[100px] px-2 py-3 text-left font-medium">收货人</th>
                                        <th className="w-[150px] px-2 py-3 text-left font-medium">收货地址</th>
                                        <th className="w-[200px] px-2 py-3 text-center font-medium">资质截图</th>
                                        <th className="w-[70px] px-2 py-3 text-center font-medium">星级</th>
                                        <th className="w-[80px] px-2 py-3 text-center font-medium">状态</th>
                                        <th className="w-[160px] px-2 py-3 text-center font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((a, idx) => {
                                        const displayImages = getDisplayImages(a);
                                        return (
                                            <tr key={a.id} className="border-b border-[#f3f4f6] hover:bg-[#fafbfc]">
                                                {filterStatus === '0' && (
                                                    <td className="px-2 py-2 text-center">
                                                        {a.status === 0 && <input type="checkbox" checked={selectedIds.has(a.id)} onChange={e => handleSelectOne(a.id, e.target.checked)} className="cursor-pointer" />}
                                                    </td>
                                                )}
                                                <td className="px-2 py-2 text-center text-[#6b7280]">{(page - 1) * 20 + idx + 1}</td>
                                                <td className="px-2 py-2 text-center">
                                                    <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs">{a.platform}</span>
                                                </td>
                                                <td className="px-2 py-2 font-medium text-primary-600">{a.platformAccount}</td>
                                                <td className="px-2 py-2">{a.user?.username || '-'}</td>
                                                <td className="px-2 py-2">{a.realName || '-'}</td>
                                                <td className="px-2 py-2">
                                                    <div className="text-xs">{a.buyerName || '-'}</div>
                                                    <div className="text-xs text-[#9ca3af]">{a.buyerPhone || ''}</div>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="max-w-[150px] truncate text-xs" title={`${a.province || ''} ${a.city || ''} ${a.district || ''} ${a.fullAddress || ''}`}>
                                                        {a.province} {a.city} {a.district}
                                                    </div>
                                                    <div className="max-w-[150px] truncate text-xs text-[#9ca3af]">{a.fullAddress || ''}</div>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        {displayImages.slice(0, 2).map(img => (
                                                            img.url ? (
                                                                <Image
                                                                    key={img.key}
                                                                    src={img.url}
                                                                    alt={img.label}
                                                                    title={img.label}
                                                                    width={60}
                                                                    height={50}
                                                                    className="h-[50px] w-[60px] cursor-pointer rounded border border-[#e5e7eb] object-cover"
                                                                    onClick={() => setImageModal(img.url!)}
                                                                    unoptimized
                                                                />
                                                            ) : null
                                                        ))}
                                                        {displayImages.length > 2 && (
                                                            <div
                                                                className="flex h-[50px] w-[40px] cursor-pointer items-center justify-center rounded border border-dashed border-[#d1d5db] text-xs text-[#9ca3af]"
                                                                onClick={() => openEditModal(a)}
                                                            >
                                                                +{displayImages.length - 2}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
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
                                        );
                                    })}
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

            {/* Edit Modal - 动态适配不同平台 */}
            <Modal title={`审核 | 编辑买号 (${editModal?.platform || ''})`} open={editModal !== null} onClose={() => setEditModal(null)} className="max-w-3xl">
                {editModal && (
                    <div className="space-y-5">
                        {/* 平台和账号信息 */}
                        <div className="rounded bg-[#f9fafb] p-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">平台：</span><span className="font-medium">{editModal.platform}</span></div>
                                <div><span className="text-[#9ca3af]">用户：</span>{editModal.user?.username || '-'}</div>
                            </div>
                        </div>

                        {/* 基本信息编辑 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">{getAccountLabel(editModal.platform)}</label>
                                <Input value={editForm.platformAccount} onChange={e => setEditForm({...editForm, platformAccount: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">实名姓名</label>
                                <Input value={editForm.realName} onChange={e => setEditForm({...editForm, realName: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">收货人</label>
                                <Input value={editForm.buyerName} onChange={e => setEditForm({...editForm, buyerName: e.target.value})} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">收货人手机</label>
                                <Input value={editForm.buyerPhone} onChange={e => setEditForm({...editForm, buyerPhone: e.target.value})} />
                            </div>
                        </div>

                        {/* 常用登录地 - 淘宝/天猫需要 */}
                        {(editModal.platform === '淘宝' || editModal.platform === '天猫') && (
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">常用登录地</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="省" value={editForm.loginProvince} onChange={e => setEditForm({...editForm, loginProvince: e.target.value})} />
                                    <Input placeholder="市" value={editForm.loginCity} onChange={e => setEditForm({...editForm, loginCity: e.target.value})} />
                                </div>
                            </div>
                        )}

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
                                <label className="mb-1 block text-sm text-[#6b7280]">冻结到期时间</label>
                                <DateInput value={editForm.freezeUntil} onChange={e => setEditForm({...editForm, freezeUntil: e.target.value})} />
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
                                <option value={0}>待审核</option>
                                <option value={1}>已通过</option>
                                <option value={2}>已拒绝</option>
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

                        {/* 图片预览 - 根据平台动态显示 */}
                        <div>
                            <label className="mb-2 block text-sm text-[#6b7280]">资质截图 ({editModal.platform})</label>
                            <div className="flex flex-wrap gap-3">
                                {getDisplayImages(editModal).map(img => (
                                    img.url ? (
                                        <div key={img.key} className="text-center">
                                            <Image
                                                src={img.url}
                                                alt={img.label}
                                                width={130}
                                                height={100}
                                                className="h-[100px] w-[130px] cursor-pointer rounded border object-cover"
                                                onClick={() => setImageModal(img.url!)}
                                                unoptimized
                                            />
                                            <div className="mt-1 text-xs text-[#6b7280]">{img.label}</div>
                                        </div>
                                    ) : (
                                        <div key={img.key} className="text-center">
                                            <div className="flex h-[100px] w-[130px] items-center justify-center rounded border border-dashed border-[#d1d5db] text-xs text-[#9ca3af]">
                                                未上传
                                            </div>
                                            <div className="mt-1 text-xs text-[#6b7280]">{img.label}</div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* 拒绝原因显示 */}
                        {editModal.rejectReason && (
                            <div className="rounded border border-red-200 bg-red-50 p-3">
                                <span className="font-medium text-danger-400">拒绝原因：</span>
                                <span className="text-danger-400">{editModal.rejectReason}</span>
                            </div>
                        )}

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

            {/* Image Preview */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80">
                    <Image src={imageModal} alt="预览" width={800} height={600} className="max-h-[90%] max-w-[90%] object-contain" unoptimized />
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
