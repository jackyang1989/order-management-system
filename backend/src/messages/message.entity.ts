import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';

// 消息类型
export enum MessageType {
    SYSTEM = 1,       // 系统消息
    ORDER = 2,        // 订单消息
    TASK = 3,         // 任务消息
    FINANCE = 4,      // 财务消息
    REVIEW = 5,       // 审核消息
    PRIVATE = 6,      // 私信
    NOTICE = 7,       // 公告通知
}

// 消息状态
export enum MessageStatus {
    UNREAD = 0,       // 未读
    READ = 1,         // 已读
    DELETED = 2,      // 已删除
}

// 用户类型
export enum MessageUserType {
    SYSTEM = 0,       // 系统
    BUYER = 1,        // 买手
    MERCHANT = 2,     // 商家
    ADMIN = 3,        // 管理员
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    @Index()
    senderId: string;  // 发送者ID，系统消息为空

    @Column({ type: 'int', default: MessageUserType.SYSTEM })
    senderType: MessageUserType;  // 发送者类型

    @Column()
    @Index()
    receiverId: string;  // 接收者ID

    @Column({ type: 'int' })
    receiverType: MessageUserType;  // 接收者类型

    @Column({ type: 'int', default: MessageType.SYSTEM })
    type: MessageType;  // 消息类型

    @Column({ length: 200 })
    title: string;  // 消息标题

    @Column({ type: 'text' })
    content: string;  // 消息内容

    @Column({ type: 'int', default: MessageStatus.UNREAD })
    status: MessageStatus;  // 消息状态

    @Column({ nullable: true })
    relatedId: string;  // 关联ID（订单、任务等）

    @Column({ length: 50, nullable: true })
    relatedType: string;  // 关联类型

    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;  // 阅读时间

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// 消息模板，用于快速生成系统消息
@Entity('message_templates')
export class MessageTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    code: string;  // 模板代码

    @Column({ length: 100 })
    name: string;  // 模板名称

    @Column({ length: 200 })
    title: string;  // 标题模板

    @Column({ type: 'text' })
    content: string;  // 内容模板，支持变量 {variable}

    @Column({ type: 'int', default: MessageType.SYSTEM })
    type: MessageType;  // 消息类型

    @Column({ default: true })
    isActive: boolean;  // 是否启用

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateMessageDto {
    @IsUUID()
    @IsOptional()
    senderId?: string;

    @IsEnum(MessageUserType)
    @IsOptional()
    senderType?: MessageUserType;

    @IsUUID()
    @IsNotEmpty()
    receiverId: string;

    @IsEnum(MessageUserType)
    receiverType: MessageUserType;

    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    relatedId?: string;

    @IsString()
    @IsOptional()
    relatedType?: string;
}

export class SendPrivateMessageDto {
    @IsUUID()
    @IsNotEmpty()
    receiverId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}

export class MessageFilterDto {
    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType;

    @IsEnum(MessageStatus)
    @IsOptional()
    status?: MessageStatus;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType;
}
