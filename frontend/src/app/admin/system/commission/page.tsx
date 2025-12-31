'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface CommissionRate {
    id: number;
    maxGoodsPrice: number;
    merchantReward: number;
    userReward: number;
}

export default function AdminCommissionPage() {
    const [rates, setRates] = useState<CommissionRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Partial<CommissionRate> | null>(null);

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/commission-rates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) setRates(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (rate: Partial<CommissionRate>) => {
        const token = localStorage.getItem('adminToken');
        const isNew = !rate.id;
        const url = isNew ? `${BASE_URL}/commission-rates` : `${BASE_URL}/commission-rates/${rate.id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(rate)
            });
            const json = await res.json();
            if (json.success) {
                alert('保存成功');
                setEditing(null);
                loadRates();
            } else {
                alert(json.message);
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定删除吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/commission-rates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadRates();
        } catch (e) {
            alert('删除失败');
        }
    };

    return (
        <div>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>佣金比例设置</span>
                <button
                    onClick={() => setEditing({})}
                    style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + 新增比例
                </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#fafafa' }}>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>商品限额 (元)</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>收取商家银锭 (个)</th>
                            <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>发放买手银锭 (个)</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map(rate => (
                            <tr key={rate.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '14px 16px' }}>{Number(rate.maxGoodsPrice).toFixed(2)}</td>
                                <td style={{ padding: '14px 16px' }}>{Number(rate.merchantReward).toFixed(2)}</td>
                                <td style={{ padding: '14px 16px' }}>{Number(rate.userReward).toFixed(2)}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <button onClick={() => setEditing(rate)} style={{ color: '#1890ff', marginRight: '8px', cursor: 'pointer', background: 'none', border: 'none' }}>编辑</button>
                                    <button onClick={() => handleDelete(rate.id)} style={{ color: '#ff4d4f', cursor: 'pointer', background: 'none', border: 'none' }}>删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 编辑弹窗 */}
            {editing && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>{editing.id ? '编辑佣金比例' : '新增佣金比例'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>商品限额</label>
                                <input
                                    type="number"
                                    value={editing.maxGoodsPrice || ''}
                                    onChange={e => setEditing({ ...editing, maxGoodsPrice: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>收取商家银锭</label>
                                <input
                                    type="number"
                                    value={editing.merchantReward || ''}
                                    onChange={e => setEditing({ ...editing, merchantReward: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>发放买手银锭</label>
                                <input
                                    type="number"
                                    value={editing.userReward || ''}
                                    onChange={e => setEditing({ ...editing, userReward: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setEditing(null)} style={{ padding: '8px 16px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                            <button onClick={() => handleSave(editing)} style={{ padding: '8px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
