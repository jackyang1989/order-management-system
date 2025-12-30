'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';

// Mock 消息数据
const mockMessages = [
    {
        id: '1',
        title: '任务审核通过',
        content: '您提交的任务 #TB20241230001 已审核通过，佣金已发放至您的账户。',
        author: '系统通知',
        createTime: '2024-12-30 10:00:00',
        read: false
    },
    {
        id: '2',
        title: '提现申请已处理',
        content: '您申请的100元提现已处理完成，请注意查收银行卡到账。',
        author: '财务通知',
        createTime: '2024-12-29 15:30:00',
        read: true
    },
    {
        id: '3',
        title: '新任务上线提醒',
        content: '任务大厅新增50+优质任务，快来抢单赚取佣金吧！',
        author: '运营通知',
        createTime: '2024-12-28 09:00:00',
        read: true
    },
    {
        id: '4',
        title: '账号安全提醒',
        content: '检测到您的账号在新设备登录，如非本人操作请及时修改密码。',
        author: '安全通知',
        createTime: '2024-12-27 20:15:00',
        read: false
    },
    {
        id: '5',
        title: 'VIP会员即将到期',
        content: '您的VIP会员将于7天后到期，续费可享受更多优惠任务。',
        author: '会员通知',
        createTime: '2024-12-26 12:00:00',
        read: true
    }
];

interface Message {
    id: string;
    title: string;
    content: string;
    author: string;
    createTime: string;
    read: boolean;
}

export default function MessagesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadMessages();
    }, [router]);

    const loadMessages = async () => {
        setLoading(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 300));
        setMessages(mockMessages);
        setLoading(false);
    };

    const handleMessageClick = (message: Message) => {
        // 标记为已读
        setMessages(prev => prev.map(m =>
            m.id === message.id ? { ...m, read: true } : m
        ));
        setSelectedMessage(message);
        setShowDetail(true);
    };

    const unreadCount = messages.filter(m => !m.read).length;

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#333' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                    消息通知
                    {unreadCount > 0 && (
                        <span style={{
                            display: 'inline-block',
                            marginLeft: '5px',
                            padding: '2px 6px',
                            background: '#f56c6c',
                            color: '#fff',
                            fontSize: '10px',
                            borderRadius: '10px'
                        }}>{unreadCount}</span>
                    )}
                </div>
            </div>

            {/* 消息列表 */}
            <div style={{ background: '#fff', marginTop: '10px' }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                        暂无消息
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={message.id}
                            onClick={() => handleMessageClick(message)}
                            style={{
                                padding: '15px',
                                borderBottom: index < messages.length - 1 ? '1px solid #f5f5f5' : 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                background: message.read ? '#fff' : '#fafafa'
                            }}
                        >
                            {/* 未读红点 */}
                            {!message.read && (
                                <div style={{
                                    position: 'absolute',
                                    left: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#f56c6c'
                                }}></div>
                            )}
                            <div style={{ marginLeft: message.read ? 0 : '10px' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: message.read ? 'normal' : 'bold',
                                    color: '#333',
                                    marginBottom: '6px'
                                }}>
                                    {message.title}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: '#999',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {message.content}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    color: '#bbb'
                                }}>
                                    <span style={{ marginRight: '4px' }}>🕐</span>
                                    {message.createTime}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 消息详情弹窗 */}
            {showDetail && selectedMessage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            padding: '15px',
                            borderBottom: '1px solid #e5e5e5',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>消息详情</div>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
                                {selectedMessage.title}
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#666',
                                lineHeight: '1.8',
                                marginBottom: '15px'
                            }}>
                                {selectedMessage.content}
                            </p>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                <div style={{ marginBottom: '5px' }}>来源：{selectedMessage.author}</div>
                                <div>时间：{selectedMessage.createTime}</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            borderTop: '1px solid #e5e5e5'
                        }}>
                            <button
                                onClick={() => setShowDetail(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    background: '#409eff',
                                    color: '#fff',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
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
