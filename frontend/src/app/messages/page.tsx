'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';
import {
    fetchMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    Message
} from '../../services/messageService';

export default function MessagesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadMessages();
    }, [router]);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const result = await fetchMessages();
            setMessages(result.list || []);
        } catch (error) {
            console.error('Load messages error:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClick = async (message: Message) => {
        if (!message.isRead) {
            await markAsRead(message.id);
            setMessages(prev => prev.map(m =>
                m.id === message.id ? { ...m, isRead: true } : m
            ));
        }
        setSelectedMessage(message);
        setShowDetail(true);
    };

    const handleMarkAllAsRead = async () => {
        const result = await markAllAsRead();
        if (result.success) {
            setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除这条消息吗？')) return;
        const result = await deleteMessage(id);
        if (result.success) {
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            system: '系统',
            task: '任务',
            order: '订单',
            finance: '财务',
            promotion: '活动',
            review: '审核'
        };
        return labels[type] || '通知';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            system: { bg: 'bg-gray-100', text: 'text-gray-600' },
            task: { bg: 'bg-blue-100', text: 'text-primary-600' },
            order: { bg: 'bg-green-100', text: 'text-success-400' },
            finance: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            promotion: { bg: 'bg-red-100', text: 'text-danger-500' },
            review: { bg: 'bg-purple-100', text: 'text-purple-600' }
        };
        return colors[type] || colors.system;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return '昨天';
        } else if (days < 7) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        }
    };

    const filteredMessages = activeFilter === 'all'
        ? messages
        : messages.filter(m => m.type === activeFilter);

    const unreadCount = messages.filter(m => !m.isRead).length;

    const filterOptions = [
        { key: 'all', label: '全部' },
        { key: 'system', label: '系统' },
        { key: 'order', label: '订单' },
        { key: 'task', label: '任务' },
        { key: 'finance', label: '财务' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* 顶部栏 */}
            <div className="bg-white h-11 flex items-center justify-center border-b border-gray-200 sticky top-0 z-10">
                <div
                    onClick={() => router.back()}
                    className="absolute left-4 text-xl cursor-pointer text-gray-700"
                >
                    ‹
                </div>
                <div className="text-base font-medium text-gray-800 flex items-center">
                    消息通知
                    {unreadCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-danger-400 text-white text-xs rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <div
                        onClick={handleMarkAllAsRead}
                        className="absolute right-4 text-xs text-primary-500 cursor-pointer"
                    >
                        全部已读
                    </div>
                )}
            </div>

            {/* 筛选标签 */}
            <div className="bg-white px-4 py-2 flex gap-2 overflow-x-auto border-b border-gray-100">
                {filterOptions.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setActiveFilter(opt.key)}
                        className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                            activeFilter === opt.key
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* 消息列表 */}
            <div className="bg-white mt-2">
                {filteredMessages.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        <div className="text-4xl mb-2">📭</div>
                        暂无消息
                    </div>
                ) : (
                    filteredMessages.map((message, index) => (
                        <div
                            key={message.id}
                            onClick={() => handleMessageClick(message)}
                            className={`px-4 py-3.5 cursor-pointer relative ${
                                index < filteredMessages.length - 1 ? 'border-b border-gray-100' : ''
                            } ${message.isRead ? 'bg-white' : 'bg-blue-50/30'}`}
                        >
                            {/* 未读红点 */}
                            {!message.isRead && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-danger-400" />
                            )}
                            <div className={`${message.isRead ? '' : 'ml-2'} pr-8`}>
                                <div className="flex items-center mb-1.5">
                                    <span className={`text-xs px-1.5 py-0.5 rounded mr-2 ${getTypeColor(message.type).bg} ${getTypeColor(message.type).text}`}>
                                        {getTypeLabel(message.type)}
                                    </span>
                                    <span className={`text-sm ${message.isRead ? 'font-normal' : 'font-semibold'} text-gray-800 flex-1 truncate`}>
                                        {message.title}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                        {formatDate(message.createdAt)}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                    {message.content}
                                </div>
                            </div>
                            {/* 删除按钮 */}
                            <div
                                onClick={(e) => handleDelete(message.id, e)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg cursor-pointer hover:text-danger-400"
                            >
                                ×
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 消息详情弹窗 */}
            {showDetail && selectedMessage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowDetail(false)}
                >
                    <div
                        className="bg-white rounded-lg w-11/12 max-w-md max-h-[80vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-gray-200 text-base font-bold text-center">
                            消息详情
                        </div>
                        <div className="p-5">
                            <div className="mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${getTypeColor(selectedMessage.type).bg} ${getTypeColor(selectedMessage.type).text}`}>
                                    {getTypeLabel(selectedMessage.type)}
                                </span>
                            </div>
                            <h3 className="text-base font-medium mb-4 text-gray-800">
                                {selectedMessage.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
                                {selectedMessage.content}
                            </p>
                            <div className="text-xs text-gray-400">
                                <div>时间：{selectedMessage.createdAt}</div>
                            </div>
                        </div>
                        <div className="flex border-t border-gray-200">
                            <button
                                onClick={() => setShowDetail(false)}
                                className="flex-1 py-3 border-none bg-primary-500 text-white text-sm cursor-pointer rounded-b-lg hover:bg-primary-600"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
