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

            const response = await fetch(`${BASE_URL}/admin-users/logs/list?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setLogs(result.data || []);
                    setPagination(prev => ({ ...prev, total: result.total || 0 }));
                }
            }
        } catch (error) {
            console.error('加载失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (logs.length === 0) {
            alert('没有数据可导出');
            return;
        }
        const csvContent = convertToCSV(logs);
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operation_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const convertToCSV = (data: OperationLog[]) => {
        const headers = ['操作时间', '操作人', '模块', '操作', '详情', 'IP地址'];
        const rows = data.map(log => [formatDate(log.createdAt), log.adminUsername, log.module, log.action, log.content, log.ip]);
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">操作日志</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6b7280]">共 {pagination.total} 条记录</span>
                        <Button className="bg-green-500 hover:bg-success-400" onClick={handleExport}>导出当前页</Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select
                        value={filters.module}
                        onChange={v => setFilters({ ...filters, module: v })}
                        options={modules}
                        className="w-32"
                    />
                    <Input
                        placeholder="操作人"
                        value={filters.username}
                        onChange={e => setFilters({ ...filters, username: e.target.value })}
                        className="w-32"
                    />
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        className="rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        className="rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
                    />
                    <Button variant="secondary" onClick={() => setFilters({ module: '', username: '', startDate: '', endDate: '' })}>重置</Button>
                </div>

                {/* Logs Table */}
                <div className="overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center text-[#9ca3af]">
                        <div className="mb-4 text-5xl">📋</div>
                        <div>暂无操作日志</div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
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
                                        <tr key={log.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-4 text-xs text-[#6b7280]">{formatDate(log.createdAt)}</td>
                                            <td className="px-4 py-4 font-medium">{log.adminUsername}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant="soft" color={moduleColors[log.module] || 'slate'}>
                                                    {modules.find(m => m.value === log.module)?.label || log.module}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">{log.action}</td>
                                            <td className="max-w-[300px] px-4 py-4">
                                                <div className="truncate text-xs text-[#6b7280]" title={log.content}>{log.content}</div>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-[#9ca3af]">{log.ip}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-end gap-2 border-t border-[#f3f4f6] p-4">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className={cn(pagination.page === 1 && 'cursor-not-allowed opacity-50')}
                                >
                                    上一页
                                </Button>
                                <span className="px-3 text-sm text-[#6b7280]">第 {pagination.page} / {totalPages} 页</span>
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
                </div>
            </Card>
        </div>
    );
}
