'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface ReviewTask {
    id: string;
    merchantId: string;
    userId: string;
    buynoId: string;
    shopId: string;
    taobaoOrderNumber: string;
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
    // 关联信息
    merchantName?: string;
    buyerName?: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '未支付', color: '#999' },
    1: { text: '待审核', color: '#faad14' },
    2: { text: '已审核', color: '#1890ff' },
    3: { text: '已上传', color: '#722ed1' },
    4: { text: '已完成', color: '#52c41a' },
    5: { text: '已取消', color: '#ff4d4f' },
    6: { text: '买手拒接', color: '#ff7a45' },
    7: { text: '已拒绝', color: '#ff4d4f' },
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
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadTasks();
        loadStats();
    }, [page, stateFilter]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/review-tasks/admin/list?page=${page}&limit=20`;
            if (stateFilter !== undefined) url += `&state=${stateFilter}`;
            if (search) url += `&taskNumber=${encodeURIComponent(search)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                setTasks(json.data.list || json.data.data || []);
                setTotal(json.data.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadTasks();
    };

    const handleExamine = async () => {
        if (!examineModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/examine`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reviewTaskId: examineModal.id,
                    state: examineModal.action === 'approve' ? 2 : 7,
                    remarks: examineRemark
                })
            });
            const json = await res.json();
            if (json.success) {
                setExamineModal(null);
                setExamineRemark('');
                loadTasks();
                loadStats();
                setDetailModal(null);
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleRefund = async (id: string) => {
        if (!confirm('确定要返款吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/admin/refund/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                loadTasks();
                loadStats();
                setDetailModal(null);
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const parseImages = (img: string): string[] => {
        if (!img) return [];
        try {
            const parsed = JSON.parse(img);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return img.split(',').filter(Boolean);
        }
    };

    return (
        <div>
            {/* 统计卡片 */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1890ff' }}>{stats.total || 0}</div>
                        <div style={{ color: '#666', marginTop: '4px' }}>总任务数</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#faad14' }}>{stats.pending || 0}</div>
                        <div style={{ color: '#666', marginTop: '4px' }}>待审核</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#722ed1' }}>{stats.uploaded || 0}</div>
                        <div style={{ color: '#666', marginTop: '4px' }}>已上传</div>
                    </div>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#52c41a' }}>{stats.completed || 0}</div>
                        <div style={{ color: '#666', marginTop: '4px' }}>已完成</div>
                    </div>
                </div>
            )}

            {/* 筛选栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>追评任务审核</span>
                    <span style={{ color: '#666' }}>共 {total} 条记录</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="搜索任务编号..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{ width: '200px', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    />
                    <select
                        value={stateFilter ?? ''}
                        onChange={e => { setStateFilter(e.target.value !== '' ? parseInt(e.target.value) : undefined); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="">全部状态</option>
                        <option value="0">未支付</option>
                        <option value="1">待审核</option>
                        <option value="2">已审核</option>
                        <option value="3">已上传</option>
                        <option value="4">已完成</option>
                        <option value="5">已取消</option>
                        <option value="6">买手拒接</option>
                        <option value="7">已拒绝</option>
                    </select>
                    <button onClick={handleSearch} style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>搜索</button>
                </div>
            </div>

            {/* 任务列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无追评任务</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>任务编号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>淘宝订单号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>任务金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>买手佣金</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#1890ff' }}>{t.taskNumber}</td>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#666' }}>{t.taobaoOrderNumber || '-'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#ff4d4f', fontWeight: '500' }}>¥{Number(t.money || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a' }}>¥{Number(t.userMoney || 0).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[t.state]?.color || '#999') + '20', color: statusLabels[t.state]?.color || '#999' }}>
                                                {statusLabels[t.state]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#999', fontSize: '13px' }}>{t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '-'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button onClick={() => setDetailModal(t)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer' }}>查看</button>
                                                {t.state === 1 && (
                                                    <>
                                                        <button onClick={() => setExamineModal({ id: t.id, action: 'approve' })} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#52c41a', color: '#fff', cursor: 'pointer' }}>通过</button>
                                                        <button onClick={() => setExamineModal({ id: t.id, action: 'reject' })} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ff4d4f', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>拒绝</button>
                                                    </>
                                                )}
                                                {t.state === 3 && (
                                                    <button onClick={() => handleRefund(t.id)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#722ed1', color: '#fff', cursor: 'pointer' }}>返款</button>
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
                            <button onClick={() => setPage(p => p + 1)} disabled={tasks.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: tasks.length < 20 ? 'not-allowed' : 'pointer', opacity: tasks.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>

            {/* 详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>追评任务详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* 基本信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>基本信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>任务编号：</span><span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{detailModal.taskNumber}</span></div>
                                    <div><span style={{ color: '#999' }}>淘宝订单号：</span><span style={{ fontFamily: 'monospace' }}>{detailModal.taobaoOrderNumber || '-'}</span></div>
                                    <div><span style={{ color: '#999' }}>商家ID：</span>{detailModal.merchantId?.slice(0, 8) || '-'}</div>
                                    <div><span style={{ color: '#999' }}>买手ID：</span>{detailModal.userId?.slice(0, 8) || '-'}</div>
                                    <div><span style={{ color: '#999' }}>状态：</span>
                                        <span style={{ color: statusLabels[detailModal.state]?.color }}>{statusLabels[detailModal.state]?.text}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 金额信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>金额信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>任务金额：</span><span style={{ color: '#ff4d4f', fontWeight: '500' }}>¥{Number(detailModal.money || 0).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>买手佣金：</span><span style={{ color: '#52c41a', fontWeight: '500' }}>¥{Number(detailModal.userMoney || 0).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>订单金额：</span><span style={{ color: '#666' }}>¥{Number(detailModal.payPrice || 0).toFixed(2)}</span></div>
                                </div>
                            </div>

                            {/* 追评截图 */}
                            {detailModal.img && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>追评截图</h4>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        {parseImages(detailModal.img).map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`追评截图${index + 1}`}
                                                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                                                onClick={() => setImageModal(url)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 审核备注 */}
                            {detailModal.remarks && (
                                <div style={{ marginBottom: '24px', padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                                    <span style={{ color: '#52c41a', fontWeight: '500' }}>审核备注：</span>
                                    <span style={{ color: '#333' }}>{detailModal.remarks}</span>
                                </div>
                            )}

                            {/* 时间信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>时间记录</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                    {detailModal.payTime && <div><span style={{ color: '#999' }}>支付时间：</span>{new Date(detailModal.payTime).toLocaleString('zh-CN')}</div>}
                                    {detailModal.examineTime && <div><span style={{ color: '#999' }}>审核时间：</span>{new Date(detailModal.examineTime).toLocaleString('zh-CN')}</div>}
                                    {detailModal.uploadTime && <div><span style={{ color: '#999' }}>上传时间：</span>{new Date(detailModal.uploadTime).toLocaleString('zh-CN')}</div>}
                                    {detailModal.confirmTime && <div><span style={{ color: '#999' }}>完成时间：</span>{new Date(detailModal.confirmTime).toLocaleString('zh-CN')}</div>}
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                {detailModal.state === 1 && (
                                    <>
                                        <button onClick={() => setExamineModal({ id: detailModal.id, action: 'approve' })} style={{ padding: '10px 20px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>通过审核</button>
                                        <button onClick={() => setExamineModal({ id: detailModal.id, action: 'reject' })} style={{ padding: '10px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>拒绝</button>
                                    </>
                                )}
                                {detailModal.state === 3 && (
                                    <button onClick={() => handleRefund(detailModal.id)} style={{ padding: '10px 20px', background: '#722ed1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>返款完成</button>
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

            {/* 审核弹窗 */}
            {examineModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '400px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px' }}>{examineModal.action === 'approve' ? '通过审核' : '拒绝任务'}</h3>
                        <textarea
                            value={examineRemark}
                            onChange={e => setExamineRemark(e.target.value)}
                            placeholder={examineModal.action === 'approve' ? '审核备注（可选）...' : '请输入拒绝原因...'}
                            rows={4}
                            style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical', marginBottom: '16px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setExamineModal(null); setExamineRemark(''); }} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleExamine} style={{ padding: '8px 20px', border: 'none', borderRadius: '4px', background: examineModal.action === 'approve' ? '#52c41a' : '#ff4d4f', color: '#fff', cursor: 'pointer' }}>
                                {examineModal.action === 'approve' ? '确认通过' : '确认拒绝'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
