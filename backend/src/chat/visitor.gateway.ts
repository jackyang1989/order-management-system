import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AgentGateway } from './agent.gateway';
import { ChatSenderType, ChatMessageType } from './entities/chat-message.entity';

@WebSocketGateway({
    namespace: 'visitor',
    cors: {
        origin: '*',
    },
})
export class VisitorGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private chatService: ChatService,
        private agentGateway: AgentGateway, // Inject AgentGateway to notify agents
    ) { }

    async handleConnection(client: Socket) {
        try {
            // Visitor Identification (Query param visitorId or generated)
            const visitorId = client.handshake.query.visitorId as string;
            const visitorName = client.handshake.query.name as string;

            if (!visitorId) {
                // In a real app, we might reject or assign a temp ID
                // For now, let's assume client MUST generate a UUID
                return;
            }

            await this.updateVisitorPresence(client, visitorId, visitorName, 1);

            // Join own room
            client.join(`visitor_${visitorId}`);

            // Send history
            const history = await this.chatService.getMessages(visitorId);
            client.emit('history', history);

        } catch (e) {
            console.error('Visitor connection error', e);
        }
    }

    async handleDisconnect(client: Socket) {
        const visitorId = client.handshake.query.visitorId as string;
        if (visitorId) {
            await this.chatService.updateVisitorStatus(visitorId, 0); // Offline
            // Optionally notify agents of offline status
            // this.agentGateway.notifyVisitorOffline(visitorId);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { content: string, type?: ChatMessageType },
    ) {
        const visitorId = client.handshake.query.visitorId as string;
        if (!visitorId) return;

        // 1. Save Message
        const message = await this.chatService.createMessage(
            visitorId,
            payload.content,
            ChatSenderType.VISITOR,
            undefined,
            payload.type || ChatMessageType.TEXT
        );

        // 2. Ack to visitor
        client.emit('messageSent', message);

        // 3. Notify Agents
        this.agentGateway.notifyVisitorMessage(visitorId, message);
    }

    @SubscribeMessage('updateStatus')
    async handleStatus(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { url: string, title?: string },
    ) {
        const visitorId = client.handshake.query.visitorId as string;
        const visitorName = client.handshake.query.name as string;
        if (visitorId) {
            await this.updateVisitorPresence(client, visitorId, visitorName, 1, payload.url);
        }
    }

    // Common logic to track visitor and notify agents
    private async updateVisitorPresence(
        client: Socket,
        visitorId: string,
        name: string,
        status: number,
        currentUrl?: string
    ) {
        const ip = client.handshake.address;
        const userAgent = client.handshake.headers['user-agent'];

        const visitor = await this.chatService.trackVisitor({
            visitorId,
            name: name || `Guest-${visitorId.slice(0, 6)}`,
            status,
            ip,
            userAgent,
            currentUrl: currentUrl || (client.handshake.query.url as string),
        });

        // P0 Feature: Sensitive Notification
        // Broadcasting this event triggers the "Ding" on agent side
        this.agentGateway.notifyVisitorOnline(visitor);
    }
}
