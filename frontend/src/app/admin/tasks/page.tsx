'use client';

import { useState, useEffect, useMemo } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn, formatDate } from '../../../lib/utils';
import { toastError, toastSuccess } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';
import { Tabs } from '../../../components/ui/tabs';
import { TASK_TYPE_NAMES } from '../../../constants/platformConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    shopAccount?: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    createdAt: string;
    url: string;
    mainImage: string;
    keyword: string;
    taoWord: string;
    platformProductId: string;
    qrCode: string;
    remark: string;
    merchantId: string;
    merchant?: { id: string; username: string; merchantName: string; phone: string };
    goodsMoney: number;
    shippingFee: number;
    margin: number;
    extraReward: number;
    baseServiceFee: number;
    refundServiceFee: number;
    totalDeposit: number;
    totalCommission: number;
    isPraise: boolean;
    praiseFee: number;
    isImgPraise: boolean;
    imgPraiseFee: number;
    isVideoPraise: boolean;
    videoPraiseFee: number;
    terminal: number;
    taskTimeLimit: number;
    isFreeShipping: boolean;
    isPresale: boolean;
    praiseType: string;
    praiseList: string;
    praiseImgList: string;
    praiseVideoList: string;
    isTimingPublish: boolean;
    publishTime: string;
    updatedAt: string;
    goodsNum?: number;
}

const statusLabels: Record<number, { text: string; color: 'slate' | 'green' | 'blue' | 'red' | 'amber' }> = {
    0: { text: '待支付', color: 'slate' },
    1: { text: '进行中', color: 'green' },
    2: { text: '已完成', color: 'blue' },
    3: { text: '已取消', color: 'red' },
    4: { text: '待审核', color: 'amber' },
};

const terminalLabels: Record<number, string> = { 1: '本佣货返', 2: '本立佣货' };

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Task | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const statusOptions = useMemo(
        () =>
            Object.entries(statusLabels).map(([k, v]) => ({
                value: String(k),
                label: v.text,
            })),
        []
    );

    useEffect(() => { loadTasks(); }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedIds([]);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { setTasks(json.data); setTotal(json.total || json.data.length); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === tasks.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tasks.map(t => t.id));
        }
    };

    const handleBatchApprove = async () => {
        if (selectedIds.length === 0) {
            toastError('请先选择任务');
            return;
        }
        if (!confirm(`确定要批量通过 ${selectedIds.length} 个任务吗？`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            for (const id of selectedIds) {
                await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: 1 })
                });
            }
            toastSuccess(`已批量通过 ${selectedIds.length} 个任务`);
            loadTasks();
        } catch (e) {
            toastError('批量操作失败');
        }
    };

    const handleBatchReject = async () => {
        if (selectedIds.length === 0) {
            toastError('请先选择任务');
            return;
        }
        if (!confirm(`确定要批量拒绝 ${selectedIds.length} 个任务吗？`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            for (const id of selectedIds) {
                await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: 3 })
                });
            }
            toastSuccess(`已批量拒绝 ${selectedIds.length} 个任务`);
            loadTasks();
        } catch (e) {
            toastError('批量操作失败');
        }
    };

    const handleUpdateStatus = async (id: string, status: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('状态更新成功');
                loadTasks();
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/tasks?`;
            if (filter !== undefined) url += `status=${filter}&`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `tasks_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
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

    const columns: Column<Task>[] = [
        {
            key: 'checkbox',
            title: (
                <input
                    type="checkbox"
                    checked={tasks.length > 0 && selectedIds.length === tasks.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#d1d5db]"
                />
            ),
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="h-4 w-4 rounded border-[#d1d5db]"
                />
            ),
            className: 'w-[50px]',
        },
        {
            key: 'taskNumber',
            title: '任务编号',
            render: (row) => <code className="text-[12px] text-[#6b7280]">{row.taskNumber}</code>,
            className: 'w-[130px]',
        },
        {
            key: 'merchant',
            title: '商家',
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-[#3b4559]">{row.merchant?.username || row.merchant?.merchantName || '-'}</div>
                    <div className="text-xs text-[#9ca3af]">{row.shopName || '-'}</div>
                </div>
            ),
            className: 'w-[140px]',
        },
        {
            key: 'taskType',
            title: '平台',
            render: (row) => <span className="text-[#5a6577]">{TASK_TYPE_NAMES[row.taskType] || '其他'}</span>,
            className: 'w-[80px]',
        },
        {
            key: 'terminal',
            title: '返款方式',
            render: (row) => (
                <Badge variant="soft" color={row.terminal === 1 ? 'blue' : 'green'}>
                    {terminalLabels[row.terminal] || '-'}
                </Badge>
            ),
            className: 'w-[90px]',
        },
        {
            key: 'goodsPrice',
            title: '商品售价',
            render: (row) => <span className="font-medium text-[#3b4559]">¥{Number(row.goodsPrice).toFixed(2)}</span>,
            className: 'w-[100px] text-right',
        },
        {
            key: 'progress',
            title: '已接/完成',
            render: (row) => (
                <div className="text-sm">
                    <span className="text-primary-600">{row.claimedCount}</span>
                    <span className="text-[#9ca3af]"> / </span>
                    <span className="text-success-500">{row.completedCount || 0}</span>
                    <span className="text-[#9ca3af]"> / </span>
                    <span className="text-[#6b7280]">{row.count}</span>
                </div>
            ),
            className: 'w-[110px]',
        },
        {
            key: 'shipping',
            title: '邮费',
            render: (row) => (
                <Badge variant="soft" color={row.isFreeShipping ? 'green' : 'slate'}>
                    {row.isFreeShipping ? '包邮' : '非包邮'}
                </Badge>
            ),
            className: 'w-[80px] text-center',
        },
        {
            key: 'status',
            title: '状态',
            render: (row) => {
                const config = statusLabels[row.status] || statusLabels[0];
                return (
                    <Badge variant="soft" color={config.color}>
                        {config.text}
                    </Badge>
                );
            },
            className: 'w-[90px] text-center',
        },
        {
            key: 'createdAt',
            title: '发布时间',
            render: (row) => <span className="text-xs text-[#6b7280]">{formatDate(row.createdAt)}</span>,
            className: 'w-[100px]',
        },
        {
            key: 'actions',
            title: '操作',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(row)}>
                        详情
                    </Button>
                    <div className="w-24">
                        <Select
                            value={String(row.status)}
                            onChange={(value) => handleUpdateStatus(row.id, Number(value))}
                            options={statusOptions}
                        />
                    </div>
                </div>
            ),
            className: 'w-[200px]',
        },
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">任务列表</span>
                    <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[13px] font-medium text-[#3b4559]">状态筛选：</span>
                    <Tabs
                        value={String(filter ?? 'all')}
                        onChange={(val) => {
                            setFilter(val === 'all' ? undefined : Number(val));
                            setPage(1);
                        }}
                        items={[
                            { key: 'all', label: '全部' },
                            { key: '1', label: '进行中' },
                            { key: '4', label: '待审核' },
                            { key: '2', label: '已完成' },
                            { key: '3', label: '已取消' },
                        ]}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <>
                                <span className="text-sm text-[#6b7280]">已选 {selectedIds.length} 项</span>
                                <Button onClick={handleBatchApprove}>
                                    批量通过
                                </Button>
                                <Button variant="destructive" onClick={handleBatchReject}>
                                    批量拒绝
                                </Button>
                            </>
                        )}
                        <Button variant="secondary" onClick={loadTasks}>
                            刷新
                        </Button>
                        <Button
                            onClick={handleExport}
                            loading={exporting}
                            variant="success"
                        >
                            导出Excel
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden bg-white">
                <Table
                    columns={columns}
                    data={tasks}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyText="暂无任务数据"
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

            <Modal
                title="任务详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-4xl"
            >
                {detailModal && (
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        {/* 顶部主图 */}
                        {detailModal.mainImage && (
                            <div className="mb-6 flex justify-center">
                                <img
                                    src={detailModal.mainImage}
                                    alt="商品图"
                                    className="h-48 rounded-md object-contain"
                                />
                            </div>
                        )}

                        {/* 基本信息 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">基本信息</h3>
                            <div className="grid grid-cols-1 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">任务编号</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.taskNumber}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">平台</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{TASK_TYPE_NAMES[detailModal.taskType]}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">状态</div>
                                    <div>
                                        <Badge variant="soft" color={statusLabels[detailModal.status]?.color}>
                                            {statusLabels[detailModal.status]?.text}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                    <div className="text-[12px] text-[#6b7280]">标题</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.title}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">店铺</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.shopName || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">关键词</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.keyword || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">结算方式</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{terminalLabels[detailModal.terminal] || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* 任务进度 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">任务进度</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总单数</div>
                                    <div className="text-lg font-bold text-[#3b4559]">{detailModal.count}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">已领取</div>
                                    <div className="text-lg font-bold text-primary-600">{detailModal.claimedCount}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">已完成</div>
                                    <div className="text-lg font-bold text-success-500">{detailModal.completedCount || 0}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">剩余</div>
                                    <div className="text-lg font-bold text-warning-500">
                                        {detailModal.count - detailModal.claimedCount}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 费用信息 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">费用信息</h3>
                            <div className="grid grid-cols-1 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-3">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">商品单价</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.goodsPrice).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总押金</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.totalDeposit || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总佣金</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.totalCommission || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* 增值服务 */}
                        <div>
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">增值服务</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">文字好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">图片好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isImgPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isImgPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">视频好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isVideoPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isVideoPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">包邮</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isFreeShipping ? "text-primary-600" : "text-[#9ca3af]")}>
                                        {detailModal.isFreeShipping ? '是' : '否'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 好评内容详情 */}
                        {detailModal.isPraise && (
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">好评具体内容</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    <div className="space-y-2">
                                        {(() => {
                                            try {
                                                const list = detailModal.praiseList ? JSON.parse(detailModal.praiseList) : [];
                                                if (!list || list.length === 0) return <div className="text-xs text-[#9ca3af]">无好评内容</div>;
                                                return list.map((txt: string, i: number) => (
                                                    <div key={i} className="text-[13px] text-[#3b4559] flex gap-2">
                                                        <span className="text-[#9ca3af] font-mono shrink-0">{i + 1}.</span>
                                                        <span>{txt}</span>
                                                    </div>
                                                ));
                                            } catch (e) { return <div className="text-xs text-red-400">内容解析失败</div>; }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>
                                关闭
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
