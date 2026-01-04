'use client';

import { useState, useEffect } from 'react';
import { adminService, AdminMerchant } from '../../../services/adminService';

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: '#faad14' },
    1: { text: '正常', color: '#52c41a' },
    2: { text: '已拒绝', color: '#ff4d4f' },
    3: { text: '已禁用', color: '#ff4d4f' },
};

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal states
    const [activeModal, setActiveModal] = useState<'balance' | 'vip' | null>(null);
    const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);
    const [modalForm, setModalForm] = useState<any>({});

    useEffect(() => {
        loadMerchants();
    }, [filter, page]);

    const loadMerchants = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMerchants({ page, limit: 10, status: filter, keyword });
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadMerchants();
    };

    const handleBan = async (id: string, currentStatus: number) => {
        if (currentStatus === 3) {
            // Unban
            if (!confirm('确定要启用该商家吗？')) return;
            try {
                await adminService.unbanMerchant(id);
                alert('已启用');
                loadMerchants();
            } catch (e) {
                alert('操作失败');
            }
        } else {
            // Ban
            const reason = prompt('请输入禁用原因');
            if (!reason) return;
            try {
                await adminService.banMerchant(id, reason);
                alert('已禁用');
                loadMerchants();
            } catch (e) {
                alert('操作失败');
            }
        }
    };

    const openAdjustBalance = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setModalForm({ type: 'balance', action: 'add', amount: '', reason: '' });
        setActiveModal('balance');
    };

    const submitAdjustBalance = async () => {
        if (!selectedMerchant) return;
        try {
            await adminService.adjustMerchantBalance(selectedMerchant.id, {
                type: modalForm.type,
                action: modalForm.action,
                amount: Number(modalForm.amount),
                reason: modalForm.reason
            });
            alert('余额调整成功');
            setActiveModal(null);
            loadMerchants();
        } catch (e: any) {
            alert(e.errorMessage || '操作失败');
        }
    };

    const openSetVip = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        setModalForm({ days: 30 });
        setActiveModal('vip');
    };

    const submitSetVip = async () => {
        if (!selectedMerchant) return;
        try {
            await adminService.setMerchantVip(selectedMerchant.id, Number(modalForm.days));
            alert('VIP设置成功');
            setActiveModal(null);
            loadMerchants();
        } catch (e: any) {
            alert(e.errorMessage || '操作失败');
        }
    };

    const handleRemoveVip = async (id: string) => {
        if (!confirm('确定要取消该商家的VIP资格吗？')) return;
        try {
            await adminService.removeMerchantVip(id);
            alert('已取消VIP');
            loadMerchants();
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="搜索用户名/手机号"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                        />
                        <button type="submit" style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>搜索</button>
                    </form>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { label: '全部', value: undefined },
                            { label: '待审核', value: 0 },
                            { label: '正常', value: 1 },
                            { label: '已禁用', value: 3 },
                        ].map(item => (
                            <button
                                key={String(item.value)}
                                onClick={() => setFilter(item.value)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                    background: filter === item.value ? '#e6f7ff' : '#fff',
                                    color: filter === item.value ? '#1890ff' : '#666',
                                    cursor: 'pointer'
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Merchant List */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left' }}>商家信息</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>余额/银锭</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>VIP</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>状态</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {merchants.map(m => (
                            <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 16px' }}>
                                    <div><strong>{m.username}</strong></div>
                                    <div style={{ color: '#999', fontSize: '12px' }}>{m.companyName} | {m.phone}</div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ color: '#52c41a' }}>¥{Number(m.balance).toFixed(2)}</div>
                                    <div style={{ color: '#722ed1', fontSize: '12px' }}>{Number(m.silver).toFixed(0)} 银锭</div>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {m.vip ? (
                                        <span style={{ color: 'gold', fontWeight: 'bold' }}>VIP</span>
                                    ) : (
                                        <span style={{ color: '#ccc' }}>-</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{ color: statusLabels[m.status]?.color }}>
                                        {statusLabels[m.status]?.text || '未知'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button onClick={() => openAdjustBalance(m)} style={{ cursor: 'pointer', color: '#1890ff', border: 'none', background: 'none' }}>资金</button>

                                        {m.vip ? (
                                            <button onClick={() => handleRemoveVip(m.id)} style={{ cursor: 'pointer', color: '#faad14', border: 'none', background: 'none' }}>取消VIP</button>
                                        ) : (
                                            <button onClick={() => openSetVip(m)} style={{ cursor: 'pointer', color: '#faad14', border: 'none', background: 'none' }}>设VIP</button>
                                        )}

                                        <button
                                            onClick={() => handleBan(m.id, m.status)}
                                            style={{ cursor: 'pointer', color: m.status === 3 ? '#52c41a' : '#ff4d4f', border: 'none', background: 'none' }}
                                        >
                                            {m.status === 3 ? '启用' : '禁用'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Simplified Pagination */}
                <div style={{ padding: '16px', textAlign: 'right' }}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ marginRight: '8px' }}>上一页</button>
                    <span>第 {page} 页</span>
                    <button disabled={merchants.length < 10} onClick={() => setPage(p => p + 1)} style={{ marginLeft: '8px' }}>下一页</button>
                </div>
            </div>

            {/* Balance Modal */}
            {activeModal === 'balance' && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3>调整资金 - {selectedMerchant?.username}</h3>
                        <div style={{ margin: '16px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>类型</label>
                            <select
                                value={modalForm.type}
                                onChange={e => setModalForm({ ...modalForm, type: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            >
                                <option value="balance">余额</option>
                                <option value="silver">银锭</option>
                            </select>
                        </div>
                        <div style={{ margin: '16px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>操作</label>
                            <select
                                value={modalForm.action}
                                onChange={e => setModalForm({ ...modalForm, action: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            >
                                <option value="add">增加</option>
                                <option value="deduct">扣除</option>
                            </select>
                        </div>
                        <div style={{ margin: '16px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>金额/数量</label>
                            <input
                                type="number"
                                value={modalForm.amount}
                                onChange={e => setModalForm({ ...modalForm, amount: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ margin: '16px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>原因 (必填)</label>
                            <textarea
                                value={modalForm.reason}
                                onChange={e => setModalForm({ ...modalForm, reason: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', minHeight: '80px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setActiveModal(null)} style={{ padding: '6px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                            <button onClick={submitAdjustBalance} style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>确定</button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIP Modal */}
            {activeModal === 'vip' && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3>开通VIP - {selectedMerchant?.username}</h3>
                        <div style={{ margin: '16px 0' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>天数</label>
                            <input
                                type="number"
                                value={modalForm.days}
                                onChange={e => setModalForm({ ...modalForm, days: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setActiveModal(null)} style={{ padding: '6px 16px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                            <button onClick={submitSetVip} style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>确定</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
