'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface User {
    id: string;
    username: string;
    phone: string;
    balance: number;
    status: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, [page]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        setLoading(true);
        try {
            const url = search
                ? `${BASE_URL}/admin/users?page=${page}&search=${search}`
                : `${BASE_URL}/admin/users?page=${page}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(json.data);
                setTotal(json.total);
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

    return (
        <div>
            {/* 搜索栏 */}
            <div style={{
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
            }}>
                <input
                    type="text"
                    placeholder="搜索用户名或手机号..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    style={{
                        flex: 1,
                        maxWidth: '300px',
                        padding: '8px 12px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
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
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>用户名</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>手机号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>余额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>注册时间</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>{user.id.slice(0, 8)}...</td>
                                        <td style={{ padding: '14px 16px', fontWeight: '500' }}>{user.username}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{user.phone}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(user.balance).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#999' }}>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <button style={{ padding: '4px 12px', border: '1px solid #1890ff', borderRadius: '4px', background: '#fff', color: '#1890ff', cursor: 'pointer', marginRight: '8px' }}>查看</button>
                                            <button style={{ padding: '4px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', color: '#666', cursor: 'pointer' }}>禁用</button>
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
        </div>
    );
}
