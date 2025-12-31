'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface Shop {
    id: string;
    platform: string;
    shopName: string;
    accountName: string;
    contactName: string;
    status: number;
    merchant: {
        username: string;
        companyName: string;
    };
    createdAt: string;
}

export default function AdminShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        loadShops();
    }, [statusFilter]);

    const loadShops = async () => {
        setLoading(true);
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const res = await fetch(`${BASE_URL}/admin/shops${query}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.list) {
            setShops(json.list);
        }
        setLoading(false);
    };

    const handleReview = async (id: string, status: number, remark?: string) => {
        if (!confirm(status === 1 ? '确认通过审核？' : '确认拒绝？')) return;

        const res = await fetch(`${BASE_URL}/admin/shops/${id}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status, remark })
        });
        const json = await res.json();
        if (res.ok) {
            alert('操作成功');
            loadShops();
        } else {
            alert(json.message || '操作失败');
        }
    };

    const getStatusParams = (status: number) => {
        switch (status) {
            case 0: return { text: '待审核', color: '#faad14' };
            case 1: return { text: '正常', color: '#52c41a' };
            case 2: return { text: '已拒绝', color: '#ff4d4f' };
            default: return { text: '未知', color: '#999' };
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '24px' }}>店铺审核</h1>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                >
                    <option value="">全部状态</option>
                    <option value="0">待审核</option>
                    <option value="1">正常</option>
                    <option value="2">已拒绝</option>
                </select>
                <button
                    onClick={() => loadShops()}
                    style={{ padding: '8px 16px', background: '#1890ff', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    刷新
                </button>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>所属商家</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>店铺名</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>旺旺号</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>联系人</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>申请时间</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shops.map(shop => {
                            const status = getStatusParams(shop.status);
                            return (
                                <tr key={shop.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div>{shop.merchant?.companyName || '--'}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>{shop.merchant?.username}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>{shop.platform}</td>
                                    <td style={{ padding: '12px' }}>{shop.shopName}</td>
                                    <td style={{ padding: '12px' }}>{shop.accountName}</td>
                                    <td style={{ padding: '12px' }}>{shop.contactName}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ color: status.color }}>{status.text}</span>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>
                                        {new Date(shop.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {shop.status === 0 && (
                                            <>
                                                <button
                                                    onClick={() => handleReview(shop.id, 1)}
                                                    style={{ color: '#52c41a', border: 'none', background: 'none', cursor: 'pointer', marginRight: '8px' }}
                                                >
                                                    通过
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('请输入拒绝原因：');
                                                        if (reason) handleReview(shop.id, 2, reason);
                                                    }}
                                                    style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    拒绝
                                                </button>
                                            </>
                                        )}
                                        {shop.status !== 0 && <span style={{ color: '#ccc' }}>已审核</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {shops.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无数据</div>}
            </div>
        </div>
    );
}
