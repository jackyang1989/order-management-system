'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    const [editingRequirement, setEditingRequirement] = useState<ImageRequirement | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // 加载所有平台和配置
    useEffect(() => {
        loadPlatforms();
    }, []);

    const loadPlatforms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/admin/config/platforms/image-requirements`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setPlatforms(data.data);
                if (data.data.length > 0 && !selectedPlatformId) {
                    setSelectedPlatformId(data.data[0].platformId);
                }
            }
        } catch (error) {
            console.error('加载失败:', error);
            alert('加载平台配置失败');
        } finally {
            setLoading(false);
        }
    };

    const selectedPlatform = platforms.find(p => p.platformId === selectedPlatformId);

    const handleEdit = (requirement: ImageRequirement) => {
        setEditingRequirement({ ...requirement });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingRequirement) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/admin/config/image-requirements/${editingRequirement.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        label: editingRequirement.label,
                        pathHint: editingRequirement.pathHint,
                        required: editingRequirement.required,
                        sortOrder: editingRequirement.sortOrder,
                    }),
                }
            );

            const data = await res.json();
            if (data.success) {
                alert('保存成功');
                setIsEditing(false);
                setEditingRequirement(null);
                loadPlatforms();
            } else {
                alert('保存失败');
            }
        } catch (error) {
            console.error('保存失败:', error);
            alert('保存失败');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingRequirement(null);
    };

    const handleAddNew = () => {
        if (!selectedPlatformId) return;

        setEditingRequirement({
            id: '',
            key: '',
            label: '',
            exampleImagePath: null,
            pathHint: null,
            required: true,
            sortOrder: (selectedPlatform?.requirements.length || 0) + 1,
        });
        setIsEditing(true);
    };

    const handleCreate = async () => {
        if (!editingRequirement || !selectedPlatformId) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/admin/config/platforms/${selectedPlatformId}/image-requirements`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        key: editingRequirement.key,
                        label: editingRequirement.label,
                        pathHint: editingRequirement.pathHint,
                        required: editingRequirement.required,
                        sortOrder: editingRequirement.sortOrder,
                    }),
                }
            );

            const data = await res.json();
            if (data.success) {
                alert('创建成功');
                setIsEditing(false);
                setEditingRequirement(null);
                loadPlatforms();
            } else {
                alert('创建失败');
            }
        } catch (error) {
            console.error('创建失败:', error);
            alert('创建失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个截图配置吗?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/admin/config/image-requirements/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();
            if (data.success) {
                alert('删除成功');
                loadPlatforms();
            } else {
                alert('删除失败');
            }
        } catch (error) {
            console.error('删除失败:', error);
            alert('删除失败');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">平台截图配置管理</h1>

            <div className="grid grid-cols-12 gap-6">
                {/* 左侧:平台列表 */}
                <div className="col-span-3">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="font-bold mb-4">选择平台</h3>
                        <div className="space-y-2">
                            {platforms.map((platform) => (
                                <button
                                    key={platform.platformId}
                                    onClick={() => setSelectedPlatformId(platform.platformId)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                        selectedPlatformId === platform.platformId
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="font-medium">{platform.platformName}</div>
                                    <div className="text-sm text-gray-500">
                                        {platform.requirements.length} 个截图配置
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧:截图配置列表 */}
                <div className="col-span-9">
                    {selectedPlatform && (
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-4 border-b flex justify-between items-center">
                                <h3 className="font-bold text-lg">{selectedPlatform.platformName} - 截图配置</h3>
                                <Button onClick={handleAddNew} disabled={isEditing}>
                                    添加截图配置
                                </Button>
                            </div>

                            <div className="p-4">
                                {/* 编辑表单 */}
                                {isEditing && editingRequirement && (
                                    <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50">
                                        <h3 className="text-lg font-bold mb-4">
                                            {editingRequirement.id ? '编辑截图配置' : '新增截图配置'}
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">截图标识 (key)</label>
                                                <Input
                                                    value={editingRequirement.key}
                                                    onChange={(e) =>
                                                        setEditingRequirement({
                                                            ...editingRequirement,
                                                            key: e.target.value,
                                                        })
                                                    }
                                                    placeholder="例如: profileImg, authImg"
                                                    disabled={!!editingRequirement.id}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    仅创建时可设置,用于前端识别
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">显示名称</label>
                                                <Input
                                                    value={editingRequirement.label}
                                                    onChange={(e) =>
                                                        setEditingRequirement({
                                                            ...editingRequirement,
                                                            label: e.target.value,
                                                        })
                                                    }
                                                    placeholder="例如: 账号主页截图"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">页面路径提示</label>
                                                <textarea
                                                    value={editingRequirement.pathHint || ''}
                                                    onChange={(e) =>
                                                        setEditingRequirement({
                                                            ...editingRequirement,
                                                            pathHint: e.target.value,
                                                        })
                                                    }
                                                    placeholder="例如: 我的淘宝 > 账号信息"
                                                    rows={3}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    帮助用户找到截图页面的路径提示
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">排序顺序</label>
                                                <Input
                                                    type="number"
                                                    value={editingRequirement.sortOrder}
                                                    onChange={(e) =>
                                                        setEditingRequirement({
                                                            ...editingRequirement,
                                                            sortOrder: parseInt(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editingRequirement.required}
                                                    onChange={(e) =>
                                                        setEditingRequirement({
                                                            ...editingRequirement,
                                                            required: e.target.checked,
                                                        })
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                <label className="ml-2">必填项</label>
                                            </div>

                                            <div className="flex gap-2 pt-4">
                                                <Button
                                                    onClick={editingRequirement.id ? handleSave : handleCreate}
                                                >
                                                    {editingRequirement.id ? '保存' : '创建'}
                                                </Button>
                                                <Button onClick={handleCancel} variant="outline">
                                                    取消
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 配置列表 */}
                                <div className="space-y-3">
                                    {selectedPlatform.requirements.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            暂无截图配置,点击"添加截图配置"创建
                                        </div>
                                    ) : (
                                        selectedPlatform.requirements
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="p-4 border rounded-lg hover:bg-gray-50"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-bold text-lg">
                                                                    {req.label}
                                                                </span>
                                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                                                    {req.key}
                                                                </span>
                                                                {req.required && (
                                                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                                                        必填
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-gray-500">
                                                                    排序: {req.sortOrder}
                                                                </span>
                                                            </div>

                                                            {req.pathHint && (
                                                                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                                                    <span className="font-medium text-blue-700">
                                                                        路径提示:
                                                                    </span>{' '}
                                                                    <span className="text-gray-700">
                                                                        {req.pathHint}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {req.exampleImagePath && (
                                                                <div className="mt-2 text-sm text-gray-600">
                                                                    <span className="font-medium">示例图片:</span>{' '}
                                                                    {req.exampleImagePath}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-2 ml-4">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleEdit(req)}
                                                                disabled={isEditing}
                                                            >
                                                                编辑
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDelete(req.id)}
                                                                disabled={isEditing}
                                                            >
                                                                删除
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
