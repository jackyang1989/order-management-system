'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';

interface MessageTemplate {
    id: string;
    code: string;
    name: string;
    title: string;
    content: string;
    type: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const typeLabels: Record<number, string> = {
    1: '系统消息',
    2: '订单消息',
    3: '任务消息',
    4: '财务消息',
    5: '审核消息',
    6: '私信',
    7: '公告通知',
};

export default function AdminMessagesPage() {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [form, setForm] = useState({
        code: '',
        name: '',
        title: '',
        content: '',
        type: 1,
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/messages/admin/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setTemplates(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setForm({ code: '', name: '', title: '', content: '', type: 1 });
        setShowModal(true);
    };

    const handleEdit = (template: MessageTemplate) => {
        setEditingTemplate(template);
        setForm({
            code: template.code,
            name: template.name,
            title: template.title,
            content: template.content,
            type: template.type,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!form.code || !form.name || !form.title || !form.content) {
            alert('请填写完整信息');
            return;
        }
        const token = localStorage.getItem('adminToken');
        try {
            const url = editingTemplate
                ? `${BASE_URL}/messages/admin/templates/${editingTemplate.id}`
                : `${BASE_URL}/messages/admin/templates`;
            const res = await fetch(url, {
                method: editingTemplate ? 'PUT' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.success) {
                setShowModal(false);
                loadTemplates();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个模板吗？')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/messages/admin/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) loadTemplates();
            else alert(json.message || '操作失败');
        } catch (e) {
            alert('操作失败');
        }
    };

    const handleInitTemplates = async () => {
        if (!confirm('确定要初始化默认模板吗？这将添加系统预设的消息模板。')) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/messages/admin/templates/init`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                alert('初始化成功');
                loadTemplates();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (e) {
            alert('操作失败');
        }
    };

    return (
        <div className="space-y-4">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">消息模板管理</span>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6b7280]">共 {templates.length} 个模板</span>
                        <Button variant="secondary" onClick={handleInitTemplates}>初始化默认模板</Button>
                        <Button onClick={handleCreate}>+ 新建模板</Button>
                    </div>
                </div>
                <p className="mb-6 text-sm text-[#6b7280]">
                    消息模板用于系统自动发送通知。模板内容支持变量，如 {'{orderNo}'}, {'{amount}'}, {'{userName}'} 等，系统会自动替换为实际值。
                </p>

                <div className="overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                    ) : templates.length === 0 ? (
                        <div className="py-12 text-center text-[#9ca3af]">暂无模板，点击"初始化默认模板"添加系统预设模板</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium text-[#374151]">模板代码</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium text-[#374151]">模板名称</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium text-[#374151]">消息标题</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-[#374151]">类型</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-[#374151]">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium text-[#374151]">更新时间</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-[#374151]">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(template => (
                                        <tr key={template.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-3.5 font-mono text-sm text-[#6b7280]">{template.code}</td>
                                            <td className="px-4 py-3.5 font-medium">{template.name}</td>
                                            <td className="max-w-[200px] truncate px-4 py-3.5 text-[#6b7280]">{template.title}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color="blue">{typeLabels[template.type] || '未知'}</Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={template.isActive ? 'green' : 'slate'}>
                                                    {template.isActive ? '启用' : '禁用'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#9ca3af]">
                                                {new Date(template.updatedAt).toLocaleString('zh-CN')}
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(template)}>编辑</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(template.id)}>删除</Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>

            <Modal title={editingTemplate ? '编辑模板' : '新建模板'} open={showModal} onClose={() => setShowModal(false)} className="max-w-xl">
                <div className="space-y-4">
                    <Input
                        label="模板代码"
                        placeholder="如: ORDER_CREATED, WITHDRAWAL_APPROVED"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        disabled={!!editingTemplate}
                    />
                    <Input
                        label="模板名称"
                        placeholder="请输入模板名称"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                        label="消息标题"
                        placeholder="如: 订单 {orderNo} 已创建"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">消息内容</label>
                        <textarea
                            className="w-full resize-y rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={4}
                            placeholder="支持变量：{orderNo}, {amount}, {userName} 等"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">消息类型</label>
                        <Select
                            value={String(form.type)}
                            onChange={(v) => setForm({ ...form, type: parseInt(v) })}
                            options={[
                                { value: '1', label: '系统消息' },
                                { value: '2', label: '订单消息' },
                                { value: '3', label: '任务消息' },
                                { value: '4', label: '财务消息' },
                                { value: '5', label: '审核消息' },
                                { value: '6', label: '私信' },
                                { value: '7', label: '公告通知' },
                            ]}
                        />
                    </div>
                    <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>取消</Button>
                        <Button onClick={handleSubmit}>{editingTemplate ? '保存' : '创建'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
