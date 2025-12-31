import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateNoticeDto, UpdateNoticeDto, NoticeStatus, NoticeTarget } from './notice.entity';

@Controller('notices')
export class NoticesController {
    constructor(private noticesService: NoticesService) { }

    // ============ 用户端接口（无需认证或可选认证） ============

    @Get('public')
    async findPublished(
        @Query('target') target?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const targetEnum = target ? parseInt(target) as NoticeTarget : NoticeTarget.ALL;
        const result = await this.noticesService.findPublished(
            targetEnum,
            parseInt(page || '1'),
            parseInt(limit || '10')
        );
        return { success: true, ...result };
    }

    @Get('public/:id')
    async findOnePublic(@Param('id') id: string) {
        const notice = await this.noticesService.findOneForUser(id);
        if (!notice) {
            return { success: false, message: '公告不存在' };
        }
        return { success: true, data: notice };
    }

    @Get('popup')
    async findPopup(@Query('target') target?: string) {
        const targetEnum = target ? parseInt(target) as NoticeTarget : NoticeTarget.ALL;
        const notices = await this.noticesService.findPopupNotices(targetEnum);
        return { success: true, data: notices };
    }

    // ============ 用户端接口（需要认证） ============

    @Get('unread-count')
    @UseGuards(JwtAuthGuard)
    async getUnreadCount(@Request() req, @Query('target') target?: string) {
        const targetEnum = target ? parseInt(target) as NoticeTarget : NoticeTarget.BUYER;
        const userType = targetEnum === NoticeTarget.MERCHANT ? 2 : 1;
        const count = await this.noticesService.getUnreadCount(
            req.user.userId,
            userType,
            targetEnum
        );
        return { success: true, data: { count } };
    }

    @Post(':id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(
        @Param('id') id: string,
        @Request() req,
        @Query('userType') userType?: string
    ) {
        await this.noticesService.markAsRead(
            id,
            req.user.userId,
            parseInt(userType || '1')
        );
        return { success: true, message: '已标记为已读' };
    }

    @Post('read-all')
    @UseGuards(JwtAuthGuard)
    async markAllAsRead(
        @Request() req,
        @Query('target') target?: string,
        @Query('userType') userType?: string
    ) {
        const targetEnum = target ? parseInt(target) as NoticeTarget : NoticeTarget.BUYER;
        await this.noticesService.markAllAsRead(
            req.user.userId,
            parseInt(userType || '1'),
            targetEnum
        );
        return { success: true, message: '已全部标记为已读' };
    }

    // ============ 管理端接口 ============

    @Get('admin/list')
    @UseGuards(JwtAuthGuard)
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const statusEnum = status !== undefined ? parseInt(status) as NoticeStatus : undefined;
        const result = await this.noticesService.findAll(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            statusEnum
        );
        return { success: true, ...result };
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        const notice = await this.noticesService.findOne(id);
        if (!notice) {
            return { success: false, message: '公告不存在' };
        }
        return { success: true, data: notice };
    }

    @Post('admin')
    @UseGuards(JwtAuthGuard)
    async create(@Body() createDto: CreateNoticeDto, @Request() req) {
        try {
            const notice = await this.noticesService.create(
                createDto,
                req.user.userId,
                req.user.username
            );
            return {
                success: true,
                message: '公告创建成功',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Put('admin/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() updateDto: UpdateNoticeDto) {
        try {
            const notice = await this.noticesService.update(id, updateDto);
            return {
                success: true,
                message: '公告更新成功',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post('admin/:id/publish')
    @UseGuards(JwtAuthGuard)
    async publish(@Param('id') id: string) {
        try {
            const notice = await this.noticesService.publish(id);
            return {
                success: true,
                message: '公告已发布',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post('admin/:id/unpublish')
    @UseGuards(JwtAuthGuard)
    async unpublish(@Param('id') id: string) {
        try {
            const notice = await this.noticesService.unpublish(id);
            return {
                success: true,
                message: '公告已撤回',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post('admin/:id/archive')
    @UseGuards(JwtAuthGuard)
    async archive(@Param('id') id: string) {
        try {
            const notice = await this.noticesService.archive(id);
            return {
                success: true,
                message: '公告已归档',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post('admin/:id/toggle-top')
    @UseGuards(JwtAuthGuard)
    async toggleTop(@Param('id') id: string) {
        try {
            const notice = await this.noticesService.toggleTop(id);
            return {
                success: true,
                message: notice.isTop ? '已置顶' : '已取消置顶',
                data: notice
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string) {
        try {
            await this.noticesService.delete(id);
            return {
                success: true,
                message: '公告删除成功'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}
