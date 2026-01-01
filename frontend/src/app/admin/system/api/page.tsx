'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface ApiConfig {
    key: string;
    label: string;
    value: string;
    description: string;
    type: 'text' | 'password' | 'url';
    testable?: boolean;
}

const apiConfigs: ApiConfig[] = [
    {
        key: 'dingdanxia_api_key',
        label: '订单侠 API Key',
        value: '',
        description: '用于淘口令解析和商品ID核对',
        type: 'password',
        testable: true,
    },
    {
        key: 'dingdanxia_api_url',
        label: '订单侠 API 地址',
        value: 'http://api.tbk.dingdanxia.com',
        description: '订单侠API服务地址',
        type: 'url',
    },
    {
        key: 'sms_api_key',
        label: '短信 API Key',
        value: '',
        description: '短信验证码服务API密钥',
        type: 'password',
    },
    {
        key: 'sms_api_secret',
        label: '短信 API Secret',
        value: '',
        description: '短信验证码服务API密钥',
        type: 'password',
    },
    {
        key: 'sms_sign_name',
        label: '短信签名',
        value: '',
        description: '短信签名名称',
        type: 'text',
    },
    {
        key: 'alipay_app_id',
        label: '支付宝 AppID',
        value: '',
        description: '支付宝开放平台应用ID',
        type: 'text',
    },
    {
        key: 'alipay_private_key',
        label: '支付宝私钥',
        value: '',
        description: '应用私钥（用于签名）',
        type: 'password',
    },
    {
        key: 'wechat_app_id',
        label: '微信支付 AppID',
        value: '',
        description: '微信支付商户AppID',
        type: 'text',
    },
    {
        key: 'wechat_mch_id',
        label: '微信支付商户号',
        value: '',
        description: '微信支付商户号',
        type: 'text',
    },
    {
        key: 'wechat_api_key',
        label: '微信支付 API Key',
        value: '',
        description: '微信支付API密钥',
        type: 'password',
    },
    {
        key: 'oss_access_key',
        label: 'OSS AccessKey',
        value: '',
        description: '阿里云OSS AccessKey ID',
        type: 'text',
    },
    {
        key: 'oss_secret_key',
        label: 'OSS SecretKey',
        value: '',
        description: '阿里云OSS AccessKey Secret',
        type: 'password',
    },
    {
        key: 'oss_bucket',
        label: 'OSS Bucket',
        value: '',
        description: 'OSS存储桶名称',
        type: 'text',
    },
    {
        key: 'oss_endpoint',
        label: 'OSS Endpoint',
        value: '',
        description: 'OSS访问域名',
        type: 'url',
    },
];

export default function ApiConfigPage() {
    const [configs, setConfigs] = useState<ApiConfig[]>(apiConfigs);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ key: string; success: boolean; message: string } | null>(null);
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/configs?group=api`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                if (data.data) {
                    setConfigs(prev => prev.map(config => {
                        const serverConfig = data.data.find((c: { key: string; value: string }) => c.key === config.key);
                        return serverConfig ? { ...config, value: serverConfig.value } : config;
                    }));
                }
            }
        } catch (error) {
            console.error('加载配置失败:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            for (const config of configs) {
                await fetch(`${BASE_URL}/admin/configs/${config.key}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ value: config.value }),
                });
            }
            alert('保存成功');
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async (key: string) => {
        setTestLoading(key);
        setTestResult(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/dingdanxia/admin/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setTestResult({
                key,
                success: data.success,
                message: data.success ? 'API连接成功' : (data.message || 'API连接失败'),
            });
        } catch {
            setTestResult({
                key,
                success: false,
                message: 'API连接失败，请检查网络',
            });
        } finally {
            setTestLoading(null);
        }
    };

    const togglePassword = (key: string) => {
        setShowPassword(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 按分类分组
    const groupedConfigs = {
        '订单侠API': configs.filter(c => c.key.startsWith('dingdanxia')),
        '短信服务': configs.filter(c => c.key.startsWith('sms')),
        '支付宝支付': configs.filter(c => c.key.startsWith('alipay')),
        '微信支付': configs.filter(c => c.key.startsWith('wechat')),
        'OSS存储': configs.filter(c => c.key.startsWith('oss')),
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
                    <h2 style={{ margin: 0, fontSize: '20px' }}>API配置</h2>
                    <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
                        配置第三方服务API密钥，请妥善保管
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        padding: '10px 24px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? '保存中...' : '保存所有配置'}
                </button>
            </div>

            {/* 配置分组 */}
            {Object.entries(groupedConfigs).map(([groupName, groupConfigs]) => (
                <div key={groupName} style={{
                    background: '#fff',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #f0f0f0',
                        background: '#fafafa',
                        fontWeight: '500',
                        fontSize: '15px'
                    }}>
                        {groupName}
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {groupConfigs.map((config, idx) => (
                                <div key={config.key} style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '16px'
                                }}>
                                    <div style={{ width: '200px', flexShrink: 0 }}>
                                        <label style={{
                                            display: 'block',
                                            fontWeight: '500',
                                            marginBottom: '4px',
                                            fontSize: '14px'
                                        }}>
                                            {config.label}
                                        </label>
                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                            {config.description}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input
                                                type={config.type === 'password' && !showPassword[config.key] ? 'password' : 'text'}
                                                value={config.value}
                                                onChange={e => {
                                                    const updated = [...configs];
                                                    const index = updated.findIndex(c => c.key === config.key);
                                                    updated[index].value = e.target.value;
                                                    setConfigs(updated);
                                                }}
                                                placeholder={`请输入${config.label}`}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    paddingRight: config.type === 'password' ? '40px' : '12px',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            {config.type === 'password' && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePassword(config.key)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        fontSize: '16px'
                                                    }}
                                                >
                                                    {showPassword[config.key] ? '🙈' : '👁️'}
                                                </button>
                                            )}
                                        </div>
                                        {config.testable && (
                                            <button
                                                onClick={() => handleTest(config.key)}
                                                disabled={testLoading === config.key}
                                                style={{
                                                    padding: '10px 16px',
                                                    background: '#52c41a',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: testLoading === config.key ? 'not-allowed' : 'pointer',
                                                    fontSize: '14px',
                                                    whiteSpace: 'nowrap',
                                                    opacity: testLoading === config.key ? 0.7 : 1,
                                                }}
                                            >
                                                {testLoading === config.key ? '测试中...' : '测试连接'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            {/* 测试结果提示 */}
            {testResult && (
                <div style={{
                    position: 'fixed',
                    top: '100px',
                    right: '24px',
                    padding: '16px 24px',
                    background: testResult.success ? '#f6ffed' : '#fff2f0',
                    border: `1px solid ${testResult.success ? '#b7eb8f' : '#ffccc7'}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '20px' }}>{testResult.success ? '✅' : '❌'}</span>
                    <span style={{ color: testResult.success ? '#52c41a' : '#ff4d4f' }}>
                        {testResult.message}
                    </span>
                    <button
                        onClick={() => setTestResult(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: '8px'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* 说明 */}
            <div style={{
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: '8px',
                padding: '16px 24px',
                marginTop: '20px'
            }}>
                <h4 style={{ margin: '0 0 8px', color: '#d48806', fontSize: '14px' }}>
                    ⚠️ 安全提示
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.8' }}>
                    <li>API密钥属于敏感信息，请勿泄露给他人</li>
                    <li>建议定期更换API密钥以保障安全</li>
                    <li>修改配置后请点击"保存所有配置"按钮</li>
                    <li>可以通过"测试连接"验证API是否配置正确</li>
                </ul>
            </div>
        </div>
    );
}
