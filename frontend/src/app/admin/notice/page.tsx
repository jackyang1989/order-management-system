'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

export default function AdminNoticePage() {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', content: '', type: 'announcement' });

    useEffect(() => {
        // 模拟数据
        setNotices([
            { id: '1', title: '平台升级公告', content: '系统将于今晚进行升级维护...', type: 'announcement', createdAt: '2024-12-30' },
            { id: '2', title: '新年活动通知', content: '新年期间推广佣金翻倍...', type: 'promotion', createdAt: '2024-12-29' },
        ]);
        setLoading(false);
    }, []);

    const handleSubmit = () => {
        setNotices([{ id: Date.now().toString(), ...form, createdAt: new Date().toISOString().split('T')[0] }, ...notices]);
        setShowModal(false);
        setForm({ title: '', content: '', type: 'announcement' });
    };

    return (
        <div>
            {/* 操作栏 */}
            <div style={{
                background: '#fff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>公告列表</span>
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        padding: '8px 20px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    + 发布公告
                </button>
            </div>

            {/* 公告列表 */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : notices.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无公告</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>标题</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>类型</th>
                                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>发布时间</th>
                                <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notices.map(notice => (
                                <tr key={notice.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '14px 16px' }}>{notice.title}</td>
                                    <td style={{ padding: '14px 16px', color: '#666' }}>
                                        {notice.type === 'announcement' ? '系统公告' : '活动通知'}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#999' }}>{notice.createdAt}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <button style={{ padding: '4px 12px', marginRight: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>编辑</button>
                                        <button style={{ padding: '4px 12px', border: '1px solid #ff4d4f', borderRadius: '4px', background: '#fff', color: '#ff4d4f', cursor: 'pointer' }}>删除</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 发布弹窗 */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowModal(false)}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '500px', padding: '24px' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '20px' }}>发布公告</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>标题</label>
                            <input
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>内容</label>
                            <textarea
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                rows={4}
                                style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>取消</button>
                            <button onClick={handleSubmit} style={{ padding: '8px 20px', border: 'none', borderRadius: '4px', background: '#1890ff', color: '#fff', cursor: 'pointer' }}>发布</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
