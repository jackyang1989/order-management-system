'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError, toastWarning } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';

interface Withdrawal {
    id: string;
    userId: string;
    amount: number;
    fee: number;
    actualAmount: number;
    bankName: string;
    cardNumber: string;
    holderName: string;
    status: string;
    remark: string;
    createdAt: string;
}

const statusLabels: Record<string, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    PENDING: { text: '待审核', color: 'amber' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已拒绝', color: 'red' },
    COMPLETED: { text: '已完成', color: 'slate' },
};

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDING');
    const [reviewing, setReviewing] = useState<string | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    // Reject modal
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Batch modal
    const [batchModal, setBatchModal] = useState<{ action: 'approve' | 'reject'; count: number } | null>(null);

    useEffect(() => {
        loadWithdrawals();
    }, [filter]);

    const loadWithdrawals = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedRowKeys([]);
        try {
            const url = filter ? `${BASE_URL}/admin/withdrawals?status=${filter}` : `${BASE_URL}/admin/withdrawals`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setWithdrawals(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, approved: boolean, remark: string = '') => {
        const token = localStorage.getItem('adminToken');
        setReviewing(id);
        try {
            const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ approved, remark })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(approved ? '提现已通过' : '提现已拒绝');
                loadWithdrawals();
            }
        } catch (e) {
            toastError('操作失败');
        } finally {
            setReviewing(null);
        }
    };

    const submitReject = async () => {
        if (!rejectModal || !rejectReason.trim()) {
            toastWarning('请输入拒绝原因');
            return;
        }
        await handleApprove(rejectModal, false, rejectReason);
        setRejectModal(null);
        setRejectReason('');
    };

    const handleBatchApprove = async (approved: boolean) => {
        if (selectedRowKeys.length === 0) {
            toastWarning('请先选择要操作的记录');
            return;
        }
        setBatchModal({ action: approved ? 'approve' : 'reject', count: selectedRowKeys.length });
    };

    const submitBatch = async () => {
        if (!batchModal) return;
        const token = localStorage.getItem('adminToken');
        setBatchLoading(true);
        try {
            const remark = batchModal.action === 'approve' ? '' : '批量拒绝';
            await Promise.all(
                selectedRowKeys.map(id =>
                    fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ approved: batchModal.action === 'approve', remark })
                    })
                )
            );
            toastSuccess(`已${batchModal.action === 'approve' ? '批量通过' : '批量拒绝'} ${selectedRowKeys.length} 条记录`);
            setBatchModal(null);
            loadWithdrawals();
        } catch (e) {
            toastError('部分操作失败');
        } finally {
            setBatchLoading(false);
        }
    };

    const columns: Column<Withdrawal>[] = [
        {
            key: 'amount',
            title: '提现金额',
            className: 'w-[140px]',
            render: (row) => (
                <div>
                    <div className="text-base font-semibold text-blue-600">¥{Number(row.amount).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">
                        手续费: ¥{Number(row.fee).toFixed(2)}
                    </div>
                </div>
            ),
        },
        {
            key: 'actualAmount',
            title: '到账金额',
            className: 'w-[100px]',
            render: (row) => (
                <span className="font-semibold text-green-600">¥{Number(row.actualAmount).toFixed(2)}</span>
            ),
        },
        {
            key: 'bank',
            title: '银行卡信息',
            className: 'w-[200px]',
            render: (row) => (
                <div>
                    <div className="font-medium text-slate-800">{row.holderName}</div>
                    <div className="text-xs text-slate-500">{row.bankName}</div>
                    <div className="font-mono text-xs text-slate-400">
                        {row.cardNumber?.replace(/(\d{4})\d+(\d{4})/, '$1****$2')}
                    </div>
                </div>
            ),
        },
        {
            key: 'status',
            title: '状态',
            className: 'w-[100px] text-center',
            render: (row) => {
                const conf = statusLabels[row.status] || statusLabels.PENDING;
                return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
            },
        },
        {
            key: 'createdAt',
            title: '申请时间',
            className: 'w-[160px]',
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-',
        },
        {
            key: 'remark',
            title: '备注',
            className: 'w-[150px]',
            render: (row) => (
                <span className="line-clamp-1 text-slate-500">{row.remark || '-'}</span>
            ),
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[200px]',
            render: (row) => {
                if (row.status !== 'PENDING') {
                    return <span className="text-sm text-slate-400">已处理</span>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            loading={reviewing === row.id}
                            onClick={() => handleApprove(row.id, true)}
                        >
                            ✓ 通过
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            loading={reviewing === row.id}
                            onClick={() => setRejectModal(row.id)}
                        >
                            ✗ 拒绝
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* 筛选栏 */}
            <Card className="bg-white">
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: 'PENDING', label: '待审核' },
                            { value: 'APPROVED', label: '已通过' },
                            { value: 'REJECTED', label: '已拒绝' },
                            { value: '', label: '全部' },
                        ]}
                        className="w-32"
                    />
                    <Button variant="secondary" onClick={loadWithdrawals} className="flex items-center gap-1">
                        🔄 刷新
                    </Button>
                    {filter === 'PENDING' && selectedRowKeys.length > 0 && (
                        <>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                loading={batchLoading}
                                onClick={() => handleBatchApprove(true)}
                            >
                                ✓ 批量通过 ({selectedRowKeys.length})
                            </Button>
                            <Button
                                variant="destructive"
                                loading={batchLoading}
                                onClick={() => handleBatchApprove(false)}
                            >
                                ✗ 批量拒绝 ({selectedRowKeys.length})
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* 提现列表 */}
            <Card className="overflow-hidden bg-white">
                <Table
                    columns={columns}
                    data={withdrawals}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyText="暂无提现记录"
                    selectable={filter === 'PENDING'}
                    selectedKeys={selectedRowKeys}
                    onRowSelect={setSelectedRowKeys}
                    getRowDisabled={(row) => row.status !== 'PENDING'}
                />
            </Card>

            {/* 拒绝弹窗 */}
            <Modal
                title="拒绝提现"
                open={!!rejectModal}
                onClose={() => { setRejectModal(null); setRejectReason(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">拒绝原因</label>
                        <textarea
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={3}
                            placeholder="请输入拒绝原因"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={submitReject}>
                            确认拒绝
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 批量确认弹窗 */}
            <Modal
                title={`确定${batchModal?.action === 'approve' ? '批量通过' : '批量拒绝'}？`}
                open={!!batchModal}
                onClose={() => setBatchModal(null)}
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        将对选中的 <span className="font-semibold text-slate-800">{batchModal?.count}</span> 条记录执行
                        {batchModal?.action === 'approve' ? '批量通过' : '批量拒绝'}操作
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setBatchModal(null)}>
                            取消
                        </Button>
                        <Button
                            className={batchModal?.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                            variant={batchModal?.action === 'reject' ? 'destructive' : 'primary'}
                            loading={batchLoading}
                            onClick={submitBatch}
                        >
                            确认{batchModal?.action === 'approve' ? '通过' : '拒绝'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
