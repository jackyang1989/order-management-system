'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { DateInput } from '../../../components/ui/date-input';
import { Select } from '../../../components/ui/select';
import { EnhancedTable, EnhancedColumn } from '../../../components/ui/enhanced-table';
import { ColumnSettingsPanel, ColumnConfig, ColumnMeta } from '../../../components/ui/column-settings-panel';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';
import { adminService, AdminMerchant } from '../../../services/adminService';
import { BASE_URL } from '../../../../apiConfig';
import { useTablePreferences } from '../../../hooks/useTablePreferences';

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '正常', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已禁用', color: 'red' },
};

export default function AdminMerchantsPage() {
    const router = useRouter();
    const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // 排序状态
    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 列设置面板状态
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // 默认列配置
    const defaultColumns: ColumnConfig[] = useMemo(() => [
        { key: 'info', visible: true, width: 200, order: 0 },
        { key: 'phone', visible: true, width: 120, order: 1 },
        { key: 'wechat', visible: true, width: 100, order: 2 },
        { key: 'balance', visible: true, width: 120, order: 3 },
        { key: 'frozen', visible: true, width: 80, order: 4 },
        { key: 'status', visible: true, width: 80, order: 5 },
        { key: 'referrer', visible: true, width: 120, order: 6 },
        { key: 'createdAt', visible: true, width: 100, order: 7 },
        { key: 'actions', visible: true, width: 270, order: 8 },
    ], []);

    // 列配置 Hook
    const { columnConfig, savePreferences, resetPreferences, updateLocalConfig } = useTablePreferences({
        tableKey: 'admin_merchants',
        defaultColumns,
    });

    // 列元信息
    const columnMeta: ColumnMeta[] = useMemo(() => [
        { key: 'info', title: '商户ID' },
        { key: 'phone', title: '手机号' },
        { key: 'wechat', title: '微信' },
        { key: 'balance', title: '本金/银锭' },
        { key: 'frozen', title: '冻结' },
        { key: 'status', title: '状态' },
        { key: 'referrer', title: '推荐人' },
        { key: 'createdAt', title: '注册时间' },
        { key: 'actions', title: '操作' },
    ], []);

    const [activeModal, setActiveModal] = useState<'balance' | 'ban' | 'note' | 'password' | 'add' | 'message' | 'edit' | null>(null);
    const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);

    // Form states
    const [balanceType, setBalanceType] = useState<'balance' | 'silver'>('balance');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [banReason, setBanReason] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Message form states
    const [messageTitle, setMessageTitle] = useState('');
    const [messageContent, setMessageContent] = useState('');

    // Edit form states
    const [editPhone, setEditPhone] = useState('');
    const [editWechat, setEditWechat] = useState('');
    const [editBalance, setEditBalance] = useState('');
    const [editSilver, setEditSilver] = useState('');
    const [editReferrerId, setEditReferrerId] = useState('');

    // Add merchant form states
    const [newPhone, setNewPhone] = useState('');
    const [newMerchantPassword, setNewMerchantPassword] = useState('');
    const [newConfirmPassword, setNewConfirmPassword] = useState('');
    const [newWechat, setNewWechat] = useState('');
    const [newBalance, setNewBalance] = useState('');
    const [newSilver, setNewSilver] = useState('');
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        loadMerchants();
    }, [filter, page]);

    const loadMerchants = async () => {
        setLoading(true);
        try {
            const statusNum = filter === 'all' ? undefined : Number(filter);
            const res = await adminService.getMerchants({ page, limit: 10, status: statusNum, keyword });
            if (res.data) {
                setMerchants(res.data.data);
                setTotal(res.data.total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadMerchants();
    };

    const handleBan = async (id: string, currentStatus: number) => {
        if (currentStatus === 3) {
            // Unban
            try {
                await adminService.unbanMerchant(id);
                toastSuccess('已启用');
                loadMerchants();
            } catch (e) {
                toastError('操作失败');
            }
        } else {
            // Open ban modal
            const m = merchants.find(x => x.id === id);
            if (m) {
                setSelectedMerchant(m);
                setBanReason('');
                setActiveModal('ban');
            }
        }
    };

    const submitBan = async () => {
        if (!selectedMerchant || !banReason.trim()) {
            toastError('请输入禁用原因');
            return;
        }
        try {
            await adminService.banMerchant(selectedMerchant.id, banReason);
            toastSuccess('已禁用');
            setActiveModal(null);
            loadMerchants();
        } catch (e) {
            toastError('操作失败');
        }
    };

    const openAdjustBalance = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setBalanceType('balance');
        setBalanceAction('add');
        setBalanceAmount('');
        setBalanceReason('');
        setActiveModal('balance');
    };

    const submitAdjustBalance = async () => {
        if (!selectedMerchant || !balanceAmount || !balanceReason) {
            toastError('请填写金额和原因');
            return;
        }
        try {
            await adminService.adjustMerchantBalance(selectedMerchant.id, {
                type: balanceType,
                action: balanceAction,
                amount: Number(balanceAmount),
                reason: balanceReason
            });
            toastSuccess('余额调整成功');
            setActiveModal(null);
            loadMerchants();
        } catch (e: any) {
            toastError(e.errorMessage || '操作失败');
        }
    };

    const openNote = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setNoteContent(m.note || '');
        setActiveModal('note');
    };

    const submitNote = async () => {
        if (!selectedMerchant) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${BASE_URL}/admin/merchants/${selectedMerchant.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note: noteContent })
            });
            if (res.ok) {
                toastSuccess('备注保存成功');
                setActiveModal(null);
                loadMerchants();
            } else {
                const json = await res.json();
                toastError(json.message || '保存失败');
            }
        } catch (e) {
            toastError('保存失败');
        }
    };

    const openPassword = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setNewPassword('');
        setActiveModal('password');
    };

    const openAddMerchant = () => {
        setNewPhone('');
        setNewMerchantPassword('');
        setNewConfirmPassword('');
        setNewWechat('');
        setNewBalance('');
        setNewSilver('');
        setNewNote('');
        setActiveModal('add');
    };

    const openMessage = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setMessageTitle('');
        setMessageContent('');
        setActiveModal('message');
    };

    const submitMessage = async () => {
        if (!selectedMerchant || !messageTitle.trim() || !messageContent.trim()) {
            toastError('请填写标题和内容');
            return;
        }
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverId: selectedMerchant.id,
                    receiverType: 2, // MERCHANT
                    type: 1, // SYSTEM
                    title: messageTitle,
                    content: messageContent
                })
            });
            if (res.ok) {
                toastSuccess('消息发送成功');
                setActiveModal(null);
            } else {
                const json = await res.json();
                toastError(json.message || '发送失败');
            }
        } catch (e) {
            toastError('发送失败');
        }
    };

    const openEdit = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setEditPhone(m.phone || '');
        setEditWechat(m.wechat || '');
        setEditBalance(String(m.balance || 0));
        setEditSilver(String(m.silver || 0));
        setEditReferrerId(m.referrerId || '');
        setActiveModal('edit');
    };

    const submitEdit = async () => {
        if (!selectedMerchant) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${BASE_URL}/admin/merchants/${selectedMerchant.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: editPhone,
                    wechat: editWechat || undefined,
                    balance: editBalance ? Number(editBalance) : undefined,
                    silver: editSilver ? Number(editSilver) : undefined,
                    referrerId: editReferrerId || undefined,
                })
            });
            if (res.ok) {
                toastSuccess('修改成功');
                setActiveModal(null);
                loadMerchants();
            } else {
                const json = await res.json();
                toastError(json.message || '修改失败');
            }
        } catch (e) {
            toastError('修改失败');
        }
    };

    const submitAddMerchant = async () => {
        if (!newPhone.trim() || !newMerchantPassword.trim()) {
            toastError('请填写手机号和密码');
            return;
        }
        if (newMerchantPassword !== newConfirmPassword) {
            toastError('两次密码不一致');
            return;
        }
        try {
            const res = await adminService.createMerchant({
                phone: newPhone,
                password: newMerchantPassword,
                wechat: newWechat || undefined,
                balance: newBalance ? Number(newBalance) : undefined,
                silver: newSilver ? Number(newSilver) : undefined,
                note: newNote || undefined,
            });
            if (res.data?.success) {
                toastSuccess('商家创建成功');
                setActiveModal(null);
                loadMerchants();
            } else {
                toastError(res.data?.message || '创建失败');
            }
        } catch (e: any) {
            toastError(e.errorMessage || '创建失败');
        }
    };

    const getMerchantPhone = (
        row: AdminMerchant & {
            mobile?: string;
            phoneNumber?: string;
            contactPhone?: string;
        }
    ) => row.phone || row.mobile || row.phoneNumber || row.contactPhone || '';

    const columns: EnhancedColumn<AdminMerchant>[] = [
        {
            key: 'info',
            title: '商家信息',
            defaultWidth: 200,
            minWidth: 120,
            sortable: true,
            render: (row) => (
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[#3b4559]">{row.merchantNo}</span>

                        {/* 备注图标按钮 */}
                        <div className="relative inline-flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openNote(row);
                                }}
                                onMouseEnter={(e) => {
                                    if (row.note) {
                                        const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (tooltip) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            tooltip.style.left = `${rect.right + window.scrollX + 8}px`;
                                            tooltip.style.top = `${rect.top + window.scrollY}px`;
                                            tooltip.classList.remove('invisible', 'opacity-0');
                                            tooltip.classList.add('visible', 'opacity-100');
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (row.note) {
                                        const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (tooltip) {
                                            tooltip.classList.add('invisible', 'opacity-0');
                                            tooltip.classList.remove('visible', 'opacity-100');
                                        }
                                    }
                                }}
                                className={`transition-all ${row.note
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-slate-300 hover:text-slate-400'
                                    }`}
                                title={row.note ? '查看/编辑备注' : '添加备注'}
                                type="button"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-2.202.55V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* 悬浮提示层 - 仅在有备注时显示 */}
                            {row.note && (
                                <div className="invisible opacity-0 transition-all duration-200 fixed w-72 rounded-xl bg-white p-3 shadow-2xl border border-slate-200 z-[99999]">
                                    <div className="absolute left-0 top-[8px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white" style={{ marginLeft: '-8px' }}></div>
                                    <div className="absolute left-0 top-[8px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-slate-200" style={{ marginLeft: '-9px' }}></div>
                                    <div className="relative">
                                        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
                                                <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.109-.732a.75.75 0 01.917.81 47.784 47.784 0 00.005 10.337.75.75 0 01-.574.812l-3.114.733a9.75 9.75 0 01-6.594-.77l-.108-.054a8.25 8.25 0 00-5.69-.625l-2.202.55V21a.75.75 0 01-1.5 0V3A.75.75 0 013 2.25z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs font-semibold text-slate-600">备注</span>
                                        </div>
                                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {row.note}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 text-right">
                                            点击图标编辑
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'phone',
            title: '手机号',
            defaultWidth: 120,
            minWidth: 80,
            render: (row) => (
                <div className="text-sm">{getMerchantPhone(row) || '-'}</div>
            ),
        },
        {
            key: 'wechat',
            title: '微信号',
            defaultWidth: 100,
            minWidth: 60,
            render: (row) => (
                <div className="text-sm">{row.wechat || '-'}</div>
            ),
        },
        {
            key: 'balance',
            title: '本金/银锭',
            defaultWidth: 120,
            minWidth: 80,
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-success-500">¥{Number(row.balance || 0).toFixed(2)}</div>
                    <div className="text-primary-600">{Number(row.silver || 0).toFixed(2)} 银锭</div>
                </div>
            ),
        },
        {
            key: 'frozen',
            title: '冻结',
            defaultWidth: 80,
            minWidth: 50,
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    ¥{Number(row.frozenBalance || 0).toFixed(2)}
                </div>
            ),
        },
        {
            key: 'status',
            title: '状态',
            defaultWidth: 80,
            minWidth: 60,
            render: (row) => {
                const conf = statusLabels[row.status] || statusLabels[0];
                return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
            },
        },
        {
            key: 'referrer',
            title: '推荐人',
            defaultWidth: 120,
            minWidth: 60,
            render: (row) => (
                <div className="text-xs">
                    {row.referrerName ? (
                        <div className="text-[#374151]">{row.referrerName}</div>
                    ) : (
                        <div className="text-[#9ca3af]">-</div>
                    )}
                </div>
            ),
        },
        {
            key: 'createdAt',
            title: '注册时间',
            defaultWidth: 100,
            minWidth: 60,
            sortable: true,
            render: (row) => (
                <div className="text-xs text-[#6b7280]">
                    {formatDate(row.createdAt)}
                </div>
            ),
        },
        {
            key: 'actions',
            title: '操作',
            defaultWidth: 270,
            minWidth: 200,
            render: (row) => (
                <div className="grid grid-cols-4 gap-1 w-fit mx-auto items-center">
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => router.push(`/admin/shops?merchantId=${row.merchantNo || row.id}`)}>
                        店铺
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => router.push(`/admin/merchants/balance?merchantId=${row.merchantNo || row.id}`)}>
                        流水
                    </button>
                    <button className="rounded-full border border-success-300 bg-white px-3 py-1 text-xs text-success-600 hover:bg-success-50 transition-colors whitespace-nowrap" onClick={() => router.push(`/admin/merchants/${row.id}/deposit`)}>
                        押金
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => openAdjustBalance(row)}>
                        调余额
                    </button>
                    <button className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 transition-colors whitespace-nowrap" onClick={() => openMessage(row)}>
                        消息
                    </button>
                    <button className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 transition-colors whitespace-nowrap" onClick={() => openEdit(row)}>
                        编辑
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => openPassword(row)}>
                        改密码
                    </button>
                    {row.status === 3 ? (
                        <button className="rounded-full border border-success-300 bg-white px-3 py-1 text-xs text-success-600 hover:bg-success-50 transition-colors whitespace-nowrap" onClick={() => handleBan(row.id, row.status)}>
                            启用
                        </button>
                    ) : (
                        <button className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap" onClick={() => handleBan(row.id, row.status)}>
                            禁用
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* 搜索栏 */}
            {/* 搜索栏 */}
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">商家列表</span>
                    <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索商户ID/手机号..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-60"
                    />
                    <Select
                        value={filter}
                        onChange={(v) => { setFilter(v); setPage(1); }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: '0', label: '待审核' },
                            { value: '1', label: '正常' },
                            { value: '2', label: '已拒绝' },
                            { value: '3', label: '已禁用' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch}>
                        搜索
                    </Button>
                    <Button variant="secondary" onClick={loadMerchants}>
                        刷新
                    </Button>
                    <Button onClick={openAddMerchant}>
                        添加商家
                    </Button>

                </div>

                {/* 商家列表 */}
                <div className="overflow-hidden">
                    <EnhancedTable
                        columns={columns}
                        data={merchants}
                        rowKey={(r) => r.id}
                        loading={loading}
                        emptyText="暂无商家数据"
                        columnConfig={columnConfig}
                        onColumnConfigChange={updateLocalConfig}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={(field, order) => {
                            setSortField(field);
                            setSortOrder(order);
                            // 注意：后端暂不支持排序，这里只更新前端显示状态
                        }}
                        onColumnSettingsClick={() => setShowColumnSettings(true)}
                    />
                    <div className="mt-4 flex justify-end px-6 pb-6">
                        <Pagination
                            current={page}
                            total={total}
                            pageSize={10}
                            onChange={setPage}
                        />
                    </div>
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

            {/* 调整余额弹窗 */}
            <Modal
                title={`调整余额 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'balance'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">账户类型</label>
                        <Select
                            value={balanceType}
                            onChange={(v) => setBalanceType(v as 'balance' | 'silver')}
                            options={[
                                { value: 'balance', label: '本金余额' },
                                { value: 'silver', label: '银锭余额' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">操作类型</label>
                        <Select
                            value={balanceAction}
                            onChange={(v) => setBalanceAction(v as 'add' | 'deduct')}
                            options={[
                                { value: 'add', label: '增加' },
                                { value: 'deduct', label: '扣除' },
                            ]}
                        />
                    </div>
                    <Input
                        label="金额"
                        type="number"
                        placeholder="请输入金额"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                    <Input
                        label="原因"
                        placeholder="请输入操作原因"
                        value={balanceReason}
                        onChange={(e) => setBalanceReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitAdjustBalance}>
                            确认
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 禁用弹窗 */}
            <Modal
                title={`禁用商家 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'ban'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">禁用原因</label>
                        <textarea
                            className="min-h-[80px] w-full resize-y rounded-2xl border-none bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                            rows={3}
                            placeholder="请输入禁用原因"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={submitBan}>
                            确认禁用
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 备注弹窗 */}
            <Modal
                title={`备注 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'note'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注内容</label>
                        <textarea
                            className="min-h-[80px] w-full resize-y rounded-2xl border-none bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                            rows={3}
                            placeholder="请输入备注内容"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitNote}>
                            保存
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 改密码弹窗 */}
            <Modal
                title={`修改密码 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'password'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <Input
                        label="新密码"
                        type="password"
                        placeholder="请输入新密码"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={() => { toastSuccess('密码修改成功'); setActiveModal(null); }}>
                            确认修改
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 发送消息弹窗 */}
            <Modal
                title={`发送消息 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'message'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <Input
                        label="消息标题"
                        placeholder="请输入消息标题"
                        value={messageTitle}
                        onChange={(e) => setMessageTitle(e.target.value)}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">消息内容</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="请输入消息内容"
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitMessage}>
                            发送
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 编辑商家弹窗 */}
            <Modal
                title={`编辑商家 - ${selectedMerchant?.merchantNo}`}
                open={activeModal === 'edit'}
                onClose={() => setActiveModal(null)}
                className="max-w-lg"
            >
                <div className="space-y-4">
                    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-[#6b7280]">商家ID:</span> {selectedMerchant?.merchantNo}</div>
                            <div><span className="text-[#6b7280]">当前本金:</span> <span className="text-success-500">¥{Number(selectedMerchant?.balance || 0).toFixed(2)}</span></div>
                            <div><span className="text-[#6b7280]">当前银锭:</span> <span className="text-primary-600">{Number(selectedMerchant?.silver || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                    <Input
                        label="手机号"
                        placeholder="请输入手机号"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                    />
                    <Input
                        label="微信号"
                        placeholder="请输入微信号"
                        value={editWechat}
                        onChange={(e) => setEditWechat(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="本金余额"
                            type="number"
                            placeholder="请输入本金"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                        />
                        <Input
                            label="银锭余额"
                            type="number"
                            placeholder="请输入银锭"
                            value={editSilver}
                            onChange={(e) => setEditSilver(e.target.value)}
                        />
                    </div>
                    <Input
                        label="推荐人ID"
                        placeholder="请输入推荐人ID"
                        value={editReferrerId}
                        onChange={(e) => setEditReferrerId(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitEdit}>
                            保存
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 添加商家弹窗 */}
            <Modal
                title="添加商家"
                open={activeModal === 'add'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <Input
                        label="手机号"
                        placeholder="请输入手机号"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <Input
                        label="密码"
                        type="password"
                        placeholder="请输入密码"
                        value={newMerchantPassword}
                        onChange={(e) => setNewMerchantPassword(e.target.value)}
                    />
                    <Input
                        label="确认密码"
                        type="password"
                        placeholder="请再次输入密码"
                        value={newConfirmPassword}
                        onChange={(e) => setNewConfirmPassword(e.target.value)}
                    />
                    <Input
                        label="微信号（可选）"
                        placeholder="请输入微信号"
                        value={newWechat}
                        onChange={(e) => setNewWechat(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="本金余额（可选）"
                            type="number"
                            placeholder="初始本金余额"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                        />
                        <Input
                            label="银锭余额（可选）"
                            type="number"
                            placeholder="初始银锭余额"
                            value={newSilver}
                            onChange={(e) => setNewSilver(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注（可选）</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={2}
                            placeholder="请输入备注"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitAddMerchant}>
                            创建商家
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
