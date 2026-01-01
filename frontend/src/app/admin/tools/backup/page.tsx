'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface Backup {
    id: string;
    filename: string;
    size: number;
    type: 'full' | 'data' | 'config';
    status: 'pending' | 'running' | 'completed' | 'failed';
    createdAt: string;
    completedAt?: string;
    error?: string;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/backup`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setBackups(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            // 模拟数据
            setBackups([
                {
                    id: '1',
                    filename: 'backup_20241225_120000.sql',
                    size: 1024 * 1024 * 15,
                    type: 'full',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    completedAt: new Date(Date.now() - 86400000 + 60000).toISOString(),
                },
                {
                    id: '2',
                    filename: 'backup_20241224_120000.sql',
                    size: 1024 * 1024 * 14,
                    type: 'full',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 172800000).toISOString(),
                    completedAt: new Date(Date.now() - 172800000 + 60000).toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (type: 'full' | 'data' | 'config') => {
        setCreating(true);
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type }),
            });
            alert('备份任务已创建，请稍后刷新查看');
            loadBackups();
        } catch (error) {
            console.error('创建失败:', error);
            alert('创建备份失败');
        } finally {
            setCreating(false);
        }
    };

    const handleRestore = async (id: string) => {
        if (!confirm('确定要恢复到此备份？此操作不可逆！')) return;
        if (!confirm('再次确认：恢复备份将覆盖当前所有数据！')) return;

        setRestoring(id);
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/backup/${id}/restore`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('恢复任务已开始，请等待完成');
        } catch (error) {
            console.error('恢复失败:', error);
            alert('恢复失败');
        } finally {
            setRestoring(null);
        }
    };

    const handleDownload = async (id: string, filename: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/backup/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该备份文件？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/backup/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadBackups();
        } catch (error) {
            console.error('删除失败:', error);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; color: string; text: string }> = {
            pending: { bg: '#fff7e6', color: '#fa8c16', text: '等待中' },
            running: { bg: '#e6f7ff', color: '#1890ff', text: '进行中' },
            completed: { bg: '#f6ffed', color: '#52c41a', text: '已完成' },
            failed: { bg: '#fff2f0', color: '#ff4d4f', text: '失败' },
        };
        const style = styles[status] || styles.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                background: style.bg,
                color: style.color
            }}>
                {style.text}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, { bg: string; color: string; text: string }> = {
            full: { bg: '#f0f5ff', color: '#2f54eb', text: '完整备份' },
            data: { bg: '#fff0f6', color: '#eb2f96', text: '数据备份' },
            config: { bg: '#f6ffed', color: '#52c41a', text: '配置备份' },
        };
        const style = styles[type] || styles.full;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                background: style.bg,
                color: style.color
            }}>
                {style.text}
            </span>
        );
    };

    return (
        <div>
            {/* 页面标题 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>数据备份</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        创建和管理数据库备份，支持一键恢复
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => handleCreate('full')}
                        disabled={creating}
                        style={{
                            padding: '10px 24px',
                            background: '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: creating ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: creating ? 0.7 : 1,
                        }}
                    >
                        {creating ? '创建中...' : '🗄️ 完整备份'}
                    </button>
                    <button
                        onClick={() => handleCreate('data')}
                        disabled={creating}
                        style={{
                            padding: '10px 24px',
                            background: '#52c41a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: creating ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: creating ? 0.7 : 1,
                        }}
                    >
                        📊 数据备份
                    </button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                        {backups.length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>备份总数</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                        {backups.filter(b => b.status === 'completed').length}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>成功备份</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#faad14' }}>
                        {formatSize(backups.reduce((sum, b) => sum + b.size, 0))}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>占用空间</div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#722ed1' }}>
                        {backups.length > 0 ? formatDate(backups[0].createdAt).split(' ')[0] : '-'}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>最近备份</div>
                </div>
            </div>

            {/* 备份列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: '500',
                    fontSize: '15px'
                }}>
                    备份记录
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : backups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                        <div>暂无备份记录</div>
                        <div style={{ marginTop: '8px', fontSize: '14px' }}>点击上方按钮创建第一个备份</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>文件名</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>类型</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>大小</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>状态</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>创建时间</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '500' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {backups.map(backup => (
                                <tr key={backup.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ marginRight: '8px' }}>📄</span>
                                        {backup.filename}
                                    </td>
                                    <td style={{ padding: '16px' }}>{getTypeBadge(backup.type)}</td>
                                    <td style={{ padding: '16px' }}>{formatSize(backup.size)}</td>
                                    <td style={{ padding: '16px' }}>{getStatusBadge(backup.status)}</td>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
                                        {formatDate(backup.createdAt)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleDownload(backup.id, backup.filename)}
                                                disabled={backup.status !== 'completed'}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '4px',
                                                    cursor: backup.status === 'completed' ? 'pointer' : 'not-allowed',
                                                    fontSize: '13px',
                                                    opacity: backup.status === 'completed' ? 1 : 0.5
                                                }}
                                            >
                                                下载
                                            </button>
                                            <button
                                                onClick={() => handleRestore(backup.id)}
                                                disabled={backup.status !== 'completed' || restoring === backup.id}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff2e8',
                                                    border: '1px solid #ffbb96',
                                                    borderRadius: '4px',
                                                    cursor: backup.status === 'completed' && restoring !== backup.id ? 'pointer' : 'not-allowed',
                                                    fontSize: '13px',
                                                    color: '#d46b08',
                                                    opacity: backup.status === 'completed' ? 1 : 0.5
                                                }}
                                            >
                                                {restoring === backup.id ? '恢复中...' : '恢复'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(backup.id)}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    border: '1px solid #ff4d4f',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: '#ff4d4f'
                                                }}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 说明 */}
            <div style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '8px',
                padding: '16px 24px',
                marginTop: '20px'
            }}>
                <h4 style={{ margin: '0 0 8px', color: '#1890ff', fontSize: '14px' }}>
                    💡 备份说明
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.8' }}>
                    <li><strong>完整备份</strong>：包含数据库所有表的数据和结构</li>
                    <li><strong>数据备份</strong>：仅包含业务数据（用户、订单、任务等）</li>
                    <li><strong>配置备份</strong>：仅包含系统配置数据</li>
                    <li>建议每日执行完整备份，备份文件可下载至本地保存</li>
                    <li>恢复操作将覆盖当前数据，请谨慎操作</li>
                </ul>
            </div>
        </div>
    );
}
