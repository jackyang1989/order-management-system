import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ChatMessage, ChatMessageType, ChatSenderType } from './entities/chat-message.entity';
import { Visitor } from './entities/visitor.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatMessage)
        private chatMessageRepository: Repository<ChatMessage>,
        @InjectRepository(Visitor)
        private visitorRepository: Repository<Visitor>,
    ) { }

    // ============ Visitor Logic ============

    async trackVisitor(data: Partial<Visitor>): Promise<Visitor> {
        let visitor = await this.visitorRepository.findOne({
            where: { visitorId: data.visitorId },
        });

        if (visitor) {
            // Update existing visitor
            visitor.visitCount += 1;
            visitor.lastActivityAt = new Date();
            visitor.status = 1; // Online
            // Update metadata if provided
            if (data.ip) visitor.ip = data.ip;
            if (data.currentUrl) visitor.currentUrl = data.currentUrl;
            if (data.userAgent) visitor.userAgent = data.userAgent;
        } else {
            // Create new visitor
            visitor = this.visitorRepository.create({
                ...data,
                visitCount: 1,
                lastActivityAt: new Date(),
                status: 1,
            });
        }

        return this.visitorRepository.save(visitor);
    }

    async updateVisitorStatus(visitorId: string, status: number): Promise<void> {
        await this.visitorRepository.update(
            { visitorId },
            { status, lastActivityAt: new Date() },
        );
    }

    async findVisitor(visitorId: string): Promise<Visitor | null> {
        return this.visitorRepository.findOne({ where: { visitorId } });
    }

    async getOnlineVisitors(): Promise<Visitor[]> {
        // Consider visitors active in the last 5 minutes as online if status is 1
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.visitorRepository.find({
            where: {
                status: 1,
                lastActivityAt: MoreThan(fiveMinutesAgo),
            },
            order: { lastActivityAt: 'DESC' },
        });
    }

    // ============ Message Logic ============

    async createMessage(
        visitorId: string,
        content: string,
        senderType: ChatSenderType,
        agentId?: string,
        type: ChatMessageType = ChatMessageType.TEXT,
    ): Promise<ChatMessage> {
        const message = this.chatMessageRepository.create({
            visitorId,
            content,
            senderType,
            agentId,
            type,
            createdAt: new Date(),
        });
        return this.chatMessageRepository.save(message);
    }

    async getMessages(visitorId: string, limit: number = 50): Promise<ChatMessage[]> {
        return this.chatMessageRepository.find({
            where: { visitorId },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }

    async getUnreadCount(visitorId: string): Promise<number> {
        return this.chatMessageRepository.count({
            where: {
                visitorId,
                senderType: ChatSenderType.VISITOR,
                isRead: false,
            },
        });
    }

    async markAsRead(visitorId: string): Promise<void> {
        await this.chatMessageRepository.update(
            { visitorId, isRead: false },
            { isRead: true },
        );
    }

    async sendMessageToVisitor(visitorId: string, content: string, agentId?: string): Promise<ChatMessage> {
        const message = this.chatMessageRepository.create({
            visitorId,
            content,
            senderType: ChatSenderType.AGENT,
            agentId, // Ensure entity has this field or omit if not
            createdAt: new Date(),
        });
        return this.chatMessageRepository.save(message);
    }
}
