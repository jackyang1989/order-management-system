'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../../apiConfig';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import { Modal } from '../../../../../components/ui/modal';

interface ImageRequirement {
    id: string;
    key: string;
    label: string;
    exampleImagePath: string | null;
    pathHint: string | null;
    required: boolean;
    sortOrder: number;
}

interface PlatformWithRequirements {
    platformId: string;
    platformCode: string;
    platformName: string;
    requirements: ImageRequirement[];
}

export default function PlatformImageConfigPage() {
    const [platforms, setPlatforms] = useState<PlatformWithRequirements[]>([]);
    const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal 状态
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ImageRequirement>>({});

    useEffect(() => {
        loadPlatforms();
    }, []);

    const loadPlatforms = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('未登录，请先登录管理后台');
                setLoading(false);
                return;
            }

            const res = await fetch(`${BASE_URL}/admin/config/platforms/image-requirements`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setPlatforms(data.data);
                    if (data.data.length > 0 && !selectedPlatformId) {
                        setSelectedPlatformId(data.data[0].platformId);
                    }
                } else {
                    setError(data.message || '加载失败');
                }
            } else if (res.status === 401) {
                setError('登录已过期，请重新登录');
            } else {
                setError('加载平台配置失败');
            }
        } catch (err) {
            console.error('加载失败:', err);
            setError('网络错误，请检查后端服务是否运行');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlatform = platforms.find(p => p.platformId === selectedPlatformId);

    const handleEdit = (req: ImageRequirement) => {
        setEditingId(req.id);
        setEditForm({ ...req });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setEditForm({
            key: '',
            label: '',
            exampleImagePath: null,
            pathHint: null,
            required: true,
            sortOrder: (selectedPlatform?.requirements.length || 0) + 1,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = editingId
                ? `${BASE_URL}/admin/config/image-requirements/${editingId}`
                : `${BASE_URL}/admin/config/platforms/${selectedPlatformId}/image-requirements`;
            const method = editingId ? 'PUT' : 'POST';

            const body = editingId
                ? {
                    label: editForm.label,
                    pathHint: editForm.pathHint,
                    required: editForm.required,
                    sortOrder: editForm.sortOrder,
                    exampleImagePath: editForm.exampleImagePath,
                }
                : {
                    key: editForm.key,
                    label: editForm.label,
                    pathHint: editForm.pathHint,
                    required: editForm.required,
                    sortOrder: editForm.sortOrder,
                    exampleImagePath: editForm.exampleImagePath,
                };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                loadPlatforms();
            } else {
                alert('保存失败: ' + (data.message || ''));
            }
        } catch (err) {
            console.error('保存失败:', err);
            alert('保存失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定删除该截图配置？')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${BASE_URL}/admin/config/image-requirements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                loadPlatforms();
            } else {
                alert('删除失败');
            }
        } catch (err) {
            console.error('删除失败:', err);
            alert('删除失败');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setEditForm({ ...editForm, exampleImagePath: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">平台截图配置</span>
                    <span className="text-sm text-[#6b7280]">管理买号绑定时需要上传的截图</span>
                </div>

                {/* 平台选择 Tabs */}
                <div className="mb-6 flex gap-2 flex-wrap border-b border-slate-200 pb-4">
                    {platforms.map(platform => (
                        <button
                            key={platform.platformId}
                            onClick={() => setSelectedPlatformId(platform.platformId)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                selectedPlatformId === platform.platformId
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                        >
                            {platform.platformName}
                            <span className="ml-1.5 text-xs opacity-70">({platform.requirements.length})</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-16 text-center text-[#9ca3af]">加载中...</div>
                ) : error ? (
                    <div className="py-16 text-center">
                        <div className="text-danger-400 mb-4">{error}</div>
                        <Button onClick={loadPlatforms} variant="secondary">重试</Button>
                    </div>
                ) : selectedPlatform ? (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                {selectedPlatform.platformName} - 共 {selectedPlatform.requirements.length} 个截图配置
                            </span>
                            <Button onClick={handleCreate}>+ 添加截图</Button>
                        </div>

                        {selectedPlatform.requirements.length === 0 ? (
                            <div className="py-12 text-center text-[#9ca3af]">暂无截图配置</div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-[#f3f4f6]">
                                <table className="min-w-[800px] w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#f9fafb]">
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">排序</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">标识</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">名称</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">示例图</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">路径提示</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">必填</th>
                                            <th className="px-4 py-3.5 text-center text-sm font-medium">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPlatform.requirements
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map(req => (
                                                <tr key={req.id} className="border-t border-[#f3f4f6]">
                                                    <td className="px-4 py-4">{req.sortOrder}</td>
                                                    <td className="px-4 py-4">
                                                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{req.key}</code>
                                                    </td>
                                                    <td className="px-4 py-4 font-medium">{req.label}</td>
                                                    <td className="px-4 py-4">
                                                        {req.exampleImagePath ? (
                                                            <img
                                                                src={req.exampleImagePath}
                                                                alt="示例"
                                                                className="h-12 w-12 rounded object-cover border border-slate-200"
                                                            />
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">未上传</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {req.pathHint ? (
                                                            <span className="text-sm text-slate-600 line-clamp-2">{req.pathHint}</span>
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Badge variant="soft" color={req.required ? 'green' : 'slate'}>
                                                            {req.required ? '必填' : '选填'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(req)}>
                                                                编辑
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(req.id)}>
                                                                删除
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center text-[#9ca3af]">请选择平台</div>
                )}
            </Card>

            {/* Edit Modal */}
            <Modal
                title={editingId ? '编辑截图配置' : '添加截图配置'}
                open={showModal}
                onClose={() => setShowModal(false)}
                className="max-w-lg"
            >
                <div className="space-y-5">
                    <Input
                        label="截图标识 (key)"
                        placeholder="如: profileImg, authImg"
                        value={editForm.key || ''}
                        onChange={e => setEditForm({ ...editForm, key: e.target.value })}
                        disabled={!!editingId}
                    />
                    <p className="text-xs text-slate-400 -mt-3">仅创建时可设置，用于前端识别</p>

                    <Input
                        label="显示名称"
                        placeholder="如: 账号主页截图"
                        value={editForm.label || ''}
                        onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                    />

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#374151]">页面路径提示</label>
                        <textarea
                            value={editForm.pathHint || ''}
                            onChange={e => setEditForm({ ...editForm, pathHint: e.target.value })}
                            placeholder="如: 我的淘宝 > 账号信息"
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">帮助买手找到需要截图的页面</p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#374151]">示例图片</label>
                        <div className="space-y-3">
                            {editForm.exampleImagePath && (
                                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <img
                                        src={editForm.exampleImagePath}
                                        alt="示例预览"
                                        className="h-20 w-20 object-cover rounded"
                                    />
                                    <div className="flex-1 text-xs text-slate-500">当前示例图</div>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, exampleImagePath: null })}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        删除
                                    </button>
                                </div>
                            )}
                            <div>
                                <input
                                    type="file"
                                    id="example-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="example-upload"
                                    className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <span className="text-slate-600">
                                        {editForm.exampleImagePath ? '重新上传示例图' : '点击上传示例图'}
                                    </span>
                                </label>
                                <p className="mt-1 text-xs text-slate-400">建议上传清晰的截图示例，不超过5MB</p>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="排序"
                        type="number"
                        value={String(editForm.sortOrder || 0)}
                        onChange={e => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                    />

                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="checkbox"
                            checked={editForm.required !== false}
                            onChange={e => setEditForm({ ...editForm, required: e.target.checked })}
                            className="h-4 w-4 rounded border-[#d1d5db]"
                        />
                        <span className="text-sm">必填项</span>
                    </label>

                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
