'use client';

import { useState, useEffect, useMemo } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn, formatDate } from '../../../lib/utils';
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
import { useTablePreferences } from '../../../hooks/useTablePreferences';

interface User {
    id: string;
    userNo?: string;
    phone: string;
    wechat?: string;
    balance: number;
    silver: number;
    frozenBalance?: number;
    frozenSilver?: number;
    reward?: number;
    verifyStatus: number;
    isActive: boolean;
    isBanned: boolean;
    banReason?: string;
    createdAt: string;
    lastLoginAt?: string;
    lastLoginIp?: string;
    realName?: string;
    idCard?: string;
    invitationCode?: string;
    invitedBy?: string;
    invitedByName?: string;
    note?: string;
    mcTaskNum?: number;
    monthlyTaskCount?: number;
    accountCount?: number;
    referralCount?: number;
    experience?: number;
    canReferFriends?: boolean; // 推荐好友权限
    province?: string;
    city?: string;
    district?: string;
}

interface BalanceModalData {
    userId: string;
    userNo: string;
    type: 'balance' | 'silver';
    action: 'add' | 'deduct';
}

interface AddUserModalData {
    password: string;
    confirmPassword: string;
    phone: string;
    wechat: string;
    balance: string;
    silver: string;
    note: string;
}

interface StarModalData {
    accountId: string;
    accountName: string;
    currentStar: number;
}

const verifyLabels: Record<number, { text: string; color: 'slate' | 'amber' | 'green' | 'red' }> = {
    0: { text: '未认证', color: 'slate' },
    1: { text: '待审核', color: 'amber' },
    2: { text: '已认证', color: 'green' },
    3: { text: '已拒绝', color: 'red' },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [verifyFilter, setVerifyFilter] = useState<string>('all');

    // 排序状态
    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 列设置面板状态
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // 默认列配置
    const defaultColumns: ColumnConfig[] = useMemo(() => [
        { key: 'userNo', visible: true, width: 120, order: 0 },
        { key: 'phone', visible: true, width: 120, order: 1 },
        { key: 'wechat', visible: true, width: 100, order: 2 },
        { key: 'region', visible: true, width: 120, order: 3 },
        { key: 'verifyStatus', visible: true, width: 80, order: 4 },
        { key: 'balance', visible: true, width: 120, order: 5 },
        { key: 'frozen', visible: true, width: 90, order: 6 },
        { key: 'invitedBy', visible: true, width: 80, order: 7 },
        { key: 'monthlyTaskCount', visible: true, width: 70, order: 8 },
        { key: 'lastLoginAt', visible: true, width: 100, order: 9 },
        { key: 'createdAt', visible: true, width: 90, order: 10 },
        { key: 'actions', visible: true, width: 270, order: 11, fixed: 'right' },
    ], []);

    // 列配置 Hook
    const { columnConfig, savePreferences, resetPreferences, updateLocalConfig } = useTablePreferences({
        tableKey: 'admin_users',
        defaultColumns,
    });

    // 列元信息 (用于列设置面板)
    const columnMeta: ColumnMeta[] = useMemo(() => [
        { key: 'userNo', title: '用户ID' },
        { key: 'phone', title: '手机号' },
        { key: 'wechat', title: '微信号' },
        { key: 'region', title: '所在地区' },
        { key: 'verifyStatus', title: '实名状态' },
        { key: 'balance', title: '本金/银锭' },
        { key: 'frozen', title: '冻结' },
        { key: 'invitedBy', title: '推荐人' },
        { key: 'monthlyTaskCount', title: '月单量' },
        { key: 'lastLoginAt', title: '最后登录' },
        { key: 'createdAt', title: '注册时间' },
        { key: 'actions', title: '操作' },
    ], []);

    const [balanceModal, setBalanceModal] = useState<BalanceModalData | null>(null);
    const [detailModal, setDetailModal] = useState<User | null>(null);
    const [banModal, setBanModal] = useState<{ userId: string; userNo: string } | null>(null);
    const [noteModal, setNoteModal] = useState<{ userId: string; userNo: string; currentNote: string } | null>(null);
    const [passwordModal, setPasswordModal] = useState<{ userId: string; userNo: string } | null>(null);
    const [addUserModal, setAddUserModal] = useState(false);
    const [addUserForm, setAddUserForm] = useState<AddUserModalData>({
        password: '', confirmPassword: '', phone: '', wechat: '',
        balance: '', silver: '', note: ''
    });
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Form state for balance modal
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [banReason, setBanReasonText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 编辑资料表单状态
    const [editForm, setEditForm] = useState<{
        userNo: string;
        phone: string;
        wechat: string;
        realName: string;
        balance: string;
        silver: string;
        mcTaskNum: string;
        note: string;
        verifyStatus: number;
        canReferFriends: boolean;
        province: string;
        city: string;
        district: string;
        invitedBy: string;
    }>({ userNo: '', phone: '', wechat: '', realName: '', balance: '0', silver: '0', mcTaskNum: '0', note: '', verifyStatus: 0, canReferFriends: true, province: '', city: '', district: '', invitedBy: '' });

    useEffect(() => {
        loadUsers();
    }, [page, statusFilter, verifyFilter]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users?page=${page}&limit=20`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (verifyFilter !== 'all') url += `&verifyStatus=${verifyFilter}`;
            // 注意：后端暂不支持排序参数，需要后续添加

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadUsers();
    };

    const openEditModal = (user: User) => {
        setEditForm({
            userNo: user.userNo || '',
            phone: user.phone,
            wechat: user.wechat || '',
            realName: user.realName || '',
            balance: String(user.balance || 0),
            silver: String(user.silver || 0),
            mcTaskNum: String(user.mcTaskNum || 0),
            note: user.note || '',
            verifyStatus: user.verifyStatus || 0,
            canReferFriends: user.canReferFriends !== false,
            province: user.province || '',
            city: user.city || '',
            district: user.district || '',
            invitedBy: user.invitedByName || user.invitedBy || ''
        });
        setDetailModal(user);
    };

    const handleUpdateProfile = async () => {
        if (!detailModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${detailModal.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: editForm.phone,
                    wechat: editForm.wechat,
                    realName: editForm.realName,
                    balance: parseFloat(editForm.balance) || 0,
                    silver: parseFloat(editForm.silver) || 0,
                    mcTaskNum: parseInt(editForm.mcTaskNum) || 0,
                    note: editForm.note,
                    verifyStatus: editForm.verifyStatus,
                    canReferFriends: editForm.canReferFriends,
                    province: editForm.province,
                    city: editForm.city,
                    district: editForm.district,
                    invitedBy: editForm.invitedBy || undefined
                })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('资料已更新');
                setDetailModal(null);
                loadUsers();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleAdjustBalance = async () => {
        if (!balanceModal) return;
        if (!balanceAmount || !balanceReason) {
            toastError('请填写金额和原因');
            return;
        }
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${balanceModal.userId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: balanceModal.type,
                    action: balanceModal.action,
                    amount: Number(balanceAmount),
                    reason: balanceReason
                })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('操作成功');
                setBalanceModal(null);
                setBalanceAmount('');
                setBalanceReason('');
                loadUsers();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleBan = async () => {
        if (!banModal || !banReason) {
            toastError('请输入封禁原因');
            return;
        }
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${banModal.userId}/ban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: banReason })
            });
            toastSuccess('用户已封禁');
            setBanModal(null);
            setBanReasonText('');
            loadUsers();
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleUnban = async (userId: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toastSuccess('已解封');
            loadUsers();
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleUpdateNote = async () => {
        if (!noteModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${noteModal.userId}/note`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note: noteText })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('备注已更新');
                setNoteModal(null);
                setNoteText('');
                loadUsers();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleToggleReferPermission = async (userId: string, currentPermission: boolean) => {
        const action = currentPermission ? '关闭' : '开启';
        if (!confirm(`确定要${action}该买手的推荐好友权限吗？`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}/refer-permission`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ canReferFriends: !currentPermission })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(json.message || '权限已更新');
                loadUsers();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleChangePassword = async () => {
        if (!passwordModal) return;
        if (!newPassword || newPassword.length < 6) {
            toastError('密码至少6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            toastError('两次密码不一致');
            return;
        }
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${passwordModal.userId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: newPassword })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('密码已修改');
                setPasswordModal(null);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleAddUser = async () => {
        if (!addUserForm.password || !addUserForm.phone) {
            toastError('请填写密码和手机号');
            return;
        }
        if (addUserForm.password.length < 6) {
            toastError('密码至少6位');
            return;
        }
        if (addUserForm.password !== addUserForm.confirmPassword) {
            toastError('两次密码不一致');
            return;
        }
        const token = localStorage.getItem('adminToken');
        setAddUserLoading(true);
        try {
            const payload: any = {
                password: addUserForm.password,
                phone: addUserForm.phone,
                wechat: addUserForm.wechat || undefined,
                balance: addUserForm.balance ? Number(addUserForm.balance) : undefined,
                silver: addUserForm.silver ? Number(addUserForm.silver) : undefined,
                note: addUserForm.note || undefined,
            };
            const res = await fetch(`${BASE_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('买手创建成功');
                setAddUserModal(false);
                setAddUserForm({
                    password: '', confirmPassword: '', phone: '', wechat: '',
                    balance: '', silver: '', note: ''
                });
                loadUsers();
            } else {
                toastError(json.message || '创建失败');
            }
        } catch (e) {
            toastError('创建失败');
        } finally {
            setAddUserLoading(false);
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/admin/users/export?`;
            if (search) url += `keyword=${encodeURIComponent(search)}&`;
            if (statusFilter !== 'all') url += `status=${statusFilter}&`;
            if (verifyFilter !== 'all') url += `verifyStatus=${verifyFilter}&`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                const exportData = json.data.data || json.data;
                const headers = ['ID', '用户ID', '手机号', '微信号', '本金余额', '银锭余额', '实名状态', '状态', '注册时间'];
                const rows = exportData.map((item: any) => [
                    item['ID'] || item.id || '',
                    item['用户编号'] || item.userNo || '',
                    item['手机号'] || item.phone || '',
                    item['微信号'] || item.wechat || '',
                    item['本金余额'] || item.balance || 0,
                    item['银锭余额'] || item.silver || 0,
                    item['实名状态'] || '',
                    item['状态'] || '',
                    item['注册时间'] || item.createdAt || ''
                ].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `买手列表_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                toastSuccess('导出成功');
            } else {
                toastError(json.message || '导出失败');
            }
        } catch (e) {
            toastError('导出失败');
        } finally {
            setExporting(false);
        }
    };

    const columns: EnhancedColumn<User>[] = [
        {
            key: 'userNo',
            title: '用户ID',
            defaultWidth: 120,
            minWidth: 80,
            sortable: true,
            render: (row) => (
                <div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[#374151]">{row.userNo}</span>

                        {/* 备注图标按钮 */}
                        <div className="relative inline-flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNoteModal({ userId: row.id, userNo: row.userNo || '', currentNote: row.note || '' });
                                    setNoteText(row.note || '');
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
                    {row.isBanned && (
                        <Badge variant="solid" color="red" className="mt-0.5">已封禁</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'phone',
            title: '手机号',
            defaultWidth: 120,
            minWidth: 80,
            sortable: true,
            render: (row) => (
                <div className="text-sm">{row.phone}</div>
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
            key: 'region',
            title: '所在地区',
            defaultWidth: 120,
            minWidth: 80,
            render: (row) => {
                const region = [row.province, row.city, row.district].filter(Boolean).join(' ');
                return <div className="text-xs text-[#6b7280]">{region || '-'}</div>;
            },
        },
        {
            key: 'verifyStatus',
            title: '实名状态',
            defaultWidth: 80,
            minWidth: 60,
            render: (row) => {
                const { text, color } = verifyLabels[row.verifyStatus] || verifyLabels[0];
                return <Badge variant="soft" color={color}>{text}</Badge>;
            },
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
            defaultWidth: 90,
            minWidth: 60,
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    <div>本金: {Number(row.frozenBalance || 0).toFixed(2)}</div>
                    <div>银锭: {Number(row.frozenSilver || 0).toFixed(2)}</div>
                </div>
            ),
        },
        {
            key: 'invitedBy',
            title: '推荐人',
            defaultWidth: 80,
            minWidth: 50,
            render: (row) => (
                <div className="text-xs">{row.invitedByName || row.invitedBy || '-'}</div>
            ),
        },
        {
            key: 'monthlyTaskCount',
            title: '月单量',
            defaultWidth: 70,
            minWidth: 50,
            render: (row) => (
                <span className="text-sm font-medium">{row.monthlyTaskCount || row.mcTaskNum || 0}</span>
            ),
        },
        {
            key: 'lastLoginAt',
            title: '最后登录',
            defaultWidth: 100,
            minWidth: 60,
            sortable: true,
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
            ),
        },
        {
            key: 'createdAt',
            title: '注册时间',
            defaultWidth: 90,
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
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => setBalanceModal({ userId: row.id, userNo: row.userNo || '', type: 'silver', action: 'add' })}>
                        银锭
                    </button>
                    <button className="rounded-full border border-success-300 bg-white px-3 py-1 text-xs text-success-600 hover:bg-success-50 transition-colors whitespace-nowrap" onClick={() => window.location.href = `/admin/users/${row.id}/deposit`}>
                        押金
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => window.location.href = `/admin/users/accounts?userId=${row.userNo || row.id}`}>
                        买号
                    </button>
                    <button className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs text-primary-600 hover:bg-primary-50 transition-colors whitespace-nowrap" onClick={() => openEditModal(row)}>
                        编辑
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => setPasswordModal({ userId: row.id, userNo: row.userNo || '' })}>
                        改密码
                    </button>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap" onClick={() => window.location.href = `/admin/users/${row.id}/messages`}>
                        消息
                    </button>
                    <button className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs text-amber-600 hover:bg-amber-50 transition-colors whitespace-nowrap" onClick={() => window.location.href = `/admin/finance/bank?userId=${row.userNo || row.id}`}>
                        银行卡
                    </button>
                    {row.isBanned ? (
                        <button className="rounded-full border border-green-300 bg-white px-3 py-1 text-xs text-green-600 hover:bg-green-50 transition-colors whitespace-nowrap" onClick={() => handleUnban(row.id)}>
                            解封
                        </button>
                    ) : (
                        <button className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap" onClick={() => setBanModal({ userId: row.id, userNo: row.userNo || '' })}>
                            封禁
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
                    <span className="text-base font-medium">买手列表</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                        <Button onClick={() => setAddUserModal(true)}>+ 添加买手</Button>
                        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
                            {exporting ? '导出中...' : '导出Excel'}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pb-4">
                    <Input
                        placeholder="用户ID/手机号/微信号"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-96"
                    />
                    <Select
                        value={statusFilter}
                        onChange={(v) => { setStatusFilter(v); setPage(1); }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: 'active', label: '正常' },
                            { value: 'banned', label: '已封禁' },
                        ]}
                        className="w-28"
                    />
                    <Select
                        value={verifyFilter}
                        onChange={(v) => { setVerifyFilter(v); setPage(1); }}
                        options={[
                            { value: 'all', label: '全部实名' },
                            { value: '0', label: '未认证' },
                            { value: '1', label: '待审核' },
                            { value: '2', label: '已认证' },
                            { value: '3', label: '已拒绝' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch} className="flex items-center gap-1">
                        搜索
                    </Button>
                    <Button variant="secondary" onClick={loadUsers} className="flex items-center gap-1">
                        刷新
                    </Button>
                </div>

                {/* 用户列表 */}
                <div className="overflow-hidden">
                    <EnhancedTable
                        columns={columns}
                        data={users}
                        rowKey={(r) => r.id}
                        loading={loading}
                        emptyText="暂无用户数据"
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
                            pageSize={20}
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

            {/* 充值/扣款弹窗 */}
            <Modal
                title={`${balanceModal?.action === 'add' ? '💰 充值' : '💸 扣款'} - ${balanceModal?.userNo}`}
                open={!!balanceModal}
                onClose={() => { setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">账户类型</label>
                        <Select
                            value={balanceModal?.type || 'balance'}
                            onChange={(t) => balanceModal && setBalanceModal({ ...balanceModal, type: t as 'balance' | 'silver' })}
                            options={[
                                { value: 'balance', label: '本金余额' },
                                { value: 'silver', label: '银锭余额' },
                            ]}
                        />
                    </div>
                    <Input
                        label={`${balanceModal?.action === 'add' ? '充值' : '扣除'}金额`}
                        type="number"
                        placeholder="请输入金额"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                    />
                    <Input
                        label="操作原因"
                        placeholder="请输入操作原因"
                        value={balanceReason}
                        onChange={(e) => setBalanceReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); }}>
                            取消
                        </Button>
                        <Button
                            onClick={handleAdjustBalance}
                            variant={balanceModal?.action === 'add' ? 'success' : 'warning'}
                        >
                            确认{balanceModal?.action === 'add' ? '充值' : '扣款'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 封禁弹窗 */}
            <Modal
                title={`🚫 封禁用户 - ${banModal?.userNo}`}
                open={!!banModal}
                onClose={() => { setBanModal(null); setBanReasonText(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">封禁原因</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={3}
                            placeholder="请输入封禁原因"
                            value={banReason}
                            onChange={(e) => setBanReasonText(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setBanModal(null); setBanReasonText(''); }}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={handleBan}>
                            确认封禁
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 编辑资料弹窗 */}
            <Modal
                title="编辑资料"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-2xl"
            >
                {detailModal && (
                    <div className="space-y-4">
                        {/* 用户信息标题 */}
                        <h4 className="border-b border-[#e5e7eb] pb-2 text-sm font-medium">用户信息</h4>

                        {/* 表格布局 */}
                        <div className="overflow-hidden rounded border border-[#e5e7eb]">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="w-[100px] bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">用户ID</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={editForm.userNo || ''}
                                                disabled
                                                className="w-full rounded border border-[#d1d5db] bg-gray-50 px-2 py-1.5 text-sm text-gray-500"
                                            />
                                        </td>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">手机号</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">微信号</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={editForm.wechat}
                                                onChange={(e) => setEditForm({ ...editForm, wechat: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">银锭</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={editForm.silver}
                                                onChange={(e) => setEditForm({ ...editForm, silver: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-center text-sm focus:border-primary focus:outline-none"
                                                min="0"
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">本金</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={editForm.balance}
                                                onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-center text-sm focus:border-primary focus:outline-none"
                                                min="0"
                                            />
                                        </td>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">推荐人</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={(detailModal as any).invitedByName || '-'}
                                                readOnly
                                                className="w-full rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 text-sm"
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">实名认证</td>
                                        <td colSpan={3} className="px-3 py-2">
                                            <select
                                                value={String(editForm.verifyStatus)}
                                                onChange={(e) => setEditForm({ ...editForm, verifyStatus: Number(e.target.value) })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            >
                                                <option value="0">未认证</option>
                                                <option value="1">待审核</option>
                                                <option value="2">已认证</option>
                                                <option value="3">已拒绝</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">月单量</td>
                                        <td colSpan={3} className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={editForm.mcTaskNum}
                                                onChange={(e) => setEditForm({ ...editForm, mcTaskNum: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                                min="0"
                                            />
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">邀请权限</td>
                                        <td colSpan={3} className="px-3 py-2">
                                            <select
                                                value={editForm.canReferFriends ? '1' : '0'}
                                                onChange={(e) => setEditForm({ ...editForm, canReferFriends: e.target.value === '1' })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            >
                                                <option value="1">开启</option>
                                                <option value="0">关闭</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">备注</td>
                                        <td colSpan={3} className="px-3 py-2">
                                            <textarea
                                                value={editForm.note}
                                                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                                className="min-h-[60px] w-full resize-y rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                                rows={3}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>
                                取消
                            </Button>
                            <Button onClick={handleUpdateProfile}>
                                保存
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 备注弹窗 */}
            <Modal
                title={`备注 - ${noteModal?.userNo}`}
                open={!!noteModal}
                onClose={() => { setNoteModal(null); setNoteText(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注内容</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="请输入备注内容..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setNoteModal(null); setNoteText(''); }}>
                            取消
                        </Button>
                        <Button onClick={handleUpdateNote}>
                            保存备注
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 修改密码弹窗 */}
            <Modal
                title={`修改密码 - ${passwordModal?.userNo}`}
                open={!!passwordModal}
                onClose={() => { setPasswordModal(null); setNewPassword(''); setConfirmPassword(''); }}
            >
                <div className="space-y-4">
                    <Input
                        label="新密码"
                        type="password"
                        placeholder="请输入新密码（至少6位）"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                        label="确认密码"
                        type="password"
                        placeholder="请再次输入新密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setPasswordModal(null); setNewPassword(''); setConfirmPassword(''); }}>
                            取消
                        </Button>
                        <Button onClick={handleChangePassword}>
                            确认修改
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 添加买手弹窗 */}
            <Modal
                title="添加买手"
                open={addUserModal}
                onClose={() => { setAddUserModal(false); setAddUserForm({ password: '', confirmPassword: '', phone: '', wechat: '', balance: '', silver: '', note: '' }); }}
            >
                <div className="space-y-4">
                    <Input
                        label="密码 *"
                        type="password"
                        placeholder="请输入密码（至少6位）"
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    />
                    <Input
                        label="确认密码 *"
                        type="password"
                        placeholder="请再次输入密码"
                        value={addUserForm.confirmPassword}
                        onChange={(e) => setAddUserForm({ ...addUserForm, confirmPassword: e.target.value })}
                    />
                    <Input
                        label="手机号 *"
                        placeholder="请输入手机号"
                        value={addUserForm.phone}
                        onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                    />
                    <Input
                        label="微信号"
                        placeholder="请输入微信号（选填）"
                        value={addUserForm.wechat}
                        onChange={(e) => setAddUserForm({ ...addUserForm, wechat: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="本金余额（可选）"
                            type="number"
                            placeholder="初始本金余额"
                            value={addUserForm.balance}
                            onChange={(e) => setAddUserForm({ ...addUserForm, balance: e.target.value })}
                        />
                        <Input
                            label="银锭余额（可选）"
                            type="number"
                            placeholder="初始银锭余额"
                            value={addUserForm.silver}
                            onChange={(e) => setAddUserForm({ ...addUserForm, silver: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注（可选）</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={2}
                            placeholder="请输入备注"
                            value={addUserForm.note}
                            onChange={(e) => setAddUserForm({ ...addUserForm, note: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setAddUserModal(false); setAddUserForm({ password: '', confirmPassword: '', phone: '', wechat: '', balance: '', silver: '', note: '' }); }}>
                            取消
                        </Button>
                        <Button loading={addUserLoading} onClick={handleAddUser}>
                            创建买手
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
