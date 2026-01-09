'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';

interface User {
    id: string;
    username: string;
    phone: string;
    qq?: string;
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
    note?: string;
    mcTaskNum?: number;
    accountCount?: number;
}

interface BalanceModalData {
    userId: string;
    username: string;
    type: 'balance' | 'silver';
    action: 'add' | 'deduct';
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
    const [qqSearch, setQqSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [vipFilter, setVipFilter] = useState<string>('all');

    const [balanceModal, setBalanceModal] = useState<BalanceModalData | null>(null);
    const [detailModal, setDetailModal] = useState<User | null>(null);
    const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
    const [noteModal, setNoteModal] = useState<{ userId: string; username: string; currentNote: string } | null>(null);
    const [passwordModal, setPasswordModal] = useState<{ userId: string; username: string } | null>(null);

    // Form state for balance modal
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [banReason, setBanReasonText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        loadUsers();
    }, [page, statusFilter, vipFilter]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users?page=${page}&limit=20`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;
            if (qqSearch) url += `&qq=${encodeURIComponent(qqSearch)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (vipFilter !== 'all') url += `&vip=${vipFilter}`;

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

    const columns: Column<User>[] = [
        {
            key: 'info',
            title: '用户信息',
            className: 'w-[200px]',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-lg">
                        👤
                    </div>
                    <div>
                        <div className="font-medium text-[#3b4559]">{row.username}</div>
                        <div className="text-xs text-[#9ca3af]">{row.phone}</div>
                        {row.qq && <div className="text-xs text-[#9ca3af]">QQ: {row.qq}</div>}
                    </div>
                </div>
            ),
        },
        {
            key: 'balance',
            title: '本金余额',
            className: 'w-[120px] text-right',
            render: (row) => (
                <div>
                    <div className="font-medium text-success-400">¥{Number(row.balance || 0).toFixed(2)}</div>
                    {(row.frozenBalance || 0) > 0 && (
                        <div className="text-xs text-warning-400">冻结: ¥{Number(row.frozenBalance).toFixed(2)}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'silver',
            title: '银锭余额',
            className: 'w-[120px] text-right',
            render: (row) => (
                <div>
                    <div className="font-medium text-primary-600">{Number(row.silver || 0).toFixed(2)}</div>
                    {(row.frozenSilver || 0) > 0 && (
                        <div className="text-xs text-warning-400">冻结: {Number(row.frozenSilver).toFixed(2)}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'vip',
            title: '会员状态',
            className: 'w-[120px] text-center',
            render: (row) => (
                <div>
                    {row.vip ? (
                        <Badge variant="solid" color="amber">VIP</Badge>
                    ) : (
                        <Badge variant="soft" color="slate">普通</Badge>
                    )}
                    {row.vipExpireAt && (
                        <div className="mt-1 text-[10px] text-[#9ca3af]">
                            到期: {new Date(row.vipExpireAt).toLocaleDateString('zh-CN')}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'accounts',
            title: '买号数',
            className: 'w-[70px] text-center',
            render: (row) => (
                <span className="text-sm font-medium">{row.accountCount || 0}</span>
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
            key: 'status',
            title: '状态',
            className: 'w-[80px] text-center',
            render: (row) => {
                if (row.isBanned) return <Badge variant="soft" color="red">已封禁</Badge>;
                if (row.isActive) return <Badge variant="soft" color="green">正常</Badge>;
                return <Badge variant="soft" color="slate">未激活</Badge>;
            },
        },
        {
            key: 'createdAt',
            title: '注册时间',
            className: 'w-[100px]',
            render: (row) => (
                <div className="text-xs text-[#9ca3af]">
                    {new Date(row.createdAt).toLocaleDateString('zh-CN')}
                </div>
            ),
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[400px]',
            render: (row) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(row)}>
                        详情
                    </Button>
                    <Button size="sm" variant="outline" className="text-primary-500" onClick={() => setBalanceModal({ userId: row.id, username: row.username, type: 'silver', action: 'add' })}>
                        银锭
                    </Button>
                    <Button size="sm" variant="outline" className="text-success-500" onClick={() => setBalanceModal({ userId: row.id, username: row.username, type: 'balance', action: 'add' })}>
                        本金
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/admin/users/${row.id}/accounts`}>
                        买号
                    </Button>
                    <Button size="sm" variant="outline" className="text-danger-400" onClick={() => { setNoteModal({ userId: row.id, username: row.username, currentNote: row.note || '' }); setNoteText(row.note || ''); }}>
                        备注
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPasswordModal({ userId: row.id, username: row.username })}>
                        改密码
                    </Button>
                    {!row.vip && (
                        <Button size="sm" variant="warning" onClick={() => handleSetVip(row.id, 30)}>
                            VIP
                        </Button>
                    )}
                    {row.isBanned ? (
                        <Button size="sm" onClick={() => handleUnban(row.id)}>解封</Button>
                    ) : (
                        <Button size="sm" variant="destructive" onClick={() => setBanModal({ userId: row.id, username: row.username })}>
                            封禁
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* 搜索栏 */}
            <Card className="bg-white">
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="用户名/手机号"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-44"
                    />
                    <Input
                        placeholder="QQ号"
                        value={qqSearch}
                        onChange={(e) => setQqSearch(e.target.value)}
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

            {/* 用户详情弹窗 */}
            <Modal
                title="用户详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-2xl"
            >
                {detailModal && (
                    <div className="space-y-6">
                        {/* 基本信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">基本信息</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">用户ID</div>
                                    <div className="text-sm font-medium">{detailModal.id}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">用户名</div>
                                    <div className="text-sm font-medium">{detailModal.username}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">手机号</div>
                                    <div className="text-sm font-medium">{detailModal.phone}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">QQ</div>
                                    <div className="text-sm font-medium">{detailModal.qq || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">邀请码</div>
                                    <div className="text-sm font-medium">{detailModal.invitationCode || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">最后登录IP</div>
                                    <div className="text-sm font-medium">{detailModal.lastLoginIp || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* 账户余额 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">账户余额</h3>
                            <div className="grid grid-cols-3 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">本金余额</div>
                                    <div className="text-lg font-bold text-success-400">¥{Number(detailModal.balance || 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">银锭余额</div>
                                    <div className="text-lg font-bold text-primary-600">{Number(detailModal.silver || 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">累计赚取</div>
                                    <div className="text-lg font-bold text-warning-400">{Number(detailModal.reward || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* 状态信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">状态信息</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">VIP状态</div>
                                    <div>{detailModal.vip ? <Badge variant="solid" color="amber">VIP</Badge> : <span className="text-sm">普通用户</span>}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">实名认证</div>
                                    <div><Badge variant="soft" color={verifyLabels[detailModal.verifyStatus]?.color}>{verifyLabels[detailModal.verifyStatus]?.text}</Badge></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">账号状态</div>
                                    <div>
                                        {detailModal.isBanned ? (
                                            <Badge variant="soft" color="red">已封禁</Badge>
                                        ) : detailModal.isActive ? (
                                            <Badge variant="soft" color="green">正常</Badge>
                                        ) : (
                                            <Badge variant="soft" color="slate">未激活</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">注册时间</div>
                                    <div className="text-sm font-medium">{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                </div>
                            </div>
                        </div>

                        {/* 违规备注 */}
                        {detailModal.note && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-danger-400 pl-2 text-sm font-semibold text-danger-400">违规备注</h3>
                                <div className="rounded-md bg-red-50 p-4 text-sm text-danger-400">
                                    {detailModal.note}
                                </div>
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex flex-wrap justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button
                                variant="success"
                                onClick={() => { setBalanceModal({ userId: detailModal.id, username: detailModal.username, type: 'balance', action: 'add' }); setDetailModal(null); }}
                            >
                                充值
                            </Button>
                            {!detailModal.vip && (
                                <Button
                                    variant="warning"
                                    onClick={() => { handleSetVip(detailModal.id, 30); setDetailModal(null); }}
                                >
                                    👑 设为VIP
                                </Button>
                            )}
                            {detailModal.isBanned ? (
                                <Button onClick={() => { handleUnban(detailModal.id); setDetailModal(null); }}>
                                    解封
                                </Button>
                            ) : (
                                <Button
                                    variant="destructive"
                                    onClick={() => { setBanModal({ userId: detailModal.id, username: detailModal.username }); setDetailModal(null); }}
                                >
                                    🚫 封禁
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>
                                关闭
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
        </div>
    );
}
