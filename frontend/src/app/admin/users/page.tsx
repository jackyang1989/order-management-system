'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface User {
    id: string;
    username: string;
    phone: string;
    qq?: string;
    balance: number;
    silver: number;
    frozenBalance?: number;
    frozenSilver?: number;
    vip: boolean;
    vipExpireAt?: string;
    verifyStatus: number;
    isActive: boolean;
    isBanned: boolean;
    banReason?: string;
    createdAt: string;
    lastLoginAt?: string;
}

interface BalanceModalData {
    userId: string;
    username: string;
    type: 'balance' | 'silver';
    action: 'add' | 'deduct';
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [vipFilter, setVipFilter] = useState<string>('all');

    // 弹窗状态
    const [balanceModal, setBalanceModal] = useState<BalanceModalData | null>(null);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [detailModal, setDetailModal] = useState<User | null>(null);
    const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
    const [banReason, setBanReason] = useState('');

    useEffect(() => {
        loadUsers();
    }, [page, statusFilter, vipFilter]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users?page=${page}&limit=20`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (vipFilter !== 'all') url += `&vip=${vipFilter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(json.data || []);
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
        loadUsers();
    };

    const handleAdjustBalance = async () => {
        if (!balanceModal || !balanceAmount || !balanceReason) {
            alert('请填写完整信息');
            return;
        }
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${balanceModal.userId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: balanceModal.type,
                    action: balanceModal.action,
                    amount: parseFloat(balanceAmount),
                    reason: balanceReason
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('操作成功');
                setBalanceModal(null);
                setBalanceAmount('');
                setBalanceReason('');
                loadUsers();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleBan = async () => {
        if (!banModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${banModal.userId}/ban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: banReason })
            });
            alert('用户已封禁');
            setBanModal(null);
            setBanReason('');
            loadUsers();
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleUnban = async (userId: string) => {
        if (!confirm('确定解封该用户？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadUsers();
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleSetVip = async (userId: string, days: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/vip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ days })
            });
            alert('VIP已设置');
            loadUsers();
        } catch (e) {
            alert('操作失败');
        }
    };

    const getVerifyStatusText = (status: number) => {
        const texts = ['未认证', '待审核', '已认证', '已拒绝'];
        return texts[status] || '未知';
    };

    const getVerifyStatusColor = (status: number) => {
        const colors = ['#999', '#faad14', '#52c41a', '#ff4d4f'];
        return colors[status] || '#999';
    };

    return (
        <div>
            {/* 搜索栏 */}
            <div style={{
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="搜索用户名/手机号/真实姓名..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{
                            width: '280px',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="all">全部状态</option>
                        <option value="active">正常</option>
                        <option value="banned">已封禁</option>
                    </select>
                    <select
                        value={vipFilter}
                        onChange={e => { setVipFilter(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                    >
                        <option value="all">全部会员</option>
                        <option value="vip">VIP用户</option>
                        <option value="normal">普通用户</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '8px 20px',
                            background: '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        搜索
                    </button>
                    <div style={{ flex: 1 }} />
                    <span style={{ color: '#666' }}>共 {total} 条记录</span>
                </div>
            </div>

            {/* 用户列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无用户</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户信息</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>本金余额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>银锭余额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>会员</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>实名</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0', minWidth: '280px' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0', opacity: user.isBanned ? 0.6 : 1 }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: '500' }}>{user.username}</div>
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{user.phone}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ color: '#52c41a', fontWeight: '500' }}>¥{Number(user.balance || 0).toFixed(2)}</div>
                                            {(user.frozenBalance || 0) > 0 && (
                                                <div style={{ fontSize: '12px', color: '#faad14' }}>冻结: ¥{Number(user.frozenBalance).toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ color: '#1890ff', fontWeight: '500' }}>{Number(user.silver || 0).toFixed(2)}</div>
                                            {(user.frozenSilver || 0) > 0 && (
                                                <div style={{ fontSize: '12px', color: '#faad14' }}>冻结: {Number(user.frozenSilver).toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {user.vip ? (
                                                <span style={{ padding: '2px 8px', background: '#fff7e6', color: '#d48806', borderRadius: '4px', fontSize: '12px' }}>
                                                    VIP
                                                </span>
                                            ) : (
                                                <span style={{ color: '#999', fontSize: '12px' }}>普通</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{ color: getVerifyStatusColor(user.verifyStatus), fontSize: '12px' }}>
                                                {getVerifyStatusText(user.verifyStatus)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {user.isBanned ? (
                                                <span style={{ padding: '2px 8px', background: '#fff2f0', color: '#ff4d4f', borderRadius: '4px', fontSize: '12px' }}>
                                                    已封禁
                                                </span>
                                            ) : user.isActive ? (
                                                <span style={{ padding: '2px 8px', background: '#f6ffed', color: '#52c41a', borderRadius: '4px', fontSize: '12px' }}>
                                                    正常
                                                </span>
                                            ) : (
                                                <span style={{ padding: '2px 8px', background: '#f5f5f5', color: '#999', borderRadius: '4px', fontSize: '12px' }}>
                                                    未激活
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => setDetailModal(user)}
                                                    style={{ padding: '4px 10px', border: '1px solid #1890ff', borderRadius: '4px', background: '#fff', color: '#1890ff', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    详情
                                                </button>
                                                <button
                                                    onClick={() => setBalanceModal({ userId: user.id, username: user.username, type: 'balance', action: 'add' })}
                                                    style={{ padding: '4px 10px', border: '1px solid #52c41a', borderRadius: '4px', background: '#fff', color: '#52c41a', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    充值
                                                </button>
                                                <button
                                                    onClick={() => setBalanceModal({ userId: user.id, username: user.username, type: 'balance', action: 'deduct' })}
                                                    style={{ padding: '4px 10px', border: '1px solid #faad14', borderRadius: '4px', background: '#fff', color: '#faad14', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    扣款
                                                </button>
                                                {!user.vip && (
                                                    <button
                                                        onClick={() => handleSetVip(user.id, 30)}
                                                        style={{ padding: '4px 10px', border: '1px solid #722ed1', borderRadius: '4px', background: '#fff', color: '#722ed1', cursor: 'pointer', fontSize: '12px' }}
                                                    >
                                                        设VIP
                                                    </button>
                                                )}
                                                {user.isBanned ? (
                                                    <button
                                                        onClick={() => handleUnban(user.id)}
                                                        style={{ padding: '4px 10px', border: '1px solid #52c41a', borderRadius: '4px', background: '#52c41a', color: '#fff', cursor: 'pointer', fontSize: '12px' }}
                                                    >
                                                        解封
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setBanModal({ userId: user.id, username: user.username })}
                                                        style={{ padding: '4px 10px', border: '1px solid #ff4d4f', borderRadius: '4px', background: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '12px' }}
                                                    >
                                                        封禁
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* 分页 */}
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>上一页</button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', background: '#fff', cursor: users.length < 20 ? 'not-allowed' : 'pointer', opacity: users.length < 20 ? 0.5 : 1 }}>下一页</button>
                        </div>
                    </>
                )}
            </div>

            {/* 充值/扣款弹窗 */}
            {balanceModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>
                            {balanceModal.action === 'add' ? '💰 充值' : '💸 扣款'} - {balanceModal.username}
                        </h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>账户类型</label>
                            <select
                                value={balanceModal.type}
                                onChange={e => setBalanceModal({ ...balanceModal, type: e.target.value as 'balance' | 'silver' })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
                            >
                                <option value="balance">本金余额</option>
                                <option value="silver">银锭余额</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>
                                {balanceModal.action === 'add' ? '充值' : '扣除'}金额
                            </label>
                            <input
                                type="number"
                                value={balanceAmount}
                                onChange={e => setBalanceAmount(e.target.value)}
                                placeholder="请输入金额"
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>操作原因</label>
                            <input
                                value={balanceReason}
                                onChange={e => setBalanceReason(e.target.value)}
                                placeholder="请输入操作原因"
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setBalanceModal(null); setBalanceAmount(''); setBalanceReason(''); }} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleAdjustBalance} style={{ padding: '8px 20px', background: balanceModal.action === 'add' ? '#52c41a' : '#faad14', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                确认{balanceModal.action === 'add' ? '充值' : '扣款'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 封禁弹窗 */}
            {banModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#ff4d4f' }}>
                            🚫 封禁用户 - {banModal.username}
                        </h3>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>封禁原因</label>
                            <textarea
                                value={banReason}
                                onChange={e => setBanReason(e.target.value)}
                                placeholder="请输入封禁原因"
                                rows={3}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '6px', boxSizing: 'border-box', resize: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => { setBanModal(null); setBanReason(''); }} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleBan} style={{ padding: '8px 20px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                确认封禁
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 用户详情弹窗 */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>👤 用户详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>×</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>用户名</div>
                                    <div style={{ fontWeight: '500' }}>{detailModal.username}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>手机号</div>
                                    <div>{detailModal.phone}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>QQ</div>
                                    <div>{detailModal.qq || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>本金余额</div>
                                    <div style={{ color: '#52c41a', fontWeight: '500' }}>¥{Number(detailModal.balance || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>银锭余额</div>
                                    <div style={{ color: '#1890ff', fontWeight: '500' }}>{Number(detailModal.silver || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>VIP状态</div>
                                    <div>{detailModal.vip ? `VIP (${detailModal.vipExpireAt ? new Date(detailModal.vipExpireAt).toLocaleDateString() : '-'}到期)` : '普通用户'}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>实名状态</div>
                                    <div style={{ color: getVerifyStatusColor(detailModal.verifyStatus) }}>{getVerifyStatusText(detailModal.verifyStatus)}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>账号状态</div>
                                    <div style={{ color: detailModal.isBanned ? '#ff4d4f' : '#52c41a' }}>
                                        {detailModal.isBanned ? `已封禁 (${detailModal.banReason || '无原因'})` : '正常'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>注册时间</div>
                                    <div>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#999', fontSize: '12px', marginBottom: '4px' }}>最后登录</div>
                                    <div>{detailModal.lastLoginAt ? new Date(detailModal.lastLoginAt).toLocaleString('zh-CN') : '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
