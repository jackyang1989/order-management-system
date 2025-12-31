import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
    Message,
    MessageTemplate,
    CreateMessageDto,
    MessageFilterDto,
    MessageType,
    MessageStatus,
    MessageUserType,
    CreateTemplateDto,
} from './message.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messageRepository: Repository<Message>,
        @InjectRepository(MessageTemplate)
        private templateRepository: Repository<MessageTemplate>,
    ) { }

    // ============ 消息管理 ============

    /**
     * 创建消息
     */
    async create(dto: CreateMessageDto): Promise<Message> {
        const message = this.messageRepository.create(dto);
        return this.messageRepository.save(message);
    }

    /**
     * 发送系统消息
     */
    async sendSystemMessage(
        receiverId: string,
        receiverType: MessageUserType,
        title: string,
        content: string,
        type: MessageType = MessageType.SYSTEM,
        relatedId?: string,
        relatedType?: string
    ): Promise<Message> {
        return this.create({
            senderType: MessageUserType.SYSTEM,
            receiverId,
            receiverType,
            type,
            title,
            content,
            relatedId,
            relatedType,
        });
    }

    /**
     * 发送订单相关消息
     */
    async sendOrderMessage(
        receiverId: string,
        receiverType: MessageUserType,
        orderId: string,
        title: string,
        content: string
    ): Promise<Message> {
        return this.sendSystemMessage(
            receiverId,
            receiverType,
            title,
            content,
            MessageType.ORDER,
            orderId,
            'order'
        );
    }

    /**
     * 发送任务相关消息
     */
    async sendTaskMessage(
        receiverId: string,
        receiverType: MessageUserType,
        taskId: string,
        title: string,
        content: string
    ): Promise<Message> {
        return this.sendSystemMessage(
            receiverId,
            receiverType,
            title,
            content,
            MessageType.TASK,
            taskId,
            'task'
        );
    }

    /**
     * 发送财务相关消息
     */
    async sendFinanceMessage(
        receiverId: string,
        receiverType: MessageUserType,
        title: string,
        content: string,
        relatedId?: string
    ): Promise<Message> {
        return this.sendSystemMessage(
            receiverId,
            receiverType,
            title,
            content,
            MessageType.FINANCE,
            relatedId,
            'finance'
        );
    }

    /**
     * 发送审核相关消息
     */
    async sendReviewMessage(
        receiverId: string,
        receiverType: MessageUserType,
        title: string,
        content: string,
        relatedId?: string,
        relatedType?: string
    ): Promise<Message> {
        return this.sendSystemMessage(
            receiverId,
            receiverType,
            title,
            content,
            MessageType.REVIEW,
            relatedId,
            relatedType
        );
    }

    /**
     * 批量发送消息（如公告）
     */
    async sendBulkMessage(
        receiverIds: string[],
        receiverType: MessageUserType,
        title: string,
        content: string,
        type: MessageType = MessageType.NOTICE
    ): Promise<void> {
        const messages = receiverIds.map(receiverId => this.messageRepository.create({
            senderType: MessageUserType.SYSTEM,
            receiverId,
            receiverType,
            type,
            title,
            content,
        }));
        await this.messageRepository.save(messages);
    }

    /**
     * 获取用户消息列表
     */
    async findUserMessages(
        userId: string,
        userType: MessageUserType,
        filter?: MessageFilterDto
    ): Promise<{
        data: Message[];
        total: number;
        unreadCount: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.messageRepository.createQueryBuilder('m')
            .where('m.receiverId = :userId', { userId })
            .andWhere('m.receiverType = :userType', { userType })
            .andWhere('m.status != :deleted', { deleted: MessageStatus.DELETED });

        if (filter?.type !== undefined) {
            queryBuilder.andWhere('m.type = :type', { type: filter.type });
        }
        if (filter?.status !== undefined) {
            queryBuilder.andWhere('m.status = :status', { status: filter.status });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('m.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        // 获取未读数量
        const unreadCount = await this.messageRepository.count({
            where: {
                receiverId: userId,
                receiverType: userType,
                status: MessageStatus.UNREAD,
            }
        });

        return { data, total, unreadCount };
    }

    /**
     * 获取消息详情
     */
    async findOne(id: string): Promise<Message | null> {
        return this.messageRepository.findOne({ where: { id } });
    }

    /**
     * 标记消息为已读
     */
    async markAsRead(id: string, userId: string): Promise<Message | null> {
        const message = await this.findOne(id);
        if (!message || message.receiverId !== userId) {
            return null;
        }

        message.status = MessageStatus.READ;
        message.readAt = new Date();
        return this.messageRepository.save(message);
    }

    /**
     * 批量标记为已读
     */
    async markAllAsRead(userId: string, userType: MessageUserType): Promise<number> {
        const result = await this.messageRepository.update(
            {
                receiverId: userId,
                receiverType: userType,
                status: MessageStatus.UNREAD,
            },
            {
                status: MessageStatus.READ,
                readAt: new Date(),
            }
        );
        return result.affected || 0;
    }

    /**
     * 删除消息（软删除）
     */
    async delete(id: string, userId: string): Promise<boolean> {
        const message = await this.findOne(id);
        if (!message || message.receiverId !== userId) {
            return false;
        }

        message.status = MessageStatus.DELETED;
        await this.messageRepository.save(message);
        return true;
    }

    /**
     * 批量删除消息
     */
    async batchDelete(ids: string[], userId: string): Promise<number> {
        const result = await this.messageRepository.update(
            {
                id: In(ids),
                receiverId: userId,
            },
            { status: MessageStatus.DELETED }
        );
        return result.affected || 0;
    }

    /**
     * 获取未读消息数量
     */
    async getUnreadCount(userId: string, userType: MessageUserType): Promise<number> {
        return this.messageRepository.count({
            where: {
                receiverId: userId,
                receiverType: userType,
                status: MessageStatus.UNREAD,
            }
        });
    }

    /**
     * 获取各类型未读数量
     */
    async getUnreadCountByType(userId: string, userType: MessageUserType): Promise<Record<MessageType, number>> {
        const result = await this.messageRepository
            .createQueryBuilder('m')
            .select('m.type', 'type')
            .addSelect('COUNT(*)', 'count')
            .where('m.receiverId = :userId', { userId })
            .andWhere('m.receiverType = :userType', { userType })
            .andWhere('m.status = :status', { status: MessageStatus.UNREAD })
            .groupBy('m.type')
            .getRawMany();

        const counts: Record<number, number> = {};
        for (const type of Object.values(MessageType).filter(v => typeof v === 'number')) {
            counts[type as number] = 0;
        }
        for (const row of result) {
            counts[row.type] = parseInt(row.count, 10);
        }
        return counts as Record<MessageType, number>;
    }

    // ============ 消息模板管理 ============

    /**
     * 创建消息模板
     */
    async createTemplate(dto: CreateTemplateDto): Promise<MessageTemplate> {
        const template = this.templateRepository.create(dto);
        return this.templateRepository.save(template);
    }

    /**
     * 获取所有模板
     */
    async findAllTemplates(): Promise<MessageTemplate[]> {
        return this.templateRepository.find({ order: { createdAt: 'ASC' } });
    }

    /**
     * 根据代码获取模板
     */
    async findTemplateByCode(code: string): Promise<MessageTemplate | null> {
        return this.templateRepository.findOne({ where: { code, isActive: true } });
    }

    /**
     * 使用模板发送消息
     */
    async sendByTemplate(
        templateCode: string,
        receiverId: string,
        receiverType: MessageUserType,
        variables: Record<string, string>,
        relatedId?: string,
        relatedType?: string
    ): Promise<Message | null> {
        const template = await this.findTemplateByCode(templateCode);
        if (!template) {
            return null;
        }

        // 替换变量
        let title = template.title;
        let content = template.content;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            title = title.replace(regex, value);
            content = content.replace(regex, value);
        }

        return this.create({
            senderType: MessageUserType.SYSTEM,
            receiverId,
            receiverType,
            type: template.type,
            title,
            content,
            relatedId,
            relatedType,
        });
    }

    /**
     * 更新模板
     */
    async updateTemplate(id: string, dto: Partial<CreateTemplateDto>): Promise<MessageTemplate | null> {
        const template = await this.templateRepository.findOne({ where: { id } });
        if (!template) {
            return null;
        }
        Object.assign(template, dto);
        return this.templateRepository.save(template);
    }

    /**
     * 删除模板
     */
    async deleteTemplate(id: string): Promise<boolean> {
        const result = await this.templateRepository.delete(id);
        return (result.affected || 0) > 0;
    }

    /**
     * 初始化默认消息模板
     */
    async initDefaultTemplates(): Promise<void> {
        const templates = [
            {
                code: 'ORDER_CREATED',
                name: '订单创建通知',
                title: '订单创建成功',
                content: '您的订单 {orderNo} 已创建成功，请尽快完成任务。',
                type: MessageType.ORDER,
            },
            {
                code: 'ORDER_COMPLETED',
                name: '订单完成通知',
                title: '订单已完成',
                content: '订单 {orderNo} 已完成，佣金 {commission} 元已发放至您的账户。',
                type: MessageType.ORDER,
            },
            {
                code: 'WITHDRAWAL_APPROVED',
                name: '提现审核通过',
                title: '提现申请已通过',
                content: '您的提现申请（{amount}元）已审核通过，预计1-3个工作日到账。',
                type: MessageType.FINANCE,
            },
            {
                code: 'WITHDRAWAL_REJECTED',
                name: '提现审核拒绝',
                title: '提现申请被拒绝',
                content: '您的提现申请（{amount}元）已被拒绝，原因：{reason}',
                type: MessageType.FINANCE,
            },
            {
                code: 'ACCOUNT_REVIEWED',
                name: '账号审核通知',
                title: '账号审核结果',
                content: '您的账号 {accountName} 审核{result}。{remark}',
                type: MessageType.REVIEW,
            },
            {
                code: 'TASK_PUBLISHED',
                name: '新任务发布',
                title: '有新任务发布',
                content: '新任务已发布：{taskTitle}，商品价格 {price} 元，佣金 {commission} 元。',
                type: MessageType.TASK,
            },
        ];

        for (const tpl of templates) {
            const exists = await this.templateRepository.findOne({ where: { code: tpl.code } });
            if (!exists) {
                await this.templateRepository.save(this.templateRepository.create(tpl));
            }
        }
    }
}
