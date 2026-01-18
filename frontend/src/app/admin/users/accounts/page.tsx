'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
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
import { EnhancedTable, EnhancedColumn } from '../../../../components/ui/enhanced-table';
import { ColumnSettingsPanel, ColumnConfig, ColumnMeta } from '../../../../components/ui/column-settings-panel';
import { useTablePreferences } from '../../../../hooks/useTablePreferences';
import Image from 'next/image';

interface BuyerAccount {
    id: string;
    userId: string;
    user?: { userNo: string; phone: string };
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
    remark?: string;          // 管理员备注
    star: number;
    status: number;
    rejectReason?: string;
    createdAt: string;
    frozenTime?: string;
    // 用户买号统计（前端扩展字段）
    userAccountStats?: { platform: string; count: number }[];
}

// 根据平台获取截图配置
const getPlatformImages = (platform: string) => {
    const platformId = PLATFORM_NAME_MAP[platform] || platform?.toLowerCase();
    const config = PLATFORM_CONFIG[platformId];
    // 检查数组长度，空数组也应该使用默认配置
    if (config?.requiredImages && config.requiredImages.length > 0) {
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
    const [userInfo, setUserInfo] = useState<{ userNo: string; phone: string } | null>(null);

    // 筛选条件 - 合并为统一搜索
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPlatform, setFilterPlatform] = useState<string>('');

    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
    const [imageModal, setImageModal] = useState<string | null>(null);

    // 备注弹窗状态
    const [remarkModal, setRemarkModal] = useState<{ accountId: string; platformAccount: string; currentRemark: string } | null>(null);
    const [remarkText, setRemarkText] = useState('');

    // 列设置面板状态
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // 用户买号统计
    const [userAccountStats, setUserAccountStats] = useState<{ platform: string; count: number }[]>([]);

    // 默认列配置
    const defaultColumns: ColumnConfig[] = useMemo(() => [
        { key: 'index', visible: true, width: 50, order: 0 },
        { key: 'platform', visible: true, width: 70, order: 1 },
        { key: 'platformAccount', visible: true, width: 120, order: 2 },
        { key: 'userNo', visible: true, width: 80, order: 3 },
        { key: 'realName', visible: true, width: 80, order: 4 },
        { key: 'images', visible: true, width: 200, order: 5 },
        { key: 'star', visible: true, width: 70, order: 6 },
        { key: 'status', visible: true, width: 80, order: 7 },
        { key: 'actions', visible: true, width: 200, order: 8 },
    ], []);

    // 列配置 Hook
    const { columnConfig, savePreferences, resetPreferences, updateLocalConfig } = useTablePreferences({
        tableKey: 'admin_buyer_accounts',
        defaultColumns,
    });

    // 列元信息 (用于列设置面板)
    const columnMeta: ColumnMeta[] = useMemo(() => [
        { key: 'index', title: '序号' },
        { key: 'platform', title: '平台' },
        { key: 'platformAccount', title: '平台账号' },
        { key: 'userNo', title: '用户ID' },
        { key: 'realName', title: '实名姓名' },
        { key: 'images', title: '资质截图' },
        { key: 'star', title: '星级' },
        { key: 'status', title: '状态' },
        { key: 'actions', title: '操作' },
    ], []);

    // 编辑弹窗
    const [editModal, setEditModal] = useState<BuyerAccount | null>(null);
    const [editForm, setEditForm] = useState({
        platformAccount: '',
        realName: '',
        star: 1,
        status: 0,
        frozenTime: '',
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
            if (searchKeyword) params.append('keyword', searchKeyword);
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
    }, [page, filterStatus, filterPlatform, userId, searchKeyword]);

    // 加载用户信息（当有userId参数时）
    const loadUserInfo = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success && data.data) {
                setUserInfo({ userNo: data.data.userNo, phone: data.data.phone });
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    }, [userId]);

    // 平台选项
    const [platformOptions, setPlatformOptions] = useState<{ label: string; value: string }[]>([
        { value: '', label: '全部平台' }
    ]);

    // 加载平台选项
    const loadPlatformOptions = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/platforms?activeOnly=true`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                const options = data.data.map((p: any) => ({
                    label: p.name,
                    value: p.name // 保持使用名称筛选，与后端原有逻辑一致
                }));
                setPlatformOptions([{ value: '', label: '全部平台' }, ...options]);
            }
        } catch (error) {
            console.error('获取平台列表失败:', error);
        }
    }, []);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);
    useEffect(() => { loadUserInfo(); }, [loadUserInfo]);
    useEffect(() => { loadPlatformOptions(); }, [loadPlatformOptions]);

    // 加载用户买号统计
    const loadUserAccountStats = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/user/${userId}/stats`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setUserAccountStats(data.data || []);
            }
        } catch (error) {
            console.error('获取用户买号统计失败:', error);
            setUserAccountStats([]);
        }
    }, []);

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

    const handleSetStar = useCallback(async (id: string, star: number) => {
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
    }, [loadAccounts]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = accounts.filter(a => a.status === 0).map(a => a.id);
            setSelectedIds(new Set(pendingIds));
        } else setSelectedIds(new Set());
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

    const handleDelete = useCallback(async (id: string) => {
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
    }, [loadAccounts]);

    // 保存备注
    const handleUpdateRemark = useCallback(async () => {
        if (!remarkModal) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${remarkModal.accountId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ remark: remarkText })
            });
            const data = await res.json();
            if (data.success) {
                alert('备注已更新');
                setRemarkModal(null);
                setRemarkText('');
                loadAccounts();
            } else {
                alert(data.message || '操作失败');
            }
        } catch {
            alert('操作失败');
        }
    }, [remarkModal, remarkText, loadAccounts]);

    const openEditModal = useCallback((a: BuyerAccount) => {
        setEditForm({
            platformAccount: a.platformAccount || '',
            realName: a.realName || '',
            star: a.star || 1,
            status: a.status,
            frozenTime: a.frozenTime ? a.frozenTime.split('T')[0] : '',
            remark: ''
        });
        setEditModal(a);

        // 加载该用户的买号统计
        if (a.userId) {
            loadUserAccountStats(a.userId);
        }
    }, []);

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
    const getDisplayImages = useCallback((account: BuyerAccount) => {
        const platformImages = getPlatformImages(account.platform);
        return platformImages.map(img => ({
            key: img.key,
            label: img.label,
            url: account[img.key as keyof BuyerAccount] as string | undefined
        }));
    }, []);

    // EnhancedTable 列定义
    const columns: EnhancedColumn<BuyerAccount>[] = useMemo(() => [
        {
            key: 'index',
            title: '序号',
            defaultWidth: 50,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (_, idx) => <span className="text-[#6b7280]">{(page - 1) * 20 + idx + 1}</span>
        },
        {
            key: 'platform',
            title: '平台',
            defaultWidth: 70,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (row) => <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-xs">{row.platform}</span>
        },
        {
            key: 'platformAccount',
            title: '平台账号',
            defaultWidth: 120,
            render: (row) => <span className="font-medium text-primary-600">{row.platformAccount}</span>
        },
        {
            key: 'userNo',
            title: '用户ID',
            defaultWidth: 80,
            render: (row) => <span>{row.user?.userNo || '-'}</span>
        },
        {
            key: 'realName',
            title: '实名姓名',
            defaultWidth: 80,
            render: (row) => <span>{row.realName || '-'}</span>
        },
        {
            key: 'images',
            title: '资质截图',
            defaultWidth: 120,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (row) => {
                const displayImages = getDisplayImages(row);
                return (
                    <div className="flex flex-nowrap gap-1 justify-center">
                        {displayImages.slice(0, 2).map(img => (
                            img.url ? (
                                <Image
                                    key={img.key}
                                    src={img.url}
                                    alt={img.label}
                                    title={img.label}
                                    width={36}
                                    height={36}
                                    className="h-9 w-9 cursor-pointer rounded border border-[#e5e7eb] object-cover"
                                    onClick={() => setImageModal(img.url!)}
                                    unoptimized
                                />
                            ) : null
                        ))}
                        {displayImages.length > 2 && (
                            <div
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-dashed border-[#d1d5db] text-xs text-[#9ca3af]"
                                onClick={() => openEditModal(row)}
                            >
                                +{displayImages.length - 2}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'star',
            title: '星级',
            defaultWidth: 70,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (row) => (
                <select
                    value={row.star}
                    onChange={e => handleSetStar(row.id, parseInt(e.target.value))}
                    className="w-14 rounded border border-[#e5e7eb] px-1 py-0.5 text-xs"
                >
                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                </select>
            )
        },
        {
            key: 'status',
            title: '状态',
            defaultWidth: 100,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (row) => {
                const isFrozen = row.frozenTime && new Date(row.frozenTime) > new Date();
                const frozenDate = row.frozenTime ? new Date(row.frozenTime) : null;

                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <Badge variant="soft" color={statusLabels[row.status]?.color}>{statusLabels[row.status]?.text}</Badge>
                        {isFrozen && frozenDate && (
                            <div className="flex items-center gap-1 text-[10px] text-orange-600" title={`解冻时间: ${frozenDate.toLocaleString('zh-CN')}`}>
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>{frozenDate.getMonth() + 1}/{frozenDate.getDate()}</span>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'actions',
            title: '操作',
            defaultWidth: 280,
            headerClassName: 'text-center',
            cellClassName: 'text-center',
            render: (row) => (
                <div className="flex flex-nowrap gap-1">
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => openEditModal(row)}>审核</Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => openEditModal(row)}>编辑</Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap text-red-500" onClick={() => handleDelete(row.id)}>删除</Button>
                </div>
            )
        },
    ], [page, getDisplayImages, handleSetStar, openEditModal, handleDelete, setImageModal]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-medium">买号列表</span>
                        {userId && (
                            <span className="text-sm text-[#6b7280]">
                                {userInfo ? (
                                    <>用户ID: {userInfo.userNo}</>
                                ) : (
                                    <>用户ID: {userId}</>
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
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索用户ID/平台账号/收货人/手机/地址/姓名..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-96"
                    />
                    <Select
                        value={filterPlatform}
                        onChange={v => { setFilterPlatform(v); setPage(1); }}
                        options={platformOptions}
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

                {/* Table */}
                <div className="overflow-hidden">
                    {filterStatus === '0' && accounts.length > 0 && (
                        <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-4 py-2 bg-[#f9fafb]">
                            <input
                                type="checkbox"
                                checked={allPendingSelected}
                                onChange={e => handleSelectAll(e.target.checked)}
                                className="cursor-pointer h-4 w-4 rounded border-[#d1d5db]"
                            />
                            <span className="text-sm text-[#6b7280]">全选待审核</span>
                        </div>
                    )}
                    <EnhancedTable
                        columns={columns}
                        data={accounts}
                        rowKey={(r) => r.id}
                        loading={loading}
                        emptyText="暂无数据"
                        columnConfig={columnConfig}
                        onColumnConfigChange={updateLocalConfig}
                        onColumnSettingsClick={() => setShowColumnSettings(true)}
                        selectable={filterStatus === '0'}
                        selectedKeys={Array.from(selectedIds)}
                        onRowSelect={(keys) => setSelectedIds(new Set(keys.map(String)))}
                        getRowDisabled={(row) => row.status !== 0}
                    />
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4">
                            <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn(page === 1 && 'cursor-not-allowed opacity-50')}>上一页</Button>
                            <span className="px-4 text-sm text-[#6b7280]">{page} / {totalPages} (共 {total} 条)</span>
                            <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={cn(page === totalPages && 'cursor-not-allowed opacity-50')}>下一页</Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* 列设置面板 */}
            <ColumnSettingsPanel
                open={showColumnSettings}
                onClose={() => setShowColumnSettings(false)}
                columns={columnMeta}
                config={columnConfig}
                onSave={savePreferences}
                onReset={resetPreferences}
            />

            {/* Edit Modal - 动态适配不同平台 */}
            <Modal title={`审核 | 编辑买号 (${editModal?.platform || ''})`} open={editModal !== null} onClose={() => { setEditModal(null); setUserAccountStats([]); }} className="max-w-3xl">
                {editModal && (
                    <div className="space-y-5">
                        {/* 用户买号统计 */}
                        {userAccountStats.length > 0 && (
                            <div className="rounded bg-blue-50 border border-blue-200 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-blue-800">该用户已绑定买号统计</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {userAccountStats.map(stat => (
                                        <div key={stat.platform} className="flex items-center gap-1 bg-white rounded px-2 py-1 text-sm">
                                            <span className="font-medium text-gray-700">{stat.platform}:</span>
                                            <span className="font-semibold text-blue-600">{stat.count}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-1 bg-blue-100 rounded px-2 py-1 text-sm">
                                        <span className="font-medium text-blue-700">总计:</span>
                                        <span className="font-semibold text-blue-800">{userAccountStats.reduce((sum, s) => sum + s.count, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 平台和账号信息 */}
                        <div className="rounded bg-[#f9fafb] p-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">平台：</span><span className="font-medium">{editModal.platform}</span></div>
                                <div><span className="text-[#9ca3af]">用户：</span>{editModal.user?.userNo || '-'}</div>
                            </div>
                        </div>

                        {/* 基本信息编辑 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">{getAccountLabel(editModal.platform)}</label>
                                <Input value={editForm.platformAccount} onChange={e => setEditForm({ ...editForm, platformAccount: e.target.value })} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">实名姓名</label>
                                <Input value={editForm.realName} onChange={e => setEditForm({ ...editForm, realName: e.target.value })} />
                            </div>
                        </div>

                        {/* 星级和冻结 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">星级</label>
                                <select
                                    value={editForm.star}
                                    onChange={e => setEditForm({ ...editForm, star: parseInt(e.target.value) })}
                                    className="w-full rounded-2xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                                >
                                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#6b7280]">冻结到期时间</label>
                                <DateInput value={editForm.frozenTime} onChange={e => setEditForm({ ...editForm, frozenTime: e.target.value })} />
                            </div>
                        </div>

                        {/* 审核状态 */}
                        <div>
                            <label className="mb-1 block text-sm text-[#6b7280]">审核状态</label>
                            <select
                                value={editForm.status}
                                onChange={e => setEditForm({ ...editForm, status: parseInt(e.target.value) })}
                                className="w-full rounded-2xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
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
                                onChange={e => setEditForm({ ...editForm, remark: e.target.value })}
                                placeholder="请输入备注..."
                                className="min-h-[60px] w-full resize-y rounded-2xl border-none bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
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
            {
                imageModal && (
                    <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80">
                        <Image src={imageModal} alt="预览" width={800} height={600} className="max-h-[90%] max-w-[90%] object-contain" unoptimized />
                    </div>
                )
            }

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
        </div >
    );
}

export default function AdminBuyerAccountsPage() {
    return (
        <Suspense fallback={<div className="py-10 text-center text-[#9ca3af]">加载中...</div>}>
            <AdminBuyerAccountsPageContent />
        </Suspense>
    );
}
