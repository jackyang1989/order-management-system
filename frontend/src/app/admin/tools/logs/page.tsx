'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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

export default function LogsPage() {
    const [logs, setLogs] = useState<OperationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        module: '',
        username: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

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

    useEffect(() => {
        loadLogs();
    }, [pagination.page, filters]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...filters
            });
            const response = await fetch(`${BASE_URL}/admin/operation-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.data || []);
                setPagination(prev => ({ ...prev, total: data.total || 0 }));
            }
        } catch (error) {
            console.error('加载失败:', error);
            // 模拟数据
            const mockLogs: OperationLog[] = [
                { id: '1', adminId: '1', adminUsername: 'admin', module: 'auth', action: '登录', content: '管理员登录成功', ip: '192.168.1.1', userAgent: 'Chrome/120', createdAt: new Date().toISOString() },
                { id: '2', adminId: '1', adminUsername: 'admin', module: 'users', action: '调整余额', content: '为用户 user001 调整余额 +100.00', ip: '192.168.1.1', userAgent: 'Chrome/120', createdAt: new Date(Date.now() - 3600000).toISOString() },
                { id: '3', adminId: '2', adminUsername: 'operator', module: 'orders', action: '退款', content: '处理订单 ORD202412250001 退款申请', ip: '192.168.1.2', userAgent: 'Firefox/122', createdAt: new Date(Date.now() - 7200000).toISOString() },
                { id: '4', adminId: '1', adminUsername: 'admin', module: 'merchants', action: '审核', content: '审核通过商家 shop001', ip: '192.168.1.1', userAgent: 'Chrome/120', createdAt: new Date(Date.now() - 86400000).toISOString() },
                { id: '5', adminId: '3', adminUsername: 'finance', module: 'finance', action: '审核提现', content: '审核通过提现申请 WD202412250001, 金额 ¥500.00', ip: '192.168.1.3', userAgent: 'Safari/17', createdAt: new Date(Date.now() - 172800000).toISOString() },
                { id: '6', adminId: '1', adminUsername: 'admin', module: 'system', action: '修改配置', content: '修改系统参数: 最小充值金额改为 10.00', ip: '192.168.1.1', userAgent: 'Chrome/120', createdAt: new Date(Date.now() - 259200000).toISOString() },
                { id: '7', adminId: '2', adminUsername: 'operator', module: 'tasks', action: '关闭任务', content: '关闭任务 TASK202412250001', ip: '192.168.1.2', userAgent: 'Firefox/122', createdAt: new Date(Date.now() - 345600000).toISOString() },
                { id: '8', adminId: '1', adminUsername: 'admin', module: 'permission', action: '添加管理员', content: '添加管理员 test, 角色: 客服', ip: '192.168.1.1', userAgent: 'Chrome/120', createdAt: new Date(Date.now() - 432000000).toISOString() },
            ];
            setLogs(mockLogs);
            setPagination(prev => ({ ...prev, total: mockLogs.length }));
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams(filters);
            const response = await fetch(`${BASE_URL}/admin/operation-logs/export?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `operation_logs_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败');
        }
    };

    const handleClearLogs = async () => {
        if (!confirm('确定清空30天前的操作日志？此操作不可恢复！')) return;
        if (!confirm('再次确认：确定要清空旧日志吗？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/operation-logs/clear`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('清理完成');
            loadLogs();
        } catch (error) {
            console.error('清理失败:', error);
            alert('清理失败');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getModuleBadge = (module: string) => {
        const colors: Record<string, { bg: string; color: string }> = {
            auth: { bg: '#e6f7ff', color: '#1890ff' },
            users: { bg: '#f0f5ff', color: '#2f54eb' },
            merchants: { bg: '#fff0f6', color: '#eb2f96' },
            tasks: { bg: '#f6ffed', color: '#52c41a' },
            orders: { bg: '#fff7e6', color: '#fa8c16' },
            finance: { bg: '#f9f0ff', color: '#722ed1' },
            system: { bg: '#f5f5f5', color: '#666' },
            permission: { bg: '#fff2f0', color: '#ff4d4f' },
        };
        const style = colors[module] || { bg: '#f5f5f5', color: '#666' };
        const label = modules.find(m => m.value === module)?.label || module;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                background: style.bg,
                color: style.color
            }}>
                {label}
            </span>
        );
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>操作日志</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        查看管理员操作记录
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '10px 24px',
                            background: '#52c41a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        导出日志
                    </button>
                    <button
                        onClick={handleClearLogs}
                        style={{
                            padding: '10px 24px',
                            background: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        清理旧日志
                    </button>
                </div>
            </div>

            {/* 筛选区域 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'flex-end'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>模块</label>
                    <select
                        value={filters.module}
                        onChange={e => setFilters({ ...filters, module: e.target.value })}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            minWidth: '140px'
                        }}
                    >
                        {modules.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>操作人</label>
                    <input
                        type="text"
                        placeholder="用户名"
                        value={filters.username}
                        onChange={e => setFilters({ ...filters, username: e.target.value })}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            width: '140px'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>开始日期</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#666' }}>结束日期</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>
                <button
                    onClick={() => setFilters({ module: '', username: '', startDate: '', endDate: '' })}
                    style={{
                        padding: '8px 16px',
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    重置
                </button>
            </div>

            {/* 日志列表 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: '500',
                    fontSize: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>日志记录</span>
                    <span style={{ fontSize: '13px', color: '#999', fontWeight: 'normal' }}>
                        共 {pagination.total} 条记录
                    </span>
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <div>暂无操作日志</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>操作时间</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>操作人</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>模块</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>操作</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>详情</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '500' }}>IP地址</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '16px', color: '#666', fontSize: '13px' }}>
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{log.adminUsername}</td>
                                    <td style={{ padding: '16px' }}>{getModuleBadge(log.module)}</td>
                                    <td style={{ padding: '16px' }}>{log.action}</td>
                                    <td style={{ padding: '16px', maxWidth: '300px' }}>
                                        <div style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: '#666',
                                            fontSize: '13px'
                                        }} title={log.content}>
                                            {log.content}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#999', fontSize: '13px' }}>{log.ip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 分页 */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px'
                    }}>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                background: '#fff',
                                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                                opacity: pagination.page === 1 ? 0.5 : 1
                            }}
                        >
                            上一页
                        </button>
                        <span style={{ padding: '6px 12px', color: '#666' }}>
                            第 {pagination.page} / {totalPages} 页
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= totalPages}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                background: '#fff',
                                cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer',
                                opacity: pagination.page >= totalPages ? 0.5 : 1
                            }}
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
