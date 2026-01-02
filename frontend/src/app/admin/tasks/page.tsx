'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    createdAt: string;
    // 详细信息
    url: string;
    mainImage: string;
    keyword: string;
    taoWord: string;
    taobaoId: string;
    qrCode: string;
    remark: string;
    merchantId: string;
    merchant?: {
        id: string;
        merchantName: string;
        phone: string;
    };
    // 费用信息
    goodsMoney: number;
    shippingFee: number;
    margin: number;
    extraReward: number;
    baseServiceFee: number;
    refundServiceFee: number;
    totalDeposit: number;
    totalCommission: number;
    // 增值服务
    isPraise: boolean;
    praiseFee: number;
    isImgPraise: boolean;
    imgPraiseFee: number;
    isVideoPraise: boolean;
    videoPraiseFee: number;
    // 结算类型
    terminal: number;
    version: number;
    // 时间限制
    taskTimeLimit: number;
    unionInterval: number;
    cycle: number;
    // 附加费用
    timingPayFee: number;
    timingPublishFee: number;
    nextDayFee: number;
    phoneFee: number;
    goodsMoreFee: number;
    addReward: number;
    // 预售
    isPresale: boolean;
    yfPrice: number;
    wkPrice: number;
    // 包邮
    isFreeShipping: boolean;
    memo: string;
    // 时间
    isTimingPublish: boolean;
    publishTime: string;
    payTime: string;
    examineTime: string;
    updatedAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待支付', color: '#8c8c8c' },
    1: { text: '进行中', color: '#52c41a' },
    2: { text: '已完成', color: '#1890ff' },
    3: { text: '已取消', color: '#ff4d4f' },
    4: { text: '待审核', color: '#faad14' },
};

const platformLabels: Record<number, string> = {
    1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多',
};

const terminalLabels: Record<number, string> = {
    1: '本佣货返',
    2: '本立佣货',
};

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Task | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}`;
            if (filter !== undefined) url += `&status=${filter}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setTasks(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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
            if (json.success) { alert('状态更新成功'); loadTasks(); }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/tasks?`;
            if (filter !== undefined) url += `status=${filter}&`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

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
            } else {
                alert('导出失败');
            }
        } catch (e) {
            console.error(e);
            alert('导出失败');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            {/* 筛选栏 */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#666' }}>状态筛选：</span>
                    {[
                        { label: '全部', value: undefined },
                        { label: '进行中', value: 1 },
                        { label: '待审核', value: 4 },
                        { label: '已完成', value: 2 },
                        { label: '已取消', value: 3 },
                    ].map(item => (
                        <button key={String(item.value)} onClick={() => { setFilter(item.value); setPage(1); }} style={{ padding: '6px 16px', borderRadius: '4px', border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9', background: filter === item.value ? '#e6f7ff' : '#fff', color: filter === item.value ? '#1890ff' : '#666', cursor: 'pointer' }}>
                            {item.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        border: 'none',
                        background: exporting ? '#95d475' : '#52c41a',
                        color: '#fff',
                        cursor: exporting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px'
                    }}
                >
                    {exporting ? '导出中...' : '导出Excel'}
                </button>
            </div>

            {/* 任务列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无任务</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>任务编号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>标题</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>单价</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>进度</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>创建时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#666' }}>{task.taskNumber}</td>
                                        <td style={{ padding: '14px 16px', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{platformLabels[task.taskType] || '其他'}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000', fontWeight: '500' }}>¥{Number(task.goodsPrice).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ color: '#1890ff' }}>{task.claimedCount}</span>
                                            <span style={{ color: '#999' }}> / {task.count}</span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: (statusLabels[task.status]?.color || '#999') + '20', color: statusLabels[task.status]?.color || '#999' }}>
                                                {statusLabels[task.status]?.text || '未知'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>{new Date(task.createdAt).toLocaleDateString('zh-CN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                <button onClick={() => setDetailModal(task)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer', fontSize: '13px' }}>查看</button>
                                                <select value={task.status} onChange={e => handleUpdateStatus(task.id, parseInt(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #d9d9d9', fontSize: '13px' }}>
                                                    {Object.entries(statusLabels).map(([val, label]) => (
                                                        <option key={val} value={val}>{label.text}</option>
                                                    ))}
                                                </select>
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

            {/* 任务详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>任务详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* 商品主图 */}
                            {detailModal.mainImage && (
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <img
                                        src={detailModal.mainImage}
                                        alt="商品主图"
                                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #d9d9d9', cursor: 'pointer' }}
                                        onClick={() => setImageModal(detailModal.mainImage)}
                                    />
                                </div>
                            )}

                            {/* 基本信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>基本信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>任务编号：</span><span style={{ fontFamily: 'monospace' }}>{detailModal.taskNumber}</span></div>
                                    <div><span style={{ color: '#999' }}>任务ID：</span><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{detailModal.id}</span></div>
                                    <div><span style={{ color: '#999' }}>平台：</span>{platformLabels[detailModal.taskType] || '其他'}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#999' }}>任务标题：</span><span style={{ fontWeight: '500' }}>{detailModal.title}</span></div>
                                    <div><span style={{ color: '#999' }}>店铺名称：</span>{detailModal.shopName || '-'}</div>
                                    <div><span style={{ color: '#999' }}>搜索关键词：</span>{detailModal.keyword || '-'}</div>
                                    <div><span style={{ color: '#999' }}>淘口令：</span>{detailModal.taoWord || '-'}</div>
                                    <div><span style={{ color: '#999' }}>商品ID：</span>{detailModal.taobaoId || '-'}</div>
                                    <div><span style={{ color: '#999' }}>结算方式：</span>{terminalLabels[detailModal.terminal] || '-'}</div>
                                    <div><span style={{ color: '#999' }}>状态：</span>
                                        <span style={{ color: statusLabels[detailModal.status]?.color }}>{statusLabels[detailModal.status]?.text || '未知'}</span>
                                    </div>
                                </div>
                                {detailModal.url && (
                                    <div style={{ marginTop: '12px' }}><span style={{ color: '#999' }}>商品链接：</span>
                                        <a href={detailModal.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff', wordBreak: 'break-all' }}>{detailModal.url}</a>
                                    </div>
                                )}
                            </div>

                            {/* 进度信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>任务进度</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                                    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1890ff' }}>{detailModal.count}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>总单数</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#1890ff' }}>{detailModal.claimedCount}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>已领取</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#52c41a' }}>{detailModal.completedCount || 0}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>已完成</div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#fff7e6', borderRadius: '6px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '600', color: '#fa8c16' }}>{detailModal.count - (detailModal.claimedCount || 0)}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>剩余</div>
                                    </div>
                                </div>
                            </div>

                            {/* 费用信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>费用信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>商品单价：</span><span style={{ color: '#000', fontWeight: '500' }}>¥{Number(detailModal.goodsPrice).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>商品本金总额：</span><span style={{ color: '#000', fontWeight: '500' }}>¥{Number(detailModal.goodsMoney || 0).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>运费：</span>¥{Number(detailModal.shippingFee || 0).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>保证金：</span>¥{Number(detailModal.margin || 0).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>加赏金额：</span><span style={{ color: '#52c41a' }}>¥{Number(detailModal.addReward || 0).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>总佣金：</span><span style={{ color: '#52c41a', fontWeight: '500' }}>¥{Number(detailModal.totalCommission || 0).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>基础服务费：</span>¥{Number(detailModal.baseServiceFee || 0).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>返款服务费：</span>¥{Number(detailModal.refundServiceFee || 0).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>总押金：</span><span style={{ color: '#fa8c16', fontWeight: '500' }}>¥{Number(detailModal.totalDeposit || 0).toFixed(2)}</span></div>
                                </div>
                            </div>

                            {/* 增值服务 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>增值服务</h4>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '8px 16px', background: detailModal.isPraise ? '#f6ffed' : '#f5f5f5', borderRadius: '4px', border: detailModal.isPraise ? '1px solid #b7eb8f' : '1px solid #d9d9d9' }}>
                                        <span style={{ color: detailModal.isPraise ? '#52c41a' : '#999' }}>文字好评</span>
                                        {detailModal.isPraise && <span style={{ marginLeft: '8px', color: '#52c41a' }}>¥{Number(detailModal.praiseFee || 0).toFixed(2)}</span>}
                                    </div>
                                    <div style={{ padding: '8px 16px', background: detailModal.isImgPraise ? '#f6ffed' : '#f5f5f5', borderRadius: '4px', border: detailModal.isImgPraise ? '1px solid #b7eb8f' : '1px solid #d9d9d9' }}>
                                        <span style={{ color: detailModal.isImgPraise ? '#52c41a' : '#999' }}>图片好评</span>
                                        {detailModal.isImgPraise && <span style={{ marginLeft: '8px', color: '#52c41a' }}>¥{Number(detailModal.imgPraiseFee || 0).toFixed(2)}</span>}
                                    </div>
                                    <div style={{ padding: '8px 16px', background: detailModal.isVideoPraise ? '#f6ffed' : '#f5f5f5', borderRadius: '4px', border: detailModal.isVideoPraise ? '1px solid #b7eb8f' : '1px solid #d9d9d9' }}>
                                        <span style={{ color: detailModal.isVideoPraise ? '#52c41a' : '#999' }}>视频好评</span>
                                        {detailModal.isVideoPraise && <span style={{ marginLeft: '8px', color: '#52c41a' }}>¥{Number(detailModal.videoPraiseFee || 0).toFixed(2)}</span>}
                                    </div>
                                    <div style={{ padding: '8px 16px', background: detailModal.isFreeShipping ? '#e6f7ff' : '#f5f5f5', borderRadius: '4px', border: detailModal.isFreeShipping ? '1px solid #91d5ff' : '1px solid #d9d9d9' }}>
                                        <span style={{ color: detailModal.isFreeShipping ? '#1890ff' : '#999' }}>{detailModal.isFreeShipping ? '包邮' : '不包邮'}</span>
                                    </div>
                                    {detailModal.isPresale && (
                                        <div style={{ padding: '8px 16px', background: '#fff7e6', borderRadius: '4px', border: '1px solid #ffd591' }}>
                                            <span style={{ color: '#fa8c16' }}>预售任务</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 时间限制 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>时间设置</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>任务时限：</span>{detailModal.taskTimeLimit || 24}小时</div>
                                    <div><span style={{ color: '#999' }}>接单间隔：</span>{detailModal.unionInterval || 0}分钟</div>
                                    <div><span style={{ color: '#999' }}>买手周期：</span>{detailModal.cycle || 0}天</div>
                                    <div><span style={{ color: '#999' }}>定时发布：</span>{detailModal.isTimingPublish ? '是' : '否'}</div>
                                    {detailModal.publishTime && <div><span style={{ color: '#999' }}>发布时间：</span>{new Date(detailModal.publishTime).toLocaleString('zh-CN')}</div>}
                                    {detailModal.payTime && <div><span style={{ color: '#999' }}>支付时间：</span>{new Date(detailModal.payTime).toLocaleString('zh-CN')}</div>}
                                </div>
                            </div>

                            {/* 商家信息 */}
                            {detailModal.merchant && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>商家信息</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><span style={{ color: '#999' }}>商家名称：</span>{detailModal.merchant.merchantName}</div>
                                        <div><span style={{ color: '#999' }}>联系电话：</span>{detailModal.merchant.phone}</div>
                                    </div>
                                </div>
                            )}

                            {/* 备注 */}
                            {(detailModal.remark || detailModal.memo) && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>备注信息</h4>
                                    {detailModal.remark && (
                                        <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '4px', marginBottom: '8px' }}>
                                            <span style={{ color: '#666', fontWeight: '500' }}>商家备注：</span>
                                            <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#333' }}>{detailModal.remark}</pre>
                                        </div>
                                    )}
                                    {detailModal.memo && (
                                        <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                                            <span style={{ color: '#666', fontWeight: '500' }}>内部备注：</span>
                                            <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: '13px', color: '#333' }}>{detailModal.memo}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 时间信息 */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>时间记录</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                    <div><span style={{ color: '#999' }}>更新时间：</span>{detailModal.updatedAt ? new Date(detailModal.updatedAt).toLocaleString('zh-CN') : '-'}</div>
                                    {detailModal.examineTime && <div><span style={{ color: '#999' }}>审核时间：</span>{new Date(detailModal.examineTime).toLocaleString('zh-CN')}</div>}
                                </div>
                            </div>

                            {/* 二维码 */}
                            {detailModal.qrCode && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>二维码</h4>
                                    <img
                                        src={detailModal.qrCode}
                                        alt="二维码"
                                        style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer' }}
                                        onClick={() => setImageModal(detailModal.qrCode)}
                                    />
                                </div>
                            )}

                            {/* 操作按钮 */}
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
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
        </div>
    );
}
