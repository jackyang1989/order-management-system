'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { toastSuccess, toastError } from '../../../../../lib/toast';

interface Message {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

interface UserInfo {
    id: string;
    username: string;
    phone: string;
}

export default function UserMessagesPage() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserInfo | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState({ title: '', content: '' });
    const [sending, setSending] = useState(false);

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => {
        loadUserInfo();
        loadMessages();
    }, [userId]);

    const loadUserInfo = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    };

    const loadMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}/messages`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(data.data || []);
            }
        } catch (error) {
            console.error('获取消息列表失败:', error);
        }
        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!newMessage.title.trim() || !newMessage.content.trim()) {
            toastError('请输入标题和内容');
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(newMessage)
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess('消息发送成功');
                setNewMessage({ title: '', content: '' });
                loadMessages();
            } else {
                toastError(data.message || '发送失败');
            }
        } catch (error) {
            toastError('发送失败');
        }
        setSending(false);
    };

    return (
        <div className="space-y-6">
            {/* 用户信息 */}
            <Card className="bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            用户消息 - {user?.username || '加载中...'}
                        </h2>
                        <p className="text-sm text-[#6b7280]">
                            用户ID: {userId} | 手机: {user?.phone || '-'}
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => window.history.back()}>
                        返回
                    </Button>
                </div>
            </Card>

            {/* 发送新消息 */}
            <Card className="bg-white">
                <h3 className="mb-4 font-medium">发送新消息</h3>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                            消息标题
                        </label>
                        <input
                            type="text"
                            value={newMessage.title}
                            onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                            placeholder="请输入消息标题"
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                            消息内容
                        </label>
                        <textarea
                            value={newMessage.content}
                            onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                            placeholder="请输入消息内容..."
                            rows={4}
                            className="w-full resize-y rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSendMessage} disabled={sending}>
                            {sending ? '发送中...' : '发送消息'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 消息历史 */}
            <Card className="bg-white">
                <h3 className="mb-4 font-medium">消息历史</h3>
                {loading ? (
                    <div className="py-8 text-center text-[#9ca3af]">加载中...</div>
                ) : messages.length === 0 ? (
                    <div className="py-8 text-center text-[#9ca3af]">暂无消息记录</div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`rounded-md border p-4 ${
                                    msg.isRead
                                        ? 'border-[#e5e7eb] bg-[#f9fafb]'
                                        : 'border-primary/20 bg-primary/5'
                                }`}
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="font-medium">{msg.title}</span>
                                    <span className="text-xs text-[#9ca3af]">
                                        {new Date(msg.createdAt).toLocaleString('zh-CN')}
                                    </span>
                                </div>
                                <p className="text-sm text-[#4b5563]">{msg.content}</p>
                                {!msg.isRead && (
                                    <span className="mt-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                        未读
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
