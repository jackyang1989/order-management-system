'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn, formatDate } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { DateInput } from '../../../components/ui/date-input';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';

interface User {
    id: string;
    username: string;
    phone: string;
    wechat?: string;
    balance: number;
    silver: number;
    frozenBalance?: number;
    frozenSilver?: number;
    reward?: number;
    vip: boolean;
    vipExpireAt?: string;
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
}

interface BalanceModalData {
    userId: string;
    username: string;
    type: 'balance' | 'silver';
    action: 'add' | 'deduct';
}

interface AddUserModalData {
    username: string;
    password: string;
    confirmPassword: string;
    phone: string;
    wechat: string;
    vipExpireAt: string;
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
    const [wechatSearch, setWechatSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [vipFilter, setVipFilter] = useState<string>('all');
    const [verifyFilter, setVerifyFilter] = useState<string>('all');

    const [balanceModal, setBalanceModal] = useState<BalanceModalData | null>(null);
    const [detailModal, setDetailModal] = useState<User | null>(null);
    const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
    const [noteModal, setNoteModal] = useState<{ userId: string; username: string; currentNote: string } | null>(null);
    const [passwordModal, setPasswordModal] = useState<{ userId: string; username: string } | null>(null);
    const [addUserModal, setAddUserModal] = useState(false);
    const [addUserForm, setAddUserForm] = useState<AddUserModalData>({
        username: '', password: '', confirmPassword: '', phone: '', wechat: '',
        vipExpireAt: '', balance: '', silver: '', note: ''
    });
    const [addUserLoading, setAddUserLoading] = useState(false);

    // Form state for balance modal
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [banReason, setBanReasonText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 编辑资料表单状态
    const [editForm, setEditForm] = useState<{
        username: string;
        phone: string;
        wechat: string;
        realName: string;
        balance: string;
        silver: string;
        vip: boolean;
        vipExpireAt: string;
        mcTaskNum: string;
        note: string;
    }>({ username: '', phone: '', wechat: '', realName: '', balance: '0', silver: '0', vip: false, vipExpireAt: '', mcTaskNum: '0', note: '' });

    useEffect(() => {
        loadUsers();
    }, [page, statusFilter, vipFilter, verifyFilter]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users?page=${page}&limit=20`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;
            if (wechatSearch) url += `&wechat=${encodeURIComponent(wechatSearch)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (vipFilter !== 'all') url += `&vip=${vipFilter}`;
            if (verifyFilter !== 'all') url += `&verifyStatus=${verifyFilter}`;

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
            username: user.username,
            phone: user.phone,
            wechat: user.wechat || '',
            realName: user.realName || '',
            balance: String(user.balance || 0),
            silver: String(user.silver || 0),
            vip: user.vip || false,
            vipExpireAt: user.vipExpireAt ? user.vipExpireAt.split('T')[0] : '',
            mcTaskNum: String(user.mcTaskNum || 0),
            note: user.note || ''
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
                    username: editForm.username,
                    phone: editForm.phone,
                    wechat: editForm.wechat,
                    realName: editForm.realName,
                    balance: parseFloat(editForm.balance) || 0,
                    silver: parseFloat(editForm.silver) || 0,
                    vip: editForm.vip,
                    vipExpireAt: editForm.vipExpireAt || null,
                    mcTaskNum: parseInt(editForm.mcTaskNum) || 0,
                    note: editForm.note
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

    const handleSetVip = async (userId: string, days: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/vip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ days })
            });
            toastSuccess('VIP已设置');
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
        if (!addUserForm.username || !addUserForm.password || !addUserForm.phone) {
            toastError('请填写用户名、密码和手机号');
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
                username: addUserForm.username,
                password: addUserForm.password,
                phone: addUserForm.phone,
                wechat: addUserForm.wechat || undefined,
                vipExpireAt: addUserForm.vipExpireAt || undefined,
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
                    username: '', password: '', confirmPassword: '', phone: '', wechat: '',
                    vipExpireAt: '', balance: '', silver: '', note: ''
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

    const columns: Column<User>[] = [
        {
            key: 'username',
            title: '用户名',
            className: 'w-[100px]',
            render: (row) => (
                <div>
                    <div className="font-medium text-[#3b4559]">{row.username}</div>
                    {row.isBanned && (
                        <Badge variant="solid" color="red" className="mt-0.5">已封禁</Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'phone',
            title: '手机号',
            className: 'w-[120px]',
            render: (row) => (
                <div className="text-sm">{row.phone}</div>
            ),
        },
        {
            key: 'wechat',
            title: '微信号',
            className: 'w-[100px]',
            render: (row) => (
                <div className="text-sm">{row.wechat || '-'}</div>
            ),
        },
        {
            key: 'verifyStatus',
            title: '实名状态',
            className: 'w-[80px] text-center',
            render: (row) => {
                const { text, color } = verifyLabels[row.verifyStatus] || verifyLabels[0];
                return <Badge variant="soft" color={color}>{text}</Badge>;
            },
        },
        {
            key: 'balance',
            title: '本金/银锭',
            className: 'w-[120px]',
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
            className: 'w-[90px]',
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    <div>本金: {Number(row.frozenBalance || 0).toFixed(2)}</div>
                    <div>银锭: {Number(row.frozenSilver || 0).toFixed(2)}</div>
                </div>
            ),
        },
        {
            key: 'vip',
            title: 'VIP',
            className: 'w-[90px] text-center',
            render: (row) => (
                <div>
                    {row.vip ? (
                        <Badge variant="solid" color="amber">VIP</Badge>
                    ) : (
                        <Badge variant="soft" color="slate">普通</Badge>
                    )}
                    {row.vipExpireAt && (
                        <div className="mt-0.5 text-[10px] text-[#9ca3af]">
                            {formatDate(row.vipExpireAt)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'invitedBy',
            title: '推荐人',
            className: 'w-[80px]',
            render: (row) => (
                <div className="text-xs">{row.invitedByName || row.invitedBy || '-'}</div>
            ),
        },
        {
            key: 'monthlyTaskCount',
            title: '月累计单',
            className: 'w-[70px] text-center',
            render: (row) => (
                <span className="text-sm font-medium">{row.monthlyTaskCount || row.mcTaskNum || 0}</span>
            ),
        },
        {
            key: 'lastLoginAt',
            title: '最后登录',
            className: 'w-[100px]',
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                </div>
            ),
        },
        {
            key: 'createdAt',
            title: '注册时间',
            className: 'w-[90px]',
            render: (row) => (
                <div className="text-xs text-[#6b7280]">
                    {formatDate(row.createdAt)}
                </div>
            ),
        },
        {
            key: 'note',
            title: '备注',
            className: 'w-[100px]',
            render: (row) => (
                <div className="max-w-[100px] truncate text-xs text-danger-400" title={row.note || ''}>
                    {row.note || '-'}
                </div>
            ),
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[440px]',
            render: (row) => (
                <div className="grid grid-cols-4 items-center gap-2">
                    <Button size="sm" variant="outline" className="whitespace-nowrap text-primary-500" onClick={() => setBalanceModal({ userId: row.id, username: row.username, type: 'silver', action: 'add' })}>
                        银锭
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap text-success-500" onClick={() => window.location.href = `/admin/users/${row.id}/deposit`}>
                        押金
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => window.location.href = `/admin/users/accounts?userId=${row.id}`}>
                        买号
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => openEditModal(row)}>
                        编辑资料
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap text-danger-400" onClick={() => { setNoteModal({ userId: row.id, username: row.username, currentNote: row.note || '' }); setNoteText(row.note || ''); }}>
                        备注
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => setPasswordModal({ userId: row.id, username: row.username })}>
                        改密码
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={() => window.location.href = `/admin/users/${row.id}/messages`}>
                        消息
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap text-amber-500" onClick={() => window.location.href = `/admin/finance/bank?userId=${row.id}`}>
                        银行卡
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* 搜索栏 */}
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">买手列表</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                        <Button onClick={() => setAddUserModal(true)}>+ 添加买手</Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="用户名/手机号"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-44"
                    />
                    <Input
                        placeholder="微信号"
                        value={wechatSearch}
                        onChange={(e) => setWechatSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-32"
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
                        value={vipFilter}
                        onChange={(v) => { setVipFilter(v); setPage(1); }}
                        options={[
                            { value: 'all', label: '全部会员' },
                            { value: 'vip', label: 'VIP用户' },
                            { value: 'normal', label: '普通用户' },
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
            </Card>

            {/* 用户列表 */}
            <Card className="overflow-hidden bg-white">
                <Table
                    columns={columns}
                    data={users}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyText="暂无用户数据"
                />
                <div className="mt-4 flex justify-end px-6 pb-6">
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={20}
                        onChange={setPage}
                    />
                </div>
            </Card>

            {/* 充值/扣款弹窗 */}
            <Modal
                title={`${balanceModal?.action === 'add' ? '💰 充值' : '💸 扣款'} - ${balanceModal?.username}`}
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
                title={`🚫 封禁用户 - ${banModal?.username}`}
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
                                        <td className="w-[100px] bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">用户名</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                readOnly
                                                className="w-full rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 text-sm"
                                            />
                                        </td>
                                        <td className="w-[100px] bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">手机号</td>
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
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">VIP到期时间</td>
                                        <td className="px-3 py-2">
                                            <DateInput
                                                value={editForm.vipExpireAt}
                                                onChange={(e) => setEditForm({ ...editForm, vipExpireAt: e.target.value })}
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
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">微信号</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={editForm.wechat}
                                                onChange={(e) => setEditForm({ ...editForm, wechat: e.target.value })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            />
                                        </td>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">推荐人</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={detailModal.invitedBy || '-'}
                                                readOnly
                                                className="w-full rounded border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1.5 text-sm"
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
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">是否VIP</td>
                                        <td className="px-3 py-2">
                                            <select
                                                value={editForm.vip ? '1' : '0'}
                                                onChange={(e) => setEditForm({ ...editForm, vip: e.target.value === '1' })}
                                                className="w-full rounded border border-[#d1d5db] px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                                            >
                                                <option value="0">否</option>
                                                <option value="1">是</option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr className="border-b border-[#e5e7eb]">
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">月累计完成单数</td>
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
                                    <tr>
                                        <td className="bg-[#f9fafb] px-3 py-2.5 text-[#6b7280]">财务备注</td>
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

            {/* 违规备注弹窗 */}
            <Modal
                title={`违规备注 - ${noteModal?.username}`}
                open={!!noteModal}
                onClose={() => { setNoteModal(null); setNoteText(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">备注内容</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="请输入违规备注内容..."
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
                title={`修改密码 - ${passwordModal?.username}`}
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
                onClose={() => { setAddUserModal(false); setAddUserForm({ username: '', password: '', confirmPassword: '', phone: '', wechat: '', vipExpireAt: '', balance: '', silver: '', note: '' }); }}
            >
                <div className="space-y-4">
                    <Input
                        label="用户名 *"
                        placeholder="请输入用户名"
                        value={addUserForm.username}
                        onChange={(e) => setAddUserForm({ ...addUserForm, username: e.target.value })}
                    />
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
                    <DateInput
                        label="VIP到期时间（可选）"
                        placeholder="YYYY-MM-DD"
                        value={addUserForm.vipExpireAt}
                        onChange={(e) => setAddUserForm({ ...addUserForm, vipExpireAt: e.target.value })}
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
                        <Button variant="secondary" onClick={() => { setAddUserModal(false); setAddUserForm({ username: '', password: '', confirmPassword: '', phone: '', wechat: '', vipExpireAt: '', balance: '', silver: '', note: '' }); }}>
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
