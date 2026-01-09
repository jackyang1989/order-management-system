'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Modal } from '../../../../components/ui/modal';

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
        <div className="space-y-4">
            <Card
                title="佣金比例设置"
                actions={<Button onClick={() => setEditing({})}>+ 新增比例</Button>}
                noPadding
                className="bg-white"
            />

            <Card className="overflow-hidden bg-white p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-[600px] w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                <th className="px-4 py-3.5 text-left text-sm font-medium">商品限额 (元)</th>
                                <th className="px-4 py-3.5 text-left text-sm font-medium">收取商家银锭 (个)</th>
                                <th className="px-4 py-3.5 text-left text-sm font-medium">发放买手银锭 (个)</th>
                                <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map(rate => (
                                <tr key={rate.id} className="border-b border-[#f3f4f6]">
                                    <td className="px-4 py-3.5">{Number(rate.maxGoodsPrice).toFixed(2)}</td>
                                    <td className="px-4 py-3.5">{Number(rate.merchantReward).toFixed(2)}</td>
                                    <td className="px-4 py-3.5">{Number(rate.userReward).toFixed(2)}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={() => setEditing(rate)}
                                            className="mr-2 cursor-pointer border-none bg-transparent text-primary-600 hover:text-blue-700"
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rate.id)}
                                            className="cursor-pointer border-none bg-transparent text-danger-400 hover:text-danger-500"
                                        >
                                            删除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Modal */}
            <Modal
                title={editing?.id ? '编辑佣金比例' : '新增佣金比例'}
                open={editing !== null}
                onClose={() => setEditing(null)}
                className="max-w-sm"
            >
                {editing && (
                    <div className="space-y-4">
                        <Input
                            label="商品限额"
                            type="number"
                            value={String(editing.maxGoodsPrice || '')}
                            onChange={e => setEditing({ ...editing, maxGoodsPrice: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="收取商家银锭"
                            type="number"
                            value={String(editing.merchantReward || '')}
                            onChange={e => setEditing({ ...editing, merchantReward: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="发放买手银锭"
                            type="number"
                            value={String(editing.userReward || '')}
                            onChange={e => setEditing({ ...editing, userReward: parseFloat(e.target.value) })}
                        />
                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setEditing(null)}>取消</Button>
                            <Button onClick={() => handleSave(editing)}>保存</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
