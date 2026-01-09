'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { toastSuccess, toastError, toastWarning } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';

interface Withdrawal {
    id: string;
    userId: string;
    username?: string;
    phone?: string;
    userType?: number;
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

const statusLabels: Record<string, { text: string; color: 'amber' | 'green' | 'red' | 'slate' | 'blue' }> = {
    '0': { text: '待审核', color: 'amber' },
    '1': { text: '待打款', color: 'blue' },
    '2': { text: '已拒绝', color: 'red' },
    '3': { text: '已完成', color: 'green' },
};

const userTypeLabels: Record<number, { text: string; color: 'green' | 'blue' }> = {
    1: { text: '买手', color: 'green' },
    2: { text: '商家', color: 'blue' },
};

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('0');
    const [reviewing, setReviewing] = useState<string | null>(null);
    const [confirming, setConfirming] = useState<string | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    // Reject modal
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Batch modal
    const [batchModal, setBatchModal] = useState<{ action: 'approve' | 'reject'; count: number } | null>(null);
    const [exporting, setExporting] = useState(false);
    const [keyword, setKeyword] = useState('');

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

    const handleConfirmPayment = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        setConfirming(id);
        try {
            const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/confirm-payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('已确认打款');
                loadWithdrawals();
            } else {
                toastError(json.message || '操作失败');
            }
        } catch (e) {
            toastError('操作失败');
        } finally {
            setConfirming(null);
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

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/withdrawals?status=${filter}`;
            if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `withdrawals_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toastSuccess('导出成功');
            } else {
                toastError('导出失败');
            }
        } catch (e) {
            toastError('导出失败');
        } finally {
            setExporting(false);
        }
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
            key: 'user',
            title: '用户信息',
            className: 'w-[150px]',
            render: (row) => (
                <div>
                    <div className="font-medium text-[#3b4559]">{row.username || '-'}</div>
                    <div className="text-xs text-[#9ca3af]">{row.phone || '-'}</div>
                    <Badge variant="soft" color={userTypeLabels[row.userType || 1]?.color || 'slate'} className="mt-0.5">
                        {userTypeLabels[row.userType || 1]?.text || '买手'}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'amount',
            title: '提现金额',
            className: 'w-[140px]',
            render: (row) => (
                <div>
                    <div className="text-base font-semibold text-primary-600">¥{Number(row.amount).toFixed(2)}</div>
                    <div className="text-xs text-[#9ca3af]">
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
                <span className="font-semibold text-success-400">¥{Number(row.actualAmount).toFixed(2)}</span>
            ),
        },
        {
            key: 'bank',
            title: '银行卡信息',
            className: 'w-[200px]',
            render: (row) => (
                <div>
                    <div className="font-medium text-[#3b4559]">{row.holderName}</div>
                    <div className="text-xs text-[#6b7280]">{row.bankName}</div>
                    <div className="font-mono text-xs text-[#9ca3af]">
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
                const conf = statusLabels[String(row.status)] || statusLabels['0'];
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
                <span className="line-clamp-1 text-[#6b7280]">{row.remark || '-'}</span>
            ),
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[200px]',
            render: (row) => {
                if (String(row.status) === '0') {
                    return (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="bg-success-400 hover:bg-success-500"
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
                }
                if (String(row.status) === '1') {
                    return (
                        <Button
                            size="sm"
                            className="bg-primary-500 hover:bg-primary-600"
                            loading={confirming === row.id}
                            onClick={() => handleConfirmPayment(row.id)}
                        >
                            确认打款
                        </Button>
                    );
                }
                return <span className="text-sm text-[#9ca3af]">已处理</span>;
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* 筛选栏 */}
            <Card className="bg-white">
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索用户名/手机号..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadWithdrawals()}
                        className="w-48"
                    />
                    <Select
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: '0', label: '待审核' },
                            { value: '1', label: '待打款' },
                            { value: '3', label: '已完成' },
                            { value: '2', label: '已拒绝' },
                            { value: '', label: '全部' },
                        ]}
                        className="w-32"
                    />
                    <Button variant="secondary" onClick={loadWithdrawals} className="flex items-center gap-1">
                        刷新
                    </Button>
                    <Button
                        onClick={handleExport}
                        loading={exporting}
                        variant="success"
                    >
                        导出Excel
                    </Button>
                    {filter === '0' && selectedRowKeys.length > 0 && (
                        <>
                            <Button
                                className="bg-success-400 hover:bg-success-500"
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
                    selectable={filter === '0'}
                    selectedKeys={selectedRowKeys}
                    onRowSelect={setSelectedRowKeys}
                    getRowDisabled={(row) => String(row.status) !== '0'}
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
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">拒绝原因</label>
                        <textarea
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <p className="text-[#4b5563]">
                        将对选中的 <span className="font-semibold text-[#3b4559]">{batchModal?.count}</span> 条记录执行
                        {batchModal?.action === 'approve' ? '批量通过' : '批量拒绝'}操作
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setBatchModal(null)}>
                            取消
                        </Button>
                        <Button
                            className={batchModal?.action === 'approve' ? 'bg-success-400 hover:bg-success-500' : ''}
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
