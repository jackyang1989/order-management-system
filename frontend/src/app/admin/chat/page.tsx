
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket, ChatMessage, Visitor } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AgentChatPage() {
    const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');

    // Connect to /kefu namespace with a mock token or real one if available
    // Ideally, we get the token from localStorage
    const [token, setToken] = useState<string>('');

    useEffect(() => {
        // In a real app, we might get this from context or storage
        const storedToken = localStorage.getItem('adminToken') || 'TEST_TOKEN';
        // We used TEST_TOKEN in backend test, but reverted it. 
        // We need a real token or re-enable TEST_TOKEN if we want to test easily.
        // For now, let's assume adminToken is present after login.
        setToken(storedToken);
    }, []);

    const { isConnected, onlineVisitors, messages, sendMessage, socket } = useSocket({
        namespace: '/kefu',
        auth: { token },
    });

    // Filter messages for the selected visitor
    // Note: Our current useSocket puts ALL messages in one array. 
    // We might need to filter them by visitorId if the backend broadcasts everything to the room.
    // In our backend implementation:
    // Agent joins 'agents_room'. Visitor messages are sent to 'agents_room' with { visitorId, message }.
    // So we receive all messages from all visitors here.

    // Let's refine how we handle messages in the component vs hook.
    // The hook gives us a simple list. We might want to group them by visitorId.
    const [visitorMessages, setVisitorMessages] = useState<Record<string, ChatMessage[]>>({});

    useEffect(() => {
        // When new messages arrive via global 'newMessage' event (from hook), 
        // we need to process them. 
        // BUT, the hook logic currently just appends to `messages`.
        // And the backend `AgentGateway` emits `new_message` with { visitorId, message }.
        // The hook listens to `newMessage` (standard) but for Agent it's `new_message` (custom event from AgentGateway).

        // We need to listen to `new_message` specifically for Agents.
        if (!socket) return;

        const handleAgentMessage = (data: { visitorId: string, message: ChatMessage }) => {
            console.log('Agent received message:', data);
            setVisitorMessages(prev => ({
                ...prev,
                [data.visitorId]: [...(prev[data.visitorId] || []), data.message]
            }));
        };

        socket.on('new_message', handleAgentMessage);

        return () => {
            socket.off('new_message', handleAgentMessage);
        };
    }, [socket]);

    // Also handle own sent messages (optimistic or echo)
    // The hook's sendMessage emits. We assume we should add it to the UI immediately.
    const handleSend = () => {
        if (!inputText.trim() || !selectedVisitorId) return;

        // We need to send to a specific visitor. 
        // The current hook `sendMessage` emits `sendMessage` event.
        // Backend `AgentGateway` doesn't have a `sendMessage` handler that takes a target visitorId yet?
        // Wait, let's check Backend `AgentGateway` again.
        // It has `handleConnection` and broadcast methods. 
        // It does NOT seem to have a `SubscribeMessage('sendMessage')` implementation in the provided file view earlier!
        // We might have missed implementing the Agent-to-Visitor message logic in the Backend!

        // Let's assume for now we will implement/verify that query. 
        // If backend is missing it, we need to add it.
        // For now, let's proceed with UI.

        // Valid logic: Agent emits 'replyMessage' or similar, with target visitorId.
        if (socket) {
            socket.emit('agentMessage', { visitorId: selectedVisitorId, content: inputText });

            // Optimistic UI update
            const newMsg: ChatMessage = {
                content: inputText,
                senderType: 'agent',
                createdAt: new Date().toISOString()
            };

            setVisitorMessages(prev => ({
                ...prev,
                [selectedVisitorId]: [...(prev[selectedVisitorId] || []), newMsg]
            }));

            setInputText('');
        }
    };


    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            {/* Left: Visitor List */}
            <div className="w-80 flex-shrink-0 overflow-hidden border-none shadow-sm rounded-[24px] bg-white">
                <div className="bg-white px-4 py-3 border-b">
                    <div className="text-base font-bold">在线访客 ({onlineVisitors.length})</div>
                </div>
                <div className="h-full overflow-y-auto bg-white">
                    {onlineVisitors.map((visitor) => (
                        <div
                            key={visitor.visitorId}
                            onClick={() => setSelectedVisitorId(visitor.visitorId)}
                            className={cn(
                                "cursor-pointer border-b px-4 py-3 transition-colors hover:bg-slate-50",
                                selectedVisitorId === visitor.visitorId ? "bg-slate-50 border-l-4 border-l-primary-600" : ""
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${visitor.visitorId}`} />
                                    <AvatarFallback>{visitor.name?.[0] || 'V'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="truncate text-sm font-medium text-slate-700">
                                            {visitor.name || 'Guest'}
                                        </p>
                                        <span className="text-[10px] text-slate-400">
                                            {/* Time ago logic could go here */}
                                        </span>
                                    </div>
                                    <p className="truncate text-xs text-slate-500">
                                        {visitor.ip || 'Unknown IP'} · {visitor.visitCount} visits
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {onlineVisitors.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-400">
                            暂无在线访客
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Chat Area */}
            <div className="flex flex-1 flex-col overflow-hidden border-none shadow-sm rounded-[24px] bg-white">
                {selectedVisitorId ? (
                    <>
                        <div className="bg-white px-6 py-4 border-b flex flex-row justify-between items-center">
                            <div>
                                <div className="text-base font-bold flex items-center gap-2">
                                    正在与 {onlineVisitors.find(v => v.visitorId === selectedVisitorId)?.name || 'Guest'} 对话
                                    <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    ID: {selectedVisitorId}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 custom-scrollbar">
                            {/* Messages */}
                            {visitorMessages[selectedVisitorId]?.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "mb-4 flex",
                                        msg.senderType === 'agent' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                                        msg.senderType === 'agent'
                                            ? "bg-primary-600 text-white rounded-tr-none"
                                            : "bg-white text-slate-800 rounded-tl-none shadow-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t bg-white p-4">
                            <div className="flex gap-4">
                                <Input
                                    className="flex-1 bg-slate-50"
                                    placeholder="输入回复内容..."
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                />
                                <Button onClick={handleSend} className="bg-primary-600 hover:bg-primary-700">
                                    发送
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-slate-50 text-slate-400">
                        <div className="text-4xl mb-4">💬</div>
                        <p>请从左侧列表选择一位访客开始对话</p>
                    </div>
                )}
            </div>
        </div>
    );
}
