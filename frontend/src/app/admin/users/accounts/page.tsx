'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface BuyerAccount {
    id: string;
    userId: string;
    user?: {
        username: string;
        phone: string;
    };
    platform: string;
    accountName: string;
    province?: string;
    city?: string;
    district?: string;
    receiverName?: string;
    receiverPhone?: string;
    fullAddress?: string;
    alipayName?: string;
    idCardImage?: string;
    alipayImage?: string;
    archiveImage?: string;
    ipImage?: string;
    wangwangProvince?: string;
    wangwangCity?: string;
    addressRemark?: string;
    star: number;
    status: number;
    rejectReason?: string;
    createdAt: string;
}

const platformNames: Record<string, string> = {
    '淘宝': '淘宝',
    '京东': '京东',
    '拼多多': '拼多多',
    '1': '淘宝',
    '2': '京东',
    '3': '拼多多',
};

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: '#faad14' },
    1: { text: '已通过', color: '#52c41a' },
    2: { text: '已拒绝', color: '#ff4d4f' },
    3: { text: '已删除', color: '#999' }
};

export default function AdminBuyerAccountsPage() {
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>('0');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<BuyerAccount | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => {
        loadAccounts();
    }, [page, filterStatus]);

    const loadAccounts = async () => {
        setLoading(true);
        setSelectedIds(new Set());
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');
            if (filterStatus) {
                params.append('status', filterStatus);
            }

            const res = await fetch(`${BASE_URL}/admin/buyer-accounts?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(data.data || []);
                setTotal(data.total || 0);
                setTotalPages(Math.ceil((data.total || 0) / 20));
            }
        } catch (error) {
            console.error('获取买号列表失败:', error);
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        if (!confirm('确定要通过该买号吗？')) return;
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ approved: true })
            });
            const data = await res.json();
            if (data.success) {
                alert('审核通过');
                loadAccounts();
                setDetailModal(null);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('操作失败');
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) {
            alert('请输入拒绝理由');
            return;
        }
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ approved: false, rejectReason })
            });
            const data = await res.json();
            if (data.success) {
                alert('已拒绝');
                setRejectingId(null);
                setRejectReason('');
                loadAccounts();
                setDetailModal(null);
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('操作失败');
        }
    };

    const handleSetStar = async (id: string, star: number) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/${id}/star`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ star })
            });
            const data = await res.json();
            if (data.success) {
                alert('星级设置成功');
                loadAccounts();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('操作失败');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = accounts.filter(a => a.status === 0).map(a => a.id);
            setSelectedIds(new Set(pendingIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    const handleBatchReview = async (approved: boolean) => {
        if (selectedIds.size === 0) {
            alert('请先选择要操作的记录');
            return;
        }
        const action = approved ? '批量通过' : '批量拒绝';
        if (!confirm(`确定要${action}选中的 ${selectedIds.size} 条记录吗？`)) return;

        const rejectReasonInput = approved ? '' : prompt('请输入拒绝原因（可选）：') || '';
        setBatchLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/buyer-accounts/batch-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    ids: Array.from(selectedIds),
                    approved,
                    rejectReason: rejectReasonInput
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                loadAccounts();
            } else {
                alert(data.message || '操作失败');
            }
        } catch (error) {
            alert('操作失败');
        } finally {
            setBatchLoading(false);
        }
    };

    const pendingAccounts = accounts.filter(a => a.status === 0);
    const allPendingSelected = pendingAccounts.length > 0 && pendingAccounts.every(a => selectedIds.has(a.id));

    const renderImageThumbnail = (url: string | undefined, label: string) => {
        if (!url) return null;
        return (
            <div style={{ textAlign: 'center' }}>
                <img
                    src={url}
                    alt={label}
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                    onClick={() => setImageModal(url)}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
            </div>
        );
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>买号审核</span>
                    <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                        <option value="">全部状态</option>
                        <option value="0">待审核</option>
                        <option value="1">已通过</option>
                        <option value="2">已拒绝</option>
                    </select>
                </div>
                {filterStatus === '0' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleBatchReview(true)} disabled={batchLoading || selectedIds.size === 0}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: selectedIds.size === 0 ? '#d9d9d9' : '#52c41a', color: '#fff', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                            {batchLoading ? '处理中...' : `批量通过 (${selectedIds.size})`}
                        </button>
                        <button onClick={() => handleBatchReview(false)} disabled={batchLoading || selectedIds.size === 0}
                            style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ff4d4f', background: selectedIds.size === 0 ? '#f5f5f5' : '#fff', color: selectedIds.size === 0 ? '#999' : '#ff4d4f', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                            批量拒绝
                        </button>
                    </div>
                )}
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>
                ) : accounts.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>暂无数据</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    {filterStatus === '0' && (
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0', width: '50px' }}>
                                            <input type="checkbox" checked={allPendingSelected} onChange={(e) => handleSelectAll(e.target.checked)} style={{ cursor: 'pointer' }} />
                                        </th>
                                    )}
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>买号账号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>收货信息</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>星级</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提交时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(a => (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        {filterStatus === '0' && (
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                {a.status === 0 && <input type="checkbox" checked={selectedIds.has(a.id)} onChange={(e) => handleSelectOne(a.id, e.target.checked)} style={{ cursor: 'pointer' }} />}
                                            </td>
                                        )}
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: '500', color: '#1890ff' }}>{a.accountName}</div>
                                            {a.alipayName && <div style={{ fontSize: '12px', color: '#999' }}>支付宝: {a.alipayName}</div>}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>{platformNames[a.platform] || a.platform || '未知'}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: '13px' }}>{a.receiverName} {a.receiverPhone}</div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>{a.province} {a.city}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <select value={a.star} onChange={(e) => handleSetStar(a.id, parseInt(e.target.value))}
                                                style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}>
                                                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}星</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: statusLabels[a.status]?.color + '20', color: statusLabels[a.status]?.color }}>{statusLabels[a.status]?.text}</span>
                                            {a.rejectReason && <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: '4px' }}>{a.rejectReason}</div>}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <button onClick={() => setDetailModal(a)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer' }}>查看</button>
                                                {a.status === 0 && (
                                                    <>
                                                        <button onClick={() => handleApprove(a.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer' }}>通过</button>
                                                        <button onClick={() => setRejectingId(a.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>拒绝</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '8px' }}>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    style={{ padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', background: page === 1 ? '#f5f5f5' : '#fff' }}>上一页</button>
                                <span style={{ padding: '0 16px' }}>{page} / {totalPages} (共 {total} 条)</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    style={{ padding: '8px 16px', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer', background: page === totalPages ? '#f5f5f5' : '#fff' }}>下一页</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>买号详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* 基本信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>基本信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>账号名称：</span><span style={{ fontWeight: '500' }}>{detailModal.accountName}</span></div>
                                    <div><span style={{ color: '#999' }}>平台：</span>{platformNames[detailModal.platform] || detailModal.platform}</div>
                                    <div><span style={{ color: '#999' }}>支付宝姓名：</span>{detailModal.alipayName || '-'}</div>
                                    <div><span style={{ color: '#999' }}>星级：</span>{detailModal.star}星</div>
                                    <div><span style={{ color: '#999' }}>状态：</span>
                                        <span style={{ color: statusLabels[detailModal.status]?.color }}>{statusLabels[detailModal.status]?.text}</span>
                                    </div>
                                    <div><span style={{ color: '#999' }}>提交时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                </div>
                            </div>

                            {/* 收货信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>收货信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>收货人：</span>{detailModal.receiverName || '-'}</div>
                                    <div><span style={{ color: '#999' }}>手机号：</span>{detailModal.receiverPhone || '-'}</div>
                                    <div><span style={{ color: '#999' }}>省份：</span>{detailModal.province || '-'}</div>
                                    <div><span style={{ color: '#999' }}>城市：</span>{detailModal.city || '-'}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#999' }}>详细地址：</span>{detailModal.fullAddress || '-'}</div>
                                </div>
                            </div>

                            {/* 旺旺信息 */}
                            {(detailModal.wangwangProvince || detailModal.wangwangCity || detailModal.addressRemark) && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>旺旺信息</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><span style={{ color: '#999' }}>旺旺省份：</span>{detailModal.wangwangProvince || '-'}</div>
                                        <div><span style={{ color: '#999' }}>旺旺城市：</span>{detailModal.wangwangCity || '-'}</div>
                                        {detailModal.addressRemark && (
                                            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#999' }}>地址备注：</span>{detailModal.addressRemark}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 认证图片 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>认证图片</h4>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {renderImageThumbnail(detailModal.idCardImage, '身份证截图')}
                                    {renderImageThumbnail(detailModal.alipayImage, '支付宝认证')}
                                    {renderImageThumbnail(detailModal.archiveImage, '旺旺档案')}
                                    {renderImageThumbnail(detailModal.ipImage, 'IP截图')}
                                    {!detailModal.idCardImage && !detailModal.alipayImage && !detailModal.archiveImage && !detailModal.ipImage && (
                                        <div style={{ color: '#999', padding: '20px' }}>暂无认证图片</div>
                                    )}
                                </div>
                            </div>

                            {/* 拒绝原因 */}
                            {detailModal.rejectReason && (
                                <div style={{ marginBottom: '24px', padding: '12px', background: '#fff2f0', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                                    <span style={{ color: '#ff4d4f', fontWeight: '500' }}>拒绝原因：</span>
                                    <span style={{ color: '#ff4d4f' }}>{detailModal.rejectReason}</span>
                                </div>
                            )}

                            {/* 操作按钮 */}
                            {detailModal.status === 0 && (
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                    <button onClick={() => { setRejectingId(detailModal.id); setDetailModal(null); }}
                                        style={{ padding: '10px 24px', background: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '4px', cursor: 'pointer' }}>拒绝</button>
                                    <button onClick={() => handleApprove(detailModal.id)}
                                        style={{ padding: '10px 24px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>通过审核</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 图片预览弹窗 */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'zoom-out' }}>
                    <img src={imageModal} alt="预览" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                </div>
            )}

            {/* 拒绝弹窗 */}
            {rejectingId && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginBottom: '16px' }}>拒绝买号</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>拒绝理由</label>
                            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请输入拒绝理由..."
                                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                style={{ padding: '10px 24px', background: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                            <button onClick={() => handleReject(rejectingId)}
                                style={{ padding: '10px 24px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>确认拒绝</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
