
import { useState, useEffect, useRef } from 'react';
import { useSocket, ChatMessage } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Generate a random visitor ID if not exists
const getVisitorId = () => {
    if (typeof window !== 'undefined') {
        let id = localStorage.getItem('visitorId');
        if (!id) {
            id = 'visitor_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitorId', id);
        }
        return id;
    }
    return 'visitor_guest';
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [visitorId, setVisitorId] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisitorId(getVisitorId());
    }, []);

    // Connect to /visitor namespace
    // We pass visitor info in query for handshake
    const { isConnected, messages, sendMessage } = useSocket({
        namespace: '/visitor',
        query: {
            visitorId: visitorId,
            name: 'Guest Visitor', // We can prompt for name later
            url: typeof window !== 'undefined' ? window.location.pathname : ''
        }
    });

    const handleSend = () => {
        if (!inputText.trim()) return;
        sendMessage(inputText);
        setInputText('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end sm:bottom-8 sm:right-8">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] overflow-hidden rounded-2xl border bg-white shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in">
                    <div className="bg-primary px-4 py-3 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                                    🎧
                                </div>
                                <div>
                                    <div className="text-sm font-medium">在线客服</div>
                                    <p className="text-xs text-primary-100">
                                        {isConnected ? '在线' : '连接中...'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 hover:bg-white/10"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col p-0">
                        {/* Messages Area */}
                        <div className="flex h-[400px] flex-col overflow-y-auto bg-slate-50 p-4 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="mt-8 text-center text-xs text-slate-400">
                                    <p>👋 您好，请问有什么可以帮您？</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "mb-3 max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                        msg.senderType === 'visitor'
                                            ? "self-end bg-primary-600 text-white rounded-tr-none"
                                            : "self-start bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t bg-white p-3">
                            <div className="flex gap-2">
                                <Input
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="输入消息..."
                                    className="rounded-full border-slate-200 bg-slate-50 focus-visible:ring-primary-600"
                                />
                                <Button
                                    onClick={handleSend}
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-full bg-primary-600 hover:bg-primary-700"
                                    disabled={!isConnected || !inputText.trim()}
                                >
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Trigger Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-primary-600 shadow-lg transition-transform hover:scale-110 hover:bg-primary-700 hover:shadow-xl active:scale-95"
                >
                    <span className="text-2xl">💬</span>
                    {/* Notification Badge could go here */}
                </Button>
            )}
        </div>
    );
}
