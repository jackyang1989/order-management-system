'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface BankCard {
    id: string;
    userId: string;
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
    isDefault: boolean;
    status: number;
    rejectReason: string;
    createdAt: string;
    updatedAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: '#faad14' },
    1: { text: '已通过', color: '#52c41a' },
    2: { text: '已拒绝', color: '#ff4d4f' },
};

export default function AdminFinanceBankPage() {
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [detailModal, setDetailModal] = useState<BankCard | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadCards();
    }, [page, statusFilter]);

    const loadCards = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/bank-cards/admin/list?page=${page}&limit=20`;
            if (statusFilter !== undefined) url += `&status=${statusFilter}`;
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
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
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

    const maskCardNumber = (num: string) => {
        if (!num || num.length < 8) return num;
        return num.slice(0, 4) + ' **** **** ' + num.slice(-4);
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>银行卡审核</span>
                    <span style={{ color: '#666' }}>共 {total} 条记录</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="搜索持卡人/卡号..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{ width: '200px', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                    <select
                        value={statusFilter ?? ''}
                        onChange={e => { setStatusFilter(e.target.value !== '' ? parseInt(e.target.value) : undefined); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="">全部状态</option>
                        <option value="0">待审核</option>
                        <option value="1">已通过</option>
                        <option value="2">已拒绝</option>
                    </select>
                    <button onClick={handleSearch} style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>搜索</button>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : cards.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无银行卡记录</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>持卡人</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>银行</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>卡号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>开户行</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>提交时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cards.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{c.accountName}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{c.bankName}</td>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>{maskCardNumber(c.cardNumber)}</td>
                                        <td style={{ padding: '14px 16px', color: '#666', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.branchName || '-'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[c.status]?.color || '#999') + '20', color: statusLabels[c.status]?.color || '#999' }}>
                                                {statusLabels[c.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('zh-CN') : '-'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button onClick={() => setDetailModal(c)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer' }}>查看</button>
                                                {c.status === 0 && (
                                                    <>
                                                        <button onClick={() => handleApprove(c.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer' }}>通过</button>
                                                        <button onClick={() => setRejectModal(c.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>拒绝</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={cards.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: cards.length < 20 ? 'not-allowed' : 'pointer', opacity: cards.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>

            {/* 详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>银行卡详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* 银行卡信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>银行卡信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>持卡人：</span><span style={{ fontWeight: '500' }}>{detailModal.accountName}</span></div>
                                    <div><span style={{ color: '#999' }}>银行：</span>{detailModal.bankName}</div>
                                    <div><span style={{ color: '#999' }}>卡号：</span><span style={{ fontFamily: 'monospace' }}>{detailModal.cardNumber}</span></div>
                                    <div><span style={{ color: '#999' }}>预留手机：</span>{detailModal.phone || '-'}</div>
                                    <div><span style={{ color: '#999' }}>开户省市：</span>{detailModal.province || ''} {detailModal.city || ''}</div>
                                    <div><span style={{ color: '#999' }}>开户支行：</span>{detailModal.branchName || '-'}</div>
                                    <div><span style={{ color: '#999' }}>身份证号：</span>{detailModal.idCard ? detailModal.idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2') : '-'}</div>
                                    <div><span style={{ color: '#999' }}>状态：</span>
                                        <span style={{ color: statusLabels[detailModal.status]?.color }}>{statusLabels[detailModal.status]?.text}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 身份证照片 */}
                            {(detailModal.idCardFrontImage || detailModal.idCardBackImage) && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>身份证照片</h4>
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        {detailModal.idCardFrontImage && (
                                            <div style={{ textAlign: 'center' }}>
                                                <img
                                                    src={detailModal.idCardFrontImage}
                                                    alt="身份证正面"
                                                    style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                                                    onClick={() => setImageModal(detailModal.idCardFrontImage)}
                                                />
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>身份证正面</div>
                                            </div>
                                        )}
                                        {detailModal.idCardBackImage && (
                                            <div style={{ textAlign: 'center' }}>
                                                <img
                                                    src={detailModal.idCardBackImage}
                                                    alt="身份证背面"
                                                    style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                                                    onClick={() => setImageModal(detailModal.idCardBackImage)}
                                                />
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>身份证背面</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 拒绝原因 */}
                            {detailModal.status === 2 && detailModal.rejectReason && (
                                <div style={{ marginBottom: '24px', padding: '12px', background: '#fff2f0', borderRadius: '4px', border: '1px solid #ffccc7' }}>
                                    <span style={{ color: '#ff4d4f', fontWeight: '500' }}>拒绝原因：</span>
                                    <span style={{ color: '#ff4d4f' }}>{detailModal.rejectReason}</span>
                                </div>
                            )}

                            {/* 时间信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>时间记录</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>提交时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                    <div><span style={{ color: '#999' }}>更新时间：</span>{detailModal.updatedAt ? new Date(detailModal.updatedAt).toLocaleString('zh-CN') : '-'}</div>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                {detailModal.status === 0 && (
                                    <>
                                        <button onClick={() => handleApprove(detailModal.id)} style={{ padding: '10px 20px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>通过审核</button>
                                        <button onClick={() => { setRejectModal(detailModal.id); }} style={{ padding: '10px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>拒绝</button>
                                    </>
                                )}
                                <button onClick={() => setDetailModal(null)} style={{ padding: '10px 24px', background: '#fff', color: '#666', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}>关闭</button>
                            </div>
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

            {/* 拒绝原因弹窗 */}
            {rejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '400px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px' }}>拒绝原因</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="请输入拒绝原因..."
                            rows={4}
                            style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical', marginBottom: '16px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleReject} style={{ padding: '8px 20px', border: 'none', borderRadius: '4px', background: '#ff4d4f', color: '#fff', cursor: 'pointer' }}>确认拒绝</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
