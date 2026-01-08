'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Modal } from '../../../../components/ui/modal';

interface ReviewTask {
    id: string;
    merchantId: string;
    userId: string;
    buynoId: string;
    shopId: string;
    platformOrderNumber: string;
    taskNumber: string;
    userTaskId: string;
    sellerTaskId: string;
    payPrice: number;
    money: number;
    userMoney: number;
    state: number;
    img: string;
    uploadTime: string;
    confirmTime: string;
    payTime: string;
    examineTime: string;
    remarks: string;
    createdAt: string;
    updatedAt: string;
    merchantName?: string;
    buyerName?: string;
}

const statusLabels: Record<number, { text: string; color: 'slate' | 'amber' | 'blue' | 'green' | 'red' }> = {
    0: { text: '未支付', color: 'slate' },
    1: { text: '待审核', color: 'amber' },
    2: { text: '已审核', color: 'blue' },
    3: { text: '已上传', color: 'blue' },
    4: { text: '已完成', color: 'green' },
    5: { text: '已取消', color: 'red' },
    6: { text: '买手拒接', color: 'red' },
    7: { text: '已拒绝', color: 'red' },
};

export default function AdminTasksReviewsPage() {
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stateFilter, setStateFilter] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [detailModal, setDetailModal] = useState<ReviewTask | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);
    const [examineModal, setExamineModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
    const [examineRemark, setExamineRemark] = useState('');
    const [stats, setStats] = useState<{ total?: number; pending?: number; uploaded?: number; completed?: number } | null>(null);

    useEffect(() => { loadTasks(); loadStats(); }, [page, stateFilter]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/review-tasks/admin/list?page=${page}&limit=20`;
            if (stateFilter !== undefined) url += `&state=${stateFilter}`;
            if (search) url += `&taskNumber=${encodeURIComponent(search)}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success && json.data) { setTasks(json.data.list || json.data.data || []); setTotal(json.data.total || 0); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadStats = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setStats(json.data);
        } catch (e) { console.error(e); }
    };

    const handleSearch = () => { setPage(1); loadTasks(); };

    const handleExamine = async () => {
        if (!examineModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/examine`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewTaskId: examineModal.id, state: examineModal.action === 'approve' ? 2 : 7, remarks: examineRemark })
            });
            const json = await res.json();
            if (json.success) { setExamineModal(null); setExamineRemark(''); loadTasks(); loadStats(); setDetailModal(null); }
            else alert(json.message || '操作失败');
        } catch { alert('操作失败'); }
    };

    const handleRefund = async (id: string) => {
        if (!confirm('确定要返款吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/refund/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { loadTasks(); loadStats(); setDetailModal(null); }
            else alert(json.message || '操作失败');
        } catch { alert('操作失败'); }
    };

    const parseImages = (img: string): string[] => {
        if (!img) return [];
        try { const parsed = JSON.parse(img); return Array.isArray(parsed) ? parsed : []; }
        catch { return img.split(',').filter(Boolean); }
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white p-5 text-center">
                        <div className="text-2xl font-semibold text-blue-600">{stats.total || 0}</div>
                        <div className="mt-1 text-slate-500">总任务数</div>
                    </Card>
                    <Card className="bg-white p-5 text-center">
                        <div className="text-2xl font-semibold text-amber-500">{stats.pending || 0}</div>
                        <div className="mt-1 text-slate-500">待审核</div>
                    </Card>
                    <Card className="bg-white p-5 text-center">
                        <div className="text-2xl font-semibold text-purple-600">{stats.uploaded || 0}</div>
                        <div className="mt-1 text-slate-500">已上传</div>
                    </Card>
                    <Card className="bg-white p-5 text-center">
                        <div className="text-2xl font-semibold text-green-600">{stats.completed || 0}</div>
                        <div className="mt-1 text-slate-500">已完成</div>
                    </Card>
                </div>
            )}

            {/* Filter Bar */}
            <Card className="space-y-4 bg-white">
                <div className="flex items-center justify-between">
                    <span className="font-medium">追评任务审核</span>
                    <span className="text-slate-500">共 {total} 条记录</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Input placeholder="搜索任务编号..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-52" />
                    <Select
                        value={stateFilter !== undefined ? String(stateFilter) : ''}
                        onChange={v => { setStateFilter(v !== '' ? parseInt(v) : undefined); setPage(1); }}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: '0', label: '未支付' },
                            { value: '1', label: '待审核' },
                            { value: '2', label: '已审核' },
                            { value: '3', label: '已上传' },
                            { value: '4', label: '已完成' },
                            { value: '5', label: '已取消' },
                            { value: '6', label: '买手拒接' },
                            { value: '7', label: '已拒绝' },
                        ]}
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                </div>
            </Card>

            {/* Task Table */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : tasks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">暂无追评任务</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">任务编号</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">平台订单号</th>
                                        <th className="px-4 py-3.5 text-right text-sm font-medium">任务金额</th>
                                        <th className="px-4 py-3.5 text-right text-sm font-medium">买手佣金</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(t => (
                                        <tr key={t.id} className="border-b border-slate-100">
                                            <td className="px-4 py-3.5 font-mono text-blue-600">{t.taskNumber}</td>
                                            <td className="px-4 py-3.5 font-mono text-slate-500">{t.platformOrderNumber || '-'}</td>
                                            <td className="px-4 py-3.5 text-right font-medium text-red-500">¥{Number(t.money || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3.5 text-right text-green-600">¥{Number(t.userMoney || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={statusLabels[t.state]?.color || 'slate'}>{statusLabels[t.state]?.text || '未知'}</Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">{t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '-'}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(t)}>查看</Button>
                                                    {t.state === 1 && (
                                                        <>
                                                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setExamineModal({ id: t.id, action: 'approve' })}>通过</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => setExamineModal({ id: t.id, action: 'reject' })}>拒绝</Button>
                                                        </>
                                                    )}
                                                    {t.state === 3 && (
                                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleRefund(t.id)}>返款</Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
                            <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={cn(page === 1 && 'cursor-not-allowed opacity-50')}>上一页</Button>
                            <span className="px-3 py-1.5 text-sm text-slate-500">第 {page} 页</span>
                            <Button size="sm" variant="secondary" onClick={() => setPage(p => p + 1)} disabled={tasks.length < 20} className={cn(tasks.length < 20 && 'cursor-not-allowed opacity-50')}>下一页</Button>
                        </div>
                    </>
                )}
            </Card>

            {/* Detail Modal */}
            <Modal title="追评任务详情" open={detailModal !== null} onClose={() => setDetailModal(null)} className="max-w-2xl">
                {detailModal && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm text-slate-500">基本信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-slate-400">任务编号：</span><span className="font-mono text-blue-600">{detailModal.taskNumber}</span></div>
                                <div><span className="text-slate-400">平台订单号：</span><span className="font-mono">{detailModal.platformOrderNumber || '-'}</span></div>
                                <div><span className="text-slate-400">商家ID：</span>{detailModal.merchantId?.slice(0, 8) || '-'}</div>
                                <div><span className="text-slate-400">买手ID：</span>{detailModal.userId?.slice(0, 8) || '-'}</div>
                                <div><span className="text-slate-400">状态：</span><Badge variant="soft" color={statusLabels[detailModal.state]?.color}>{statusLabels[detailModal.state]?.text}</Badge></div>
                            </div>
                        </div>

                        {/* Money Info */}
                        <div>
                            <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm text-slate-500">金额信息</h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div><span className="text-slate-400">任务金额：</span><span className="font-medium text-red-500">¥{Number(detailModal.money || 0).toFixed(2)}</span></div>
                                <div><span className="text-slate-400">买手佣金：</span><span className="font-medium text-green-600">¥{Number(detailModal.userMoney || 0).toFixed(2)}</span></div>
                                <div><span className="text-slate-400">订单金额：</span><span className="text-slate-600">¥{Number(detailModal.payPrice || 0).toFixed(2)}</span></div>
                            </div>
                        </div>

                        {/* Images */}
                        {detailModal.img && parseImages(detailModal.img).length > 0 && (
                            <div>
                                <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm text-slate-500">追评截图</h4>
                                <div className="flex flex-wrap gap-3">
                                    {parseImages(detailModal.img).map((url, index) => (
                                        <img key={index} src={url} alt={`追评截图${index + 1}`} className="h-[120px] w-[120px] cursor-pointer rounded border border-slate-200 object-cover" onClick={() => setImageModal(url)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Remarks */}
                        {detailModal.remarks && (
                            <div className="rounded border border-green-200 bg-green-50 p-3">
                                <span className="font-medium text-green-600">审核备注：</span>
                                <span className="text-slate-700">{detailModal.remarks}</span>
                            </div>
                        )}

                        {/* Time Records */}
                        <div>
                            <h4 className="mb-3 border-b border-slate-100 pb-2 text-sm text-slate-500">时间记录</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-slate-400">创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                {detailModal.payTime && <div><span className="text-slate-400">支付时间：</span>{new Date(detailModal.payTime).toLocaleString('zh-CN')}</div>}
                                {detailModal.examineTime && <div><span className="text-slate-400">审核时间：</span>{new Date(detailModal.examineTime).toLocaleString('zh-CN')}</div>}
                                {detailModal.uploadTime && <div><span className="text-slate-400">上传时间：</span>{new Date(detailModal.uploadTime).toLocaleString('zh-CN')}</div>}
                                {detailModal.confirmTime && <div><span className="text-slate-400">完成时间：</span>{new Date(detailModal.confirmTime).toLocaleString('zh-CN')}</div>}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            {detailModal.state === 1 && (
                                <>
                                    <Button className="bg-green-500 hover:bg-green-600" onClick={() => setExamineModal({ id: detailModal.id, action: 'approve' })}>通过审核</Button>
                                    <Button variant="destructive" onClick={() => setExamineModal({ id: detailModal.id, action: 'reject' })}>拒绝</Button>
                                </>
                            )}
                            {detailModal.state === 3 && (
                                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleRefund(detailModal.id)}>返款完成</Button>
                            )}
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>关闭</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Image Preview Modal */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80">
                    <img src={imageModal} alt="预览" className="max-h-[90%] max-w-[90%] object-contain" />
                </div>
            )}

            {/* Examine Modal */}
            <Modal title={examineModal?.action === 'approve' ? '通过审核' : '拒绝任务'} open={examineModal !== null} onClose={() => { setExamineModal(null); setExamineRemark(''); }}>
                <textarea
                    value={examineRemark}
                    onChange={e => setExamineRemark(e.target.value)}
                    placeholder={examineModal?.action === 'approve' ? '审核备注（可选）...' : '请输入拒绝原因...'}
                    rows={4}
                    className="mb-4 w-full resize-y rounded border border-slate-200 p-2.5"
                />
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setExamineModal(null); setExamineRemark(''); }}>取消</Button>
                    <Button onClick={handleExamine} className={examineModal?.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                        {examineModal?.action === 'approve' ? '确认通过' : '确认拒绝'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
