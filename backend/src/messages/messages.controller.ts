import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    MessageFilterDto,
    MessageUserType,
    CreateTemplateDto,
} from './message.entity';

@Controller('messages')
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    // ============ 用户消息接口 ============

    /**
     * 获取我的消息列表
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    async findMyMessages(@Request() req, @Query() filter: MessageFilterDto) {
        // 假设用户类型从token中获取，这里简化处理
        const userType = req.user.role === 'merchant' ? MessageUserType.MERCHANT : MessageUserType.BUYER;
        const result = await this.messagesService.findUserMessages(req.user.userId, userType, filter);
        return { success: true, ...result };
    }

    /**
     * 获取消息详情
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Request() req) {
        const message = await this.messagesService.findOne(id);
        if (!message || message.receiverId !== req.user.userId) {
            return { success: false, message: '消息不存在' };
        }
        return { success: true, data: message };
    }

    /**
     * 标记消息为已读
     */
    @Put(':id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(@Param('id') id: string, @Request() req) {
        const message = await this.messagesService.markAsRead(id, req.user.userId);
        if (!message) {
            return { success: false, message: '操作失败' };
        }
        return { success: true, message: '已标记为已读' };
    }

    /**
     * 全部标记为已读
     */
    @Put('read-all')
    @UseGuards(JwtAuthGuard)
    async markAllAsRead(@Request() req) {
        const userType = req.user.role === 'merchant' ? MessageUserType.MERCHANT : MessageUserType.BUYER;
        const count = await this.messagesService.markAllAsRead(req.user.userId, userType);
        return { success: true, message: `已标记${count}条消息为已读` };
    }

    /**
     * 删除消息
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string, @Request() req) {
        const result = await this.messagesService.delete(id, req.user.userId);
        if (!result) {
            return { success: false, message: '删除失败' };
        }
        return { success: true, message: '消息已删除' };
    }

    /**
     * 批量删除消息
     */
    @Post('batch-delete')
    @UseGuards(JwtAuthGuard)
    async batchDelete(@Body() body: { ids: string[] }, @Request() req) {
        const count = await this.messagesService.batchDelete(body.ids, req.user.userId);
        return { success: true, message: `已删除${count}条消息` };
    }

    /**
     * 获取未读消息数量
     */
    @Get('unread/count')
    @UseGuards(JwtAuthGuard)
    async getUnreadCount(@Request() req) {
        const userType = req.user.role === 'merchant' ? MessageUserType.MERCHANT : MessageUserType.BUYER;
        const count = await this.messagesService.getUnreadCount(req.user.userId, userType);
        return { success: true, data: { count } };
    }

    /**
     * 获取各类型未读数量
     */
    @Get('unread/by-type')
    @UseGuards(JwtAuthGuard)
    async getUnreadCountByType(@Request() req) {
        const userType = req.user.role === 'merchant' ? MessageUserType.MERCHANT : MessageUserType.BUYER;
        const counts = await this.messagesService.getUnreadCountByType(req.user.userId, userType);
        return { success: true, data: counts };
    }

    // ============ 管理员接口 ============

    /**
     * 获取所有消息模板
     */
    @Get('admin/templates')
    @UseGuards(JwtAuthGuard)
    async findAllTemplates() {
        const templates = await this.messagesService.findAllTemplates();
        return { success: true, data: templates };
    }

    /**
     * 创建消息模板
     */
    @Post('admin/templates')
    @UseGuards(JwtAuthGuard)
    async createTemplate(@Body() createDto: CreateTemplateDto) {
        const template = await this.messagesService.createTemplate(createDto);
        return { success: true, message: '模板创建成功', data: template };
    }

    /**
     * 更新消息模板
     */
    @Put('admin/templates/:id')
    @UseGuards(JwtAuthGuard)
    async updateTemplate(@Param('id') id: string, @Body() updateDto: Partial<CreateTemplateDto>) {
        const template = await this.messagesService.updateTemplate(id, updateDto);
        if (!template) {
            return { success: false, message: '模板不存在' };
        }
        return { success: true, message: '模板更新成功', data: template };
    }

    /**
     * 删除消息模板
     */
    @Delete('admin/templates/:id')
    @UseGuards(JwtAuthGuard)
    async deleteTemplate(@Param('id') id: string) {
        const result = await this.messagesService.deleteTemplate(id);
        if (!result) {
            return { success: false, message: '删除失败' };
        }
        return { success: true, message: '模板已删除' };
    }

    /**
     * 初始化默认模板
     */
    @Post('admin/templates/init')
    @UseGuards(JwtAuthGuard)
    async initTemplates() {
        await this.messagesService.initDefaultTemplates();
        return { success: true, message: '默认模板初始化成功' };
    }
}
