'use client';

import { useState, useEffect } from 'react';
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
import { adminService, AdminMerchant } from '../../../services/adminService';

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '正常', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已禁用', color: 'red' },
};

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [activeModal, setActiveModal] = useState<'balance' | 'vip' | 'ban' | null>(null);
    const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);

    // Form states
    const [balanceType, setBalanceType] = useState<'balance' | 'silver'>('balance');
    const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [vipDays, setVipDays] = useState('30');
    const [banReason, setBanReason] = useState('');

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

    const openSetVip = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setVipDays('30');
        setActiveModal('vip');
    };

    const submitSetVip = async () => {
        if (!selectedMerchant || !vipDays) {
            toastError('请输入天数');
            return;
        }
        try {
            await adminService.setMerchantVip(selectedMerchant.id, Number(vipDays));
            toastSuccess('VIP设置成功');
            setActiveModal(null);
            loadMerchants();
        } catch (e) {
            toastError('操作失败');
        }
    };

    const columns: Column<AdminMerchant>[] = [
        {
            key: 'info',
            title: '商家信息',
            className: 'w-[200px]',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-lg">
                        🏪
                    </div>
                    <div>
                        <div className="font-medium text-[#3b4559]">{row.username}</div>
                        <div className="text-xs text-[#9ca3af]">{row.phone}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'balance',
            title: '余额',
            className: 'w-[120px] text-right',
            render: (row) => (
                <span className="font-medium text-success-400">¥{Number(row.balance || 0).toFixed(2)}</span>
            ),
        },
        {
            key: 'silver',
            title: '银锭',
            className: 'w-[100px] text-right',
            render: (row) => (
                <span className="font-medium text-primary-600">{Number(row.silver || 0).toFixed(2)}</span>
            ),
        },
        {
            key: 'vip',
            title: '会员',
            className: 'w-[80px] text-center',
            render: (row) => row.vip ? (
                <Badge variant="solid" color="amber">VIP</Badge>
            ) : (
                <Badge variant="soft" color="slate">普通</Badge>
            ),
        },
        {
            key: 'status',
            title: '状态',
            className: 'w-[100px] text-center',
            render: (row) => {
                const conf = statusLabels[row.status] || statusLabels[0];
                return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
            },
        },
        {
            key: 'createdAt',
            title: '注册时间',
            className: 'w-[160px]',
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[280px]',
            render: (row) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" className="flex items-center gap-1" onClick={() => openAdjustBalance(row)}>
                        💰 调余额
                    </Button>
                    {!row.vip && (
                        <Button size="sm" className="bg-warning-400 hover:bg-warning-500" onClick={() => openSetVip(row)}>
                            👑 设VIP
                        </Button>
                    )}
                    {row.status === 3 ? (
                        <Button size="sm" onClick={() => handleBan(row.id, row.status)}>
                            启用
                        </Button>
                    ) : (
                        <Button size="sm" variant="destructive" onClick={() => handleBan(row.id, row.status)}>
                            禁用
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
                        placeholder="搜索商家名称/手机号..."
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
                    <Button onClick={handleSearch} className="flex items-center gap-1">
                        🔍 搜索
                    </Button>
                    <Button variant="secondary" onClick={loadMerchants} className="flex items-center gap-1">
                        🔄 刷新
                    </Button>
                </div>
            </Card>

            {/* 商家列表 */}
            <Card className="overflow-hidden bg-white">
                <Table
                    columns={columns}
                    data={merchants}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyText="暂无商家数据"
                />
                <div className="mt-4 flex justify-end px-6 pb-6">
                    <Pagination
                        current={page}
                        total={total}
                        pageSize={10}
                        onChange={setPage}
                    />
                </div>
            </Card>

            {/* 调整余额弹窗 */}
            <Modal
                title={`💰 调整余额 - ${selectedMerchant?.username}`}
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

            {/* 设置VIP弹窗 */}
            <Modal
                title={`👑 设置VIP - ${selectedMerchant?.username}`}
                open={activeModal === 'vip'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <Input
                        label="VIP时长（天）"
                        type="number"
                        placeholder="请输入天数"
                        value={vipDays}
                        onChange={(e) => setVipDays(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActiveModal(null)}>
                            取消
                        </Button>
                        <Button onClick={submitSetVip}>
                            确认
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 禁用弹窗 */}
            <Modal
                title={`🚫 禁用商家 - ${selectedMerchant?.username}`}
                open={activeModal === 'ban'}
                onClose={() => setActiveModal(null)}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">禁用原因</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        </div>
    );
}
