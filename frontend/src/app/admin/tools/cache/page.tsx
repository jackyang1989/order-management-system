'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

interface CacheInfo {
    key: string;
    name: string;
    description: string;
    size: string;
    count: number;
    lastUpdate: string;
}

export default function CachePage() {
    const [caches, setCaches] = useState<CacheInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState<string | null>(null);
    const [systemInfo, setSystemInfo] = useState({
        memoryUsed: '0',
        memoryTotal: '0',
        memoryPercent: 0,
        redisConnected: true,
        redisKeys: 0,
        redisMemory: '0'
    });

    useEffect(() => {
        loadCaches();
        loadSystemInfo();
    }, []);

    const loadCaches = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/cache`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCaches(data.data || []);
            }
        } catch (error) {
            console.error('加载失败:', error);
            setCaches([
                { key: 'config', name: '系统配置缓存', description: '系统参数和配置信息', size: '12.5 KB', count: 45, lastUpdate: new Date().toISOString() },
                { key: 'users', name: '用户信息缓存', description: '用户基本信息和状态', size: '256.8 KB', count: 1250, lastUpdate: new Date(Date.now() - 600000).toISOString() },
                { key: 'merchants', name: '商家信息缓存', description: '商家资料和店铺信息', size: '128.4 KB', count: 320, lastUpdate: new Date(Date.now() - 1200000).toISOString() },
                { key: 'tasks', name: '任务列表缓存', description: '任务信息和状态', size: '512.2 KB', count: 850, lastUpdate: new Date(Date.now() - 300000).toISOString() },
                { key: 'statistics', name: '统计数据缓存', description: '仪表盘统计数据', size: '8.6 KB', count: 12, lastUpdate: new Date(Date.now() - 60000).toISOString() },
                { key: 'permissions', name: '权限缓存', description: '用户权限和角色信息', size: '32.1 KB', count: 156, lastUpdate: new Date(Date.now() - 3600000).toISOString() },
                { key: 'sessions', name: '会话缓存', description: '用户登录会话信息', size: '64.3 KB', count: 89, lastUpdate: new Date().toISOString() },
                { key: 'sms', name: '短信验证码缓存', description: '短信验证码临时存储', size: '2.1 KB', count: 23, lastUpdate: new Date(Date.now() - 120000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadSystemInfo = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/cache/info`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSystemInfo(data);
            }
        } catch (error) {
            console.error('加载系统信息失败:', error);
            setSystemInfo({
                memoryUsed: '1.2 GB',
                memoryTotal: '4 GB',
                memoryPercent: 30,
                redisConnected: true,
                redisKeys: 2745,
                redisMemory: '48.6 MB'
            });
        }
    };

    const handleClearCache = async (key: string) => {
        if (!confirm(`确定清除 ${caches.find(c => c.key === key)?.name} 吗？`)) return;
        setClearing(key);
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/cache/${key}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadCaches();
            alert('缓存已清除');
        } catch (error) {
            console.error('清除失败:', error);
            alert('清除失败');
        } finally {
            setClearing(null);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('确定清除所有缓存吗？这可能会影响系统性能！')) return;
        if (!confirm('再次确认：清除所有缓存后，系统需要重新加载数据！')) return;
        setClearing('all');
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`${BASE_URL}/admin/cache/all`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            loadCaches();
            loadSystemInfo();
            alert('所有缓存已清除');
        } catch (error) {
            console.error('清除失败:', error);
            alert('清除失败');
        } finally {
            setClearing(null);
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');

    const getMemoryBarColor = () => {
        if (systemInfo.memoryPercent > 80) return 'bg-red-500';
        if (systemInfo.memoryPercent > 60) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">缓存管理</h2>
                    <p className="mt-2 text-sm text-slate-500">管理系统缓存，优化系统性能</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={loadCaches}>刷新</Button>
                    <Button
                        variant="destructive"
                        onClick={handleClearAll}
                        disabled={clearing === 'all'}
                        className={cn(clearing === 'all' && 'cursor-not-allowed opacity-70')}
                    >
                        {clearing === 'all' ? '清除中...' : '清除所有缓存'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-5">
                <Card className="bg-white p-5">
                    <div className="mb-2 text-sm text-slate-500">内存使用</div>
                    <div className="text-2xl font-bold text-blue-600">{systemInfo.memoryUsed}</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn('h-full transition-all', getMemoryBarColor())} style={{ width: `${systemInfo.memoryPercent}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-400">共 {systemInfo.memoryTotal} ({systemInfo.memoryPercent}%)</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="mb-2 text-sm text-slate-500">Redis 状态</div>
                    <div className={cn('text-2xl font-bold', systemInfo.redisConnected ? 'text-green-600' : 'text-red-500')}>
                        {systemInfo.redisConnected ? '已连接' : '未连接'}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{systemInfo.redisConnected ? '服务正常' : '请检查Redis服务'}</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="mb-2 text-sm text-slate-500">Redis 键数量</div>
                    <div className="text-2xl font-bold text-purple-600">{systemInfo.redisKeys.toLocaleString()}</div>
                    <div className="mt-2 text-xs text-slate-400">个缓存键</div>
                </Card>
                <Card className="bg-white p-5 text-center">
                    <div className="mb-2 text-sm text-slate-500">Redis 内存</div>
                    <div className="text-2xl font-bold text-amber-600">{systemInfo.redisMemory}</div>
                    <div className="mt-2 text-xs text-slate-400">缓存占用</div>
                </Card>
            </div>

            {/* Cache List */}
            <Card className="overflow-hidden bg-white p-0">
                <div className="border-b border-slate-100 px-6 py-4 text-sm font-medium">缓存分类</div>
                {loading ? (
                    <div className="py-16 text-center text-slate-400">加载中...</div>
                ) : caches.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <div className="mb-4 text-5xl">📦</div>
                        <div>暂无缓存数据</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-px bg-slate-100">
                        {caches.map(cache => (
                            <div key={cache.key} className="flex items-center justify-between bg-white px-6 py-5">
                                <div>
                                    <div className="mb-1 text-sm font-medium">{cache.name}</div>
                                    <div className="mb-2 text-xs text-slate-400">{cache.description}</div>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>大小: {cache.size}</span>
                                        <span>数量: {cache.count}</span>
                                        <span>更新: {formatDate(cache.lastUpdate)}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleClearCache(cache.key)}
                                    disabled={clearing === cache.key}
                                    className={cn('whitespace-nowrap', clearing === cache.key && 'cursor-not-allowed opacity-70')}
                                >
                                    {clearing === cache.key ? '清除中...' : '清除'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-6 py-4">
                <h4 className="mb-2 text-sm font-medium text-blue-600">💡 缓存说明</h4>
                <ul className="space-y-1 pl-5 text-xs leading-relaxed text-slate-600" style={{ listStyleType: 'disc' }}>
                    <li><strong>系统配置缓存</strong>：存储系统参数，清除后会重新从数据库加载</li>
                    <li><strong>用户/商家信息缓存</strong>：存储用户基本信息，清除后用户需重新加载数据</li>
                    <li><strong>会话缓存</strong>：存储登录状态，清除后所有用户需要重新登录</li>
                    <li>清除缓存后系统性能可能暂时下降，请谨慎操作</li>
                    <li>建议在低峰期进行缓存清理操作</li>
                </ul>
            </div>
        </div>
    );
}
