'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';

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
            const response = await fetch(`${BASE_URL}/admin/api-config/dingdanxia/test`, {
                headers: {
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

    // Group configs by category
    const groupedConfigs = {
        '订单侠API': configs.filter(c => c.key.startsWith('dingdanxia')),
        '短信服务': configs.filter(c => c.key.startsWith('sms')),
        '支付宝支付': configs.filter(c => c.key.startsWith('alipay')),
        '微信支付': configs.filter(c => c.key.startsWith('wechat')),
        'OSS存储': configs.filter(c => c.key.startsWith('oss')),
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">API配置</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">配置第三方服务API密钥，请妥善保管</p>
                </div>
                <Button onClick={handleSave} loading={loading}>
                    {loading ? '保存中...' : '保存所有配置'}
                </Button>
            </div>

            {/* Config Groups */}
            {Object.entries(groupedConfigs).map(([groupName, groupConfigs]) => (
                <Card key={groupName} className="overflow-hidden bg-white">
                    <div className="border-b border-[#f3f4f6] bg-[#f9fafb] px-6 py-4 text-sm font-medium">
                        {groupName}
                    </div>
                    <div className="flex flex-col gap-5 p-6">
                        {groupConfigs.map((config) => (
                            <div key={config.key} className="flex items-start gap-4">
                                <div className="w-48 flex-shrink-0">
                                    <label className="mb-1 block text-sm font-medium">{config.label}</label>
                                    <span className="text-xs text-[#9ca3af]">{config.description}</span>
                                </div>
                                <div className="flex min-w-0 flex-1 gap-2">
                                    <div className="relative flex-1">
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
                                            className={cn(
                                                'w-full rounded-md border border-[#d1d5db] px-3 py-2.5 text-sm',
                                                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                                                config.type === 'password' && 'pr-10'
                                            )}
                                        />
                                        {config.type === 'password' && (
                                            <button
                                                type="button"
                                                onClick={() => togglePassword(config.key)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-1 text-base"
                                            >
                                                {showPassword[config.key] ? '🙈' : '👁️'}
                                            </button>
                                        )}
                                    </div>
                                    {config.testable && (
                                        <Button
                                            className="shrink-0 bg-success-400 hover:bg-success-500"
                                            loading={testLoading === config.key}
                                            onClick={() => handleTest(config.key)}
                                        >
                                            {testLoading === config.key ? '测试中...' : '测试连接'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}

            {/* Test Result Toast */}
            {testResult && (
                <div
                    className={cn(
                        'fixed right-6 top-24 z-50 flex items-center gap-3 rounded-md border px-6 py-4',
                        testResult.success
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                    )}
                >
                    <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
                    <span className={testResult.success ? 'text-success-400' : 'text-danger-400'}>
                        {testResult.message}
                    </span>
                    <button
                        onClick={() => setTestResult(null)}
                        className="ml-2 cursor-pointer border-none bg-transparent text-lg"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Security Notice */}
            <div className="rounded-md border border-amber-200 bg-amber-50 px-6 py-4">
                <h4 className="mb-2 text-sm font-medium text-amber-700">⚠️ 安全提示</h4>
                <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-[#4b5563]">
                    <li>API密钥属于敏感信息，请勿泄露给他人</li>
                    <li>建议定期更换API密钥以保障安全</li>
                    <li>修改配置后请点击"保存所有配置"按钮</li>
                    <li>可以通过"测试连接"验证API是否配置正确</li>
                </ul>
            </div>
        </div>
    );
}
