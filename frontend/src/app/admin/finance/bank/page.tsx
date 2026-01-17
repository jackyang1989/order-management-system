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
import Image from 'next/image';

interface BankCard {
    id: string;
    userId: string;
    username?: string;
    userType?: number;
    bankName: string;
    accountName: string;
    cardNumber: string;
    phone: string;
    province: string;
    city: string;
    branchName: string;
    idCard: string;
    idCardFrontImage: string;
    idCardBackImage: string;
    wechatQrCode?: string;
    alipayQrCode?: string;
    isDefault: boolean;
    status: number;
    rejectReason: string;
    createdAt: string;
    updatedAt: string;
}

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '已通过', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
};

const userTypeLabels: Record<number, { text: string; color: 'green' | 'blue' }> = {
    1: { text: '买手', color: 'green' },
    2: { text: '商家', color: 'blue' },
};

export default function AdminFinanceBankPage() {
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const [detailModal, setDetailModal] = useState<BankCard | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [deleteModal, setDeleteModal] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadCards();
    }, [page, statusFilter]);

    const loadCards = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/bank-cards/admin/list?page=${page}&limit=20`;
            if (statusFilter !== '') url += `&status=${statusFilter}`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setCards(json.data || []);
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
        loadCards();
    };

    const handleApprove = async (id: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/bank-cards/admin/${id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadCards();
                setDetailModal(null);
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/bank-cards/admin/${rejectModal}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason || '审核不通过' })
            });
            const json = await res.json();
            if (json.success) {
                setRejectModal(null);
                setRejectReason('');
                loadCards();
                setDetailModal(null);
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        const token = localStorage.getItem('adminToken');
        setDeleting(true);
        try {
            const res = await fetch(`${BASE_URL}/bank-cards/admin/${deleteModal}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setDeleteModal(null);
                loadCards();
                setDetailModal(null);
            } else {
                alert(json.message || '删除失败');
            }
        } catch (e) {
            alert('删除失败');
        } finally {
            setDeleting(false);
        }
    };

    const maskCardNumber = (num: string) => {
        if (!num || num.length < 8) return num;
        return num.slice(0, 4) + ' **** **** ' + num.slice(-4);
    };

    return (
        <>
        <Card className="bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
                <span className="text-base font-medium">账户审核</span>
                <span className="text-[#6b7280]">共 {total} 条记录</span>
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
                <Input
                    placeholder="搜索持卡人/卡号..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="w-52"
                />
                <Select
                    value={statusFilter}
                    onChange={v => { setStatusFilter(v); setPage(1); }}
                    options={[
                        { value: '', label: '全部状态' },
                        { value: '0', label: '待审核' },
                        { value: '1', label: '已通过' },
                        { value: '2', label: '已拒绝' },
                    ]}
                    className="w-32"
                />
                <Button onClick={handleSearch}>搜索</Button>
            </div>

            <div className="overflow-hidden">
                {loading ? (
                    <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                ) : cards.length === 0 ? (
                    <div className="py-12 text-center text-[#9ca3af]">暂无收款账户记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">用户信息</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">持卡人</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">银行</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">卡号</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">开户行</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">提交时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cards.map(c => (
                                        <tr key={c.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-[#3b4559]">{c.username || '-'}</div>
                                                <Badge variant="soft" color={userTypeLabels[c.userType || 1]?.color || 'green'} className="mt-0.5">
                                                    {userTypeLabels[c.userType || 1]?.text || '买手'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium">{c.accountName}</td>
                                            <td className="px-4 py-3.5 text-[#6b7280]">{c.bankName}</td>
                                            <td className="px-4 py-3.5 font-mono">{maskCardNumber(c.cardNumber)}</td>
                                            <td className="max-w-[150px] truncate px-4 py-3.5 text-[#6b7280]">{c.branchName || '-'}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={statusLabels[c.status]?.color || 'slate'}>
                                                    {statusLabels[c.status]?.text || '未知'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{c.createdAt ? new Date(c.createdAt).toLocaleString('zh-CN') : '-'}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(c)}>查看</Button>
                                                    {c.status === 0 && (
                                                        <>
                                                            <Button size="sm" className="bg-green-500 text-white hover:bg-success-400" onClick={() => handleApprove(c.id)}>通过</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => setRejectModal(c.id)}>拒绝</Button>
                                                        </>
                                                    )}
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteModal(c.id)}>删除</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-[#f3f4f6] pt-4 mt-4">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={cn(page === 1 && 'cursor-not-allowed opacity-50')}
                            >
                                上一页
                            </Button>
                            <span className="px-3 text-sm text-[#6b7280]">第 {page} 页</span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage(p => p + 1)}
                                disabled={cards.length < 20}
                                className={cn(cards.length < 20 && 'cursor-not-allowed opacity-50')}
                            >
                                下一页
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Card>

            {/* Detail Modal */}
            <Modal title="银行卡详情" open={detailModal !== null} onClose={() => setDetailModal(null)} className="max-w-xl">
                {detailModal && (
                    <div className="space-y-6">
                        {/* Bank Card Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">银行卡信息</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">持卡人：</span><span className="font-medium">{detailModal.accountName}</span></div>
                                <div><span className="text-[#9ca3af]">银行：</span>{detailModal.bankName}</div>
                                <div><span className="text-[#9ca3af]">卡号：</span><span className="font-mono">{detailModal.cardNumber}</span></div>
                                <div><span className="text-[#9ca3af]">预留手机：</span>{detailModal.phone || '-'}</div>
                                <div><span className="text-[#9ca3af]">开户省市：</span>{detailModal.province || ''} {detailModal.city || ''}</div>
                                <div><span className="text-[#9ca3af]">开户支行：</span>{detailModal.branchName || '-'}</div>
                                <div><span className="text-[#9ca3af]">身份证号：</span>{detailModal.idCard ? detailModal.idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2') : '-'}</div>
                                <div><span className="text-[#9ca3af]">状态：</span>
                                    <Badge variant="soft" color={statusLabels[detailModal.status]?.color}>{statusLabels[detailModal.status]?.text}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* ID Card Images */}
                        {(detailModal.idCardFrontImage || detailModal.idCardBackImage) && (
                            <div>
                                <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">身份证照片</h4>
                                <div className="flex flex-wrap gap-4">
                                    {detailModal.idCardFrontImage && (
                                        <div className="text-center">
                                            <Image
                                                src={detailModal.idCardFrontImage}
                                                alt="身份证正面"
                                                width={180}
                                                height={120}
                                                className="h-[120px] w-[180px] cursor-pointer rounded border border-[#e5e7eb] object-cover"
                                                onClick={() => setImageModal(detailModal.idCardFrontImage)}
                                                unoptimized
                                            />
                                            <div className="mt-1 text-xs text-[#6b7280]">身份证正面</div>
                                        </div>
                                    )}
                                    {detailModal.idCardBackImage && (
                                        <div className="text-center">
                                            <Image
                                                src={detailModal.idCardBackImage}
                                                alt="身份证背面"
                                                width={180}
                                                height={120}
                                                className="h-[120px] w-[180px] cursor-pointer rounded border border-[#e5e7eb] object-cover"
                                                onClick={() => setImageModal(detailModal.idCardBackImage)}
                                                unoptimized
                                            />
                                            <div className="mt-1 text-xs text-[#6b7280]">身份证背面</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment QR Codes */}
                        {(detailModal.wechatQrCode || detailModal.alipayQrCode) && (
                            <div>
                                <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">收款码</h4>
                                <div className="flex flex-wrap gap-4">
                                    {detailModal.wechatQrCode && (
                                        <div className="text-center">
                                            <Image
                                                src={detailModal.wechatQrCode}
                                                alt="微信收款码"
                                                width={120}
                                                height={120}
                                                className="h-[120px] w-[120px] cursor-pointer rounded border border-green-200 object-cover"
                                                onClick={() => setImageModal(detailModal.wechatQrCode!)}
                                                unoptimized
                                            />
                                            <div className="mt-1 text-xs text-green-600">微信收款码</div>
                                        </div>
                                    )}
                                    {detailModal.alipayQrCode && (
                                        <div className="text-center">
                                            <Image
                                                src={detailModal.alipayQrCode}
                                                alt="支付宝收款码"
                                                width={120}
                                                height={120}
                                                className="h-[120px] w-[120px] cursor-pointer rounded border border-blue-200 object-cover"
                                                onClick={() => setImageModal(detailModal.alipayQrCode!)}
                                                unoptimized
                                            />
                                            <div className="mt-1 text-xs text-blue-600">支付宝收款码</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reject Reason */}
                        {detailModal.status === 2 && detailModal.rejectReason && (
                            <div className="rounded border border-red-200 bg-red-50 p-3">
                                <span className="font-medium text-danger-400">拒绝原因：</span>
                                <span className="text-danger-400">{detailModal.rejectReason}</span>
                            </div>
                        )}

                        {/* Time Info */}
                        <div>
                            <h4 className="mb-3 border-b border-[#f3f4f6] pb-2 text-sm font-medium text-[#4b5563]">时间记录</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-[#9ca3af]">提交时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                <div><span className="text-[#9ca3af]">更新时间：</span>{detailModal.updatedAt ? new Date(detailModal.updatedAt).toLocaleString('zh-CN') : '-'}</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            {detailModal.status === 0 && (
                                <>
                                    <Button className="bg-green-500 text-white hover:bg-success-400" onClick={() => handleApprove(detailModal.id)}>通过审核</Button>
                                    <Button variant="destructive" onClick={() => setRejectModal(detailModal.id)}>拒绝</Button>
                                </>
                            )}
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>关闭</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Image Preview Modal */}
            {imageModal && (
                <div
                    onClick={() => setImageModal(null)}
                    className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80"
                >
                    <Image src={imageModal} alt="预览" width={800} height={600} className="max-h-[90%] max-w-[90%] object-contain" unoptimized />
                </div>
            )}

            {/* Reject Reason Modal */}
            <Modal title="拒绝原因" open={rejectModal !== null} onClose={() => { setRejectModal(null); setRejectReason(''); }} className="max-w-sm">
                <div className="space-y-4">
                    <textarea
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="请输入拒绝原因..."
                        rows={4}
                        className="w-full resize-y rounded border border-[#d1d5db] p-2.5"
                    />
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>取消</Button>
                        <Button variant="destructive" onClick={handleReject}>确认拒绝</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal title="确认删除" open={deleteModal !== null} onClose={() => setDeleteModal(null)} className="max-w-sm">
                <div className="space-y-4">
                    <p className="text-[#4b5563]">确定要删除这张银行卡吗？此操作不可恢复。</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteModal(null)}>取消</Button>
                        <Button variant="destructive" loading={deleting} onClick={handleDelete}>确认删除</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
