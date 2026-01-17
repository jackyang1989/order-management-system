
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Define message type
export interface ChatMessage {
    id?: number;
    content: string;
    senderType: 'visitor' | 'agent';
    createdAt?: string;
}

// Define Visitor type
export interface Visitor {
    visitorId: string;
    name: string;
    status: 'online' | 'offline';
    unreadCount?: number;
    lastActivityAt?: string;
    ip?: string;
    userAgent?: string;
    currentUrl?: string;
    referer?: string;
}

// Hook options
interface UseSocketOptions {
    namespace: string; // '/visitor' or '/kefu'
    auth?: { [key: string]: any };
    query?: { [key: string]: any };
}

export const useSocket = ({ namespace, auth, query }: UseSocketOptions) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [onlineVisitors, setOnlineVisitors] = useState<Visitor[]>([]);

    useEffect(() => {
        // Prevent multiple connections
        if (socketRef.current) return;

        // Initialize Socket
        // Note: In development, Next.js proxy might handle /socket.io, but usually we point to backend port
        // Backend is on 6006. Frontend is on 6005 (or 3000).
        // We should use an environment variable for the socket URL, but for now hardcode localhost:6006
        const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

        console.log(`Connecting to WebSocket: ${SOCKET_URL}${namespace}`);

        const socket = io(`${SOCKET_URL}${namespace}`, {
            transports: ['websocket'],
            auth,
            query,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`✅ Connected to ${namespace}`);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Disconnected from ${namespace}`);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error(`Socket connection error (${namespace}):`, err);
        });

        // Common events
        socket.on('newMessage', (message: ChatMessage) => {
            console.log('Received message:', message);
            setMessages((prev) => [...prev, message]);
        });

        // Agent specific: visitor_online
        socket.on('visitor_online', (visitor: Visitor) => {
            console.log('Visitor Online:', visitor);
            setOnlineVisitors(prev => {
                const index = prev.findIndex(v => v.visitorId === visitor.visitorId);
                if (index > -1) {
                    const newVisitors = [...prev];
                    newVisitors[index] = { ...newVisitors[index], ...visitor, status: 'online' };
                    return newVisitors;
                } else {
                    return [visitor, ...prev];
                }
            });
        });

        // Agent specific: init_visitors
        socket.on('init_visitors', (visitors: Visitor[]) => {
            console.log('Init Visitors:', visitors);
            setOnlineVisitors(visitors);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [namespace]); // Re-connect only if namespace changes (auth/query should be stable or handled via refs if dynamic)

    const sendMessage = useCallback((content: string, type: 'text' | 'image' = 'text') => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('sendMessage', { content, type });
            // Optimistic update for sender? usually wait for Ack or echo.
            // For now, let's assume server echos or we just rely on 'newMessage' event.
        }
    }, [isConnected]);

    // Agent: Join specific visitor room to chat
    // Note: logic might be different for agent vs visitor.
    // Visitor is always in their own room. Agent joins visitor room or sends to specific user.

    return {
        socket: socketRef.current,
        isConnected,
        messages,
        setMessages, // Allow manual update (e.g. loading history)
        sendMessage,
        onlineVisitors
    };
};
