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
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

// P0: Agent Gateway - Handles Agent Connections
@WebSocketGateway({
    namespace: 'kefu',
    cors: {
        origin: '*',
    },
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            // 1. Verify Token
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);

            // 2. Join Agent Room
            const agentId = payload.sub;
            client.join(`agent_${agentId}`);
            client.join('agents_room'); // Room for all agents

            // 3. Send initial online visitors list
            const visitors = await this.chatService.getOnlineVisitors();
            client.emit('init_visitors', visitors);

            console.log(`Agent connected: ${agentId}`);
        } catch (e) {
            console.error('Agent connection unauthorized', e);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log('Agent disconnected');
    }

    @SubscribeMessage('agentMessage')
    handleAgentMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { visitorId: string, content: string }) {
        const token = this.extractToken(client);
        if (!token) return;

        // In real app, we verify token again or use the one from connection context
        // Dispatch to Visitor Room
        this.chatService.sendMessageToVisitor(data.visitorId, data.content);
    }

    // --- Broadcasting Methods (called by VisitorGateway via Service/Event) ---

    // Notify all agents about a new/updated visitor
    notifyVisitorOnline(visitor: any) {
        this.server.to('agents_room').emit('visitor_online', visitor);
    }

    notifyVisitorMessage(visitorId: string, message: any) {
        this.server.to('agents_room').emit('new_message', { visitorId, message });
    }

    private extractToken(client: Socket): string | undefined {
        // Support query param or auth header
        const token = client.handshake.query.token as string || client.handshake.headers.authorization?.split(' ')[1];
        return token;
    }
}
