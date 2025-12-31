'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, Shop, deleteShop } from '../../../services/shopService';

export default function MerchantShopsPage() {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        const data = await fetchShops();
        setShops(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该店铺吗？')) return;
        const res = await deleteShop(id);
        if (res.success) {
            alert('删除成功');
            loadShops();
        } else {
            alert(res.message);
        }
    };

    const getStatusParams = (status: number) => {
        switch (status) {
            case 0: return { text: '待审核', color: '#faad14' };
            case 1: return { text: '已通过', color: '#52c41a' };
            case 2: return { text: '已拒绝', color: '#ff4d4f' };
            default: return { text: '未知', color: '#999' };
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '500' }}>店铺管理</h1>
                <button
                    onClick={() => router.push('/merchant/shops/new')}
                    style={{
                        padding: '10px 20px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + 绑定新店铺
                </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '8px', padding: '24px' }}>
                {loading ? (
                    <div>加载中...</div>
                ) : shops.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无绑定店铺</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>店铺名称</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>旺旺号</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>发件人</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shops.map(shop => {
                                const status = getStatusParams(shop.status);
                                return (
                                    <tr key={shop.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '16px' }}>{shop.platform}</td>
                                        <td style={{ padding: '16px' }}>{shop.shopName}</td>
                                        <td style={{ padding: '16px' }}>{shop.accountName}</td>
                                        <td style={{ padding: '16px' }}>{shop.contactName}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ color: status.color, padding: '4px 8px', background: `${status.color}15`, borderRadius: '4px', fontSize: '12px' }}>
                                                {status.text}
                                            </span>
                                            {shop.auditRemark && <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>{shop.auditRemark}</div>}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button
                                                onClick={() => router.push(`/merchant/shops/edit/${shop.id}`)}
                                                style={{ color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}
                                            >
                                                修改
                                            </button>
                                            <button
                                                onClick={() => handleDelete(shop.id)}
                                                style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
