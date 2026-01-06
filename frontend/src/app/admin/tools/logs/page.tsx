'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';

interface OperationLog {
    id: string;
    adminId: string;
    adminUsername: string;
    module: string;
    action: string;
    content: string;
    ip: string;
    userAgent: string;
    createdAt: string;
}

const modules = [
    { value: '', label: '全部模块' },
    { value: 'users', label: '买手管理' },
    { value: 'merchants', label: '商家管理' },
    { value: 'tasks', label: '任务管理' },
    { value: 'orders', label: '订单管理' },
    { value: 'finance', label: '财务管理' },
    { value: 'system', label: '系统设置' },
    { value: 'permission', label: '权限管理' },
    { value: 'auth', label: '登录认证' },
];

const moduleColors: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'slate'> = {
    auth: 'blue',
    users: 'blue',
    merchants: 'red',
    tasks: 'green',
    orders: 'amber',
    finance: 'amber',
    system: 'slate',
    permission: 'red',
};

export default function LogsPage() {
    const [logs, setLogs] = useState<OperationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ module: '', username: '', startDate: '', endDate: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

    useEffect(() => { loadLogs(); }, [pagination.page, filters]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('pageSize', pagination.limit.toString());
            if (filters.module) params.append('module', filters.module);
            if (filters.username) params.append('username', filters.username);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await fetch(`${BASE_URL}/admin/operation-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setLogs(result.data.list || []);
                    setPagination(prev => ({ ...prev, total: result.data.total || 0 }));
                }
            }
        } catch (error) {
            console.error('加载失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/operation-logs/export`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const csvContent = convertToCSV(result.data);
                    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `operation_logs_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    alert(result.message || '导出成功');
                }
            } else {
                alert('导出失败');
            }
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败');
        }
    };

    const convertToCSV = (data: OperationLog[]) => {
        const headers = ['操作时间', '操作人', '模块', '操作', '详情', 'IP地址'];
        const rows = data.map(log => [formatDate(log.createdAt), log.adminUsername, log.module, log.action, log.content, log.ip]);
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    };

    const handleClearLogs = async () => {
        if (!confirm('确定清空30天前的操作日志？此操作不可恢复！')) return;
        if (!confirm('再次确认：确定要清空旧日志吗？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/operation-logs/cleanup/30`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                alert(result.message || '清理完成');
            } else {
                alert('清理失败');
            }
            loadLogs();
        } catch (error) {
            console.error('清理失败:', error);
            alert('清理失败');
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">操作日志</h2>
                    <p className="mt-2 text-sm text-slate-500">查看管理员操作记录</p>
                </div>
                <div className="flex gap-3">
                    <Button className="bg-green-500 hover:bg-green-600" onClick={handleExport}>导出日志</Button>
                    <Button variant="destructive" onClick={handleClearLogs}>清理旧日志</Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="flex flex-wrap items-end gap-4 bg-white p-5">
                <div>
                    <label className="mb-1.5 block text-xs text-slate-500">模块</label>
                    <Select
                        value={filters.module}
                        onChange={v => setFilters({ ...filters, module: v })}
                        options={modules}
                        className="min-w-[140px]"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs text-slate-500">操作人</label>
                    <Input
                        placeholder="用户名"
                        value={filters.username}
                        onChange={e => setFilters({ ...filters, username: e.target.value })}
                        className="w-36"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs text-slate-500">开始日期</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-xs text-slate-500">结束日期</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                    />
                </div>
                <Button variant="secondary" onClick={() => setFilters({ module: '', username: '', startDate: '', endDate: '' })}>重置</Button>
            </Card>

            {/* Logs Table */}
            <Card className="overflow-hidden bg-white p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <span className="text-sm font-medium">日志记录</span>
                    <span className="text-xs text-slate-400">共 {pagination.total} 条记录</span>
                </div>
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="mb-4 text-5xl">📋</div>
                        <div>暂无操作日志</div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-4 py-4 text-left text-sm font-medium">操作时间</th>
                                        <th className="px-4 py-4 text-left text-sm font-medium">操作人</th>
                                        <th className="px-4 py-4 text-left text-sm font-medium">模块</th>
                                        <th className="px-4 py-4 text-left text-sm font-medium">操作</th>
                                        <th className="px-4 py-4 text-left text-sm font-medium">详情</th>
                                        <th className="px-4 py-4 text-left text-sm font-medium">IP地址</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-100">
                                            <td className="px-4 py-4 text-xs text-slate-500">{formatDate(log.createdAt)}</td>
                                            <td className="px-4 py-4 font-medium">{log.adminUsername}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant="soft" color={moduleColors[log.module] || 'slate'}>
                                                    {modules.find(m => m.value === log.module)?.label || log.module}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">{log.action}</td>
                                            <td className="max-w-[300px] px-4 py-4">
                                                <div className="truncate text-xs text-slate-500" title={log.content}>{log.content}</div>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-slate-400">{log.ip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className={cn(pagination.page === 1 && 'cursor-not-allowed opacity-50')}
                                >
                                    上一页
                                </Button>
                                <span className="px-3 text-sm text-slate-500">第 {pagination.page} / {totalPages} 页</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page >= totalPages}
                                    className={cn(pagination.page >= totalPages && 'cursor-not-allowed opacity-50')}
                                >
                                    下一页
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}
