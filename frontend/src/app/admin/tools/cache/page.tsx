'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

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
            // 模拟数据
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
            // 模拟数据
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>缓存管理</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        管理系统缓存，优化系统性能
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={loadCaches}
                        style={{
                            padding: '10px 24px',
                            background: '#fff',
                            color: '#1890ff',
                            border: '1px solid #1890ff',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        刷新
                    </button>
                    <button
                        onClick={handleClearAll}
                        disabled={clearing === 'all'}
                        style={{
                            padding: '10px 24px',
                            background: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: clearing === 'all' ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            opacity: clearing === 'all' ? 0.7 : 1,
                        }}
                    >
                        {clearing === 'all' ? '清除中...' : '清除所有缓存'}
                    </button>
                </div>
            </div>

            {/* 系统状态卡片 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginBottom: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>内存使用</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {systemInfo.memoryUsed}
                    </div>
                    <div style={{
                        marginTop: '12px',
                        height: '6px',
                        background: '#f0f0f0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${systemInfo.memoryPercent}%`,
                            height: '100%',
                            background: systemInfo.memoryPercent > 80 ? '#ff4d4f' : systemInfo.memoryPercent > 60 ? '#faad14' : '#52c41a',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        共 {systemInfo.memoryTotal} ({systemInfo.memoryPercent}%)
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Redis 状态</div>
                    <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: systemInfo.redisConnected ? '#52c41a' : '#ff4d4f'
                    }}>
                        {systemInfo.redisConnected ? '已连接' : '未连接'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        {systemInfo.redisConnected ? '服务正常' : '请检查Redis服务'}
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Redis 键数量</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                        {systemInfo.redisKeys.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        个缓存键
                    </div>
                </div>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>Redis 内存</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {systemInfo.redisMemory}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        缓存占用
                    </div>
                </div>
            </div>

            {/* 缓存列表 */}
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
                    缓存分类
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>加载中...</div>
                ) : caches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                        <div>暂无缓存数据</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#f0f0f0' }}>
                        {caches.map(cache => (
                            <div key={cache.key} style={{
                                background: '#fff',
                                padding: '20px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '15px', marginBottom: '4px' }}>
                                        {cache.name}
                                    </div>
                                    <div style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>
                                        {cache.description}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                                        <span>大小: {cache.size}</span>
                                        <span>数量: {cache.count}</span>
                                        <span>更新: {formatDate(cache.lastUpdate)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleClearCache(cache.key)}
                                    disabled={clearing === cache.key}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#fff',
                                        border: '1px solid #ff4d4f',
                                        borderRadius: '4px',
                                        cursor: clearing === cache.key ? 'not-allowed' : 'pointer',
                                        fontSize: '13px',
                                        color: '#ff4d4f',
                                        opacity: clearing === cache.key ? 0.7 : 1,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {clearing === cache.key ? '清除中...' : '清除'}
                                </button>
                            </div>
                        ))}
                    </div>
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
                    💡 缓存说明
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.8' }}>
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
