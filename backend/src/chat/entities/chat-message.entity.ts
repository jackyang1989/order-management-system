import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum ChatMessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    SYSTEM = 'system',
}

export enum ChatSenderType {
    VISITOR = 'visitor',
    AGENT = 'agent',
}

@Entity('chat_messages')
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    visitorId: string; // 关联访客ID

    @Column({ nullable: true })
    @Index()
    agentId: string; // 关联客服ID (User表)

    @Column({ type: 'enum', enum: ChatSenderType })
    senderType: ChatSenderType; // 发送者类型

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'enum', enum: ChatMessageType, default: ChatMessageType.TEXT })
    type: ChatMessageType;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    @Index()
    createdAt: Date;
}
