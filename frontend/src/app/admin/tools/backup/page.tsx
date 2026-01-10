'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

interface Backup {
    filename: string;
    size: number;
    createdAt: string;
    path: string;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => { loadBackups(); }, []);

    const loadBackups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (response.ok) {
                // 处理两种可能的返回格式：直接数组或 { success, data } 格式
                const backupList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
                setBackups(backupList);
            } else {
                console.error('加载备份失败:', data?.message || '未知错误');
                setBackups([]);
            }
        } catch (error) {
            console.error('加载失败:', error);
            setBackups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ description: '手动备份' }),
            });
            const json = await response.json();
            if (response.ok) {
                alert('备份创建成功');
                loadBackups();
            } else {
                alert(json?.message || '创建备份失败');
            }
        } catch (error) {
            console.error('创建失败:', error);
            alert('创建备份失败');
        } finally {
            setCreating(false);
        }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm('确定要恢复到此备份？此操作不可逆！')) return;
        if (!confirm('再次确认：恢复备份将覆盖当前所有数据！')) return;
        setRestoring(filename);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup/restore/${encodeURIComponent(filename)}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (response.ok) {
                alert('数据库恢复成功');
            } else {
                alert(json?.message || '恢复失败');
            }
        } catch (error) {
            console.error('恢复失败:', error);
            alert('恢复失败');
        } finally {
            setRestoring(null);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup/download/${encodeURIComponent(filename)}`, {
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
            } else {
                alert('下载失败');
            }
        } catch (error) {
            console.error('下载失败:', error);
            alert('下载失败');
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm('确定删除该备份文件？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup/${encodeURIComponent(filename)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await response.json();
            if (response.ok) {
                loadBackups();
            } else {
                alert(json?.message || '删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败');
        }
    };

    const handleCleanOldBackups = async () => {
        const keepCount = prompt('保留最近多少个备份？', '10');
        if (!keepCount) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/backup/clean`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ keepCount: parseInt(keepCount) }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(`已清理 ${data?.deletedCount ?? 0} 个旧备份`);
                loadBackups();
            } else {
                alert(data?.message || '清理失败');
            }
        } catch (error) {
            console.error('清理失败:', error);
            alert('清理失败');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">数据备份</h2>
                    <p className="mt-2 text-sm text-[#6b7280]">创建和管理数据库备份，支持一键恢复</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleCreate}
                        disabled={creating}
                        className={cn(creating && 'cursor-not-allowed opacity-70')}
                    >
                        {creating ? '创建中...' : '创建备份'}
                    </Button>
                    <Button
                        onClick={handleCleanOldBackups}
                        variant="secondary"
                    >
                        清理旧备份
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                <Card className="bg-white p-5 text-center">
                    <div className="text-3xl font-bold text-primary-600">{backups.length}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">备份总数</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-3xl font-bold text-warning-500">{formatSize(backups.reduce((sum, b) => sum + b.size, 0))}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">占用空间</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-3xl font-bold text-purple-600">{backups.length > 0 ? formatDate(backups[0].createdAt).split(' ')[0] : '-'}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">最近备份日期</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="text-3xl font-bold text-success-400">{backups.length > 0 ? formatSize(backups[0].size) : '-'}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">最近备份大小</div>
                </Card>
            </div>

            {/* Backup List */}
            <Card className="overflow-hidden bg-white p-0">
                <div className="border-b border-[#f3f4f6] px-6 py-4 text-sm font-medium">备份记录</div>
                {loading ? (
                    <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
                ) : backups.length === 0 ? (
                    <div className="py-16 text-center text-[#9ca3af]">
                        <div className="mb-4 text-5xl">📁</div>
                        <div>暂无备份记录</div>
                        <div className="mt-2 text-sm">点击上方按钮创建第一个备份</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-4 py-4 text-left text-sm font-medium">文件名</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">大小</th>
                                    <th className="px-4 py-4 text-left text-sm font-medium">创建时间</th>
                                    <th className="px-4 py-4 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map(backup => (
                                    <tr key={backup.filename} className="border-b border-[#f3f4f6]">
                                        <td className="px-4 py-4">
                                            <span className="mr-2">📄</span>
                                            {backup.filename}
                                        </td>
                                        <td className="px-4 py-4">{formatSize(backup.size)}</td>
                                        <td className="px-4 py-4 text-xs text-[#6b7280]">{formatDate(backup.createdAt)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleDownload(backup.filename)}
                                                >
                                                    下载
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className={cn('border border-amber-300 bg-amber-50 text-warning-500 hover:bg-amber-100', restoring === backup.filename && 'cursor-not-allowed opacity-50')}
                                                    onClick={() => handleRestore(backup.filename)}
                                                    disabled={restoring === backup.filename}
                                                >
                                                    {restoring === backup.filename ? '恢复中...' : '恢复'}
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(backup.filename)}>删除</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Info Box */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-6 py-4">
                <h4 className="mb-2 text-sm font-medium text-primary-600">备份说明</h4>
                <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-[#4b5563]">
                    <li>备份使用 PostgreSQL 的 pg_dump 工具创建完整的数据库备份</li>
                    <li>备份文件包含数据库所有表的数据和结构</li>
                    <li>恢复操作将使用 psql 恢复备份，会覆盖当前数据</li>
                    <li>建议定期执行备份，备份文件可下载至本地保存</li>
                    <li>使用"清理旧备份"功能可以保留最近N个备份，删除更早的备份</li>
                </ul>
            </div>
        </div>
    );
}
