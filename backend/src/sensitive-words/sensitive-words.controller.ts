import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SensitiveWordsService } from './sensitive-words.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    CreateSensitiveWordDto,
    BatchImportDto,
    CheckTextDto,
    SensitiveWordFilterDto,
} from './sensitive-word.entity';
import { Request } from 'express';

@Controller('sensitive-words')
export class SensitiveWordsController {
    constructor(private sensitiveWordsService: SensitiveWordsService) { }

    // ============ 公共接口 ============

    /**
     * 检测文本
     */
    @Post('check')
    async checkText(@Body() dto: CheckTextDto, @Req() req: Request) {
        const ip = req.ip || req.socket.remoteAddress;
        const result = await this.sensitiveWordsService.checkText(dto, ip);
        return { success: true, data: result };
    }

    /**
     * 过滤文本（替换敏感词）
     */
    @Post('filter')
    async filterText(@Body() body: { text: string }) {
        const filtered = this.sensitiveWordsService.filterText(body.text);
        return { success: true, data: { filtered } };
    }

    // ============ 管理员接口 ============

    /**
     * 获取敏感词列表
     */
    @Get('admin/list')
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() filter: SensitiveWordFilterDto) {
        const result = await this.sensitiveWordsService.findAll(filter);
        return { success: true, ...result };
    }

    /**
     * 获取敏感词详情
     */
    @Get('admin/:id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        const word = await this.sensitiveWordsService.findOne(id);
        if (!word) {
            return { success: false, message: '敏感词不存在' };
        }
        return { success: true, data: word };
    }

    /**
     * 添加敏感词
     */
    @Post('admin')
    @UseGuards(JwtAuthGuard)
    async create(@Body() dto: CreateSensitiveWordDto) {
        const word = await this.sensitiveWordsService.createWord(dto);
        return { success: true, message: '添加成功', data: word };
    }

    /**
     * 批量导入
     */
    @Post('admin/batch-import')
    @UseGuards(JwtAuthGuard)
    async batchImport(@Body() dto: BatchImportDto) {
        const result = await this.sensitiveWordsService.batchImport(dto);
        return {
            success: true,
            message: `导入完成：成功${result.imported}个，跳过${result.skipped}个`,
            data: result
        };
    }

    /**
     * 更新敏感词
     */
    @Put('admin/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() dto: Partial<CreateSensitiveWordDto>) {
        const word = await this.sensitiveWordsService.updateWord(id, dto);
        if (!word) {
            return { success: false, message: '敏感词不存在' };
        }
        return { success: true, message: '更新成功', data: word };
    }

    /**
     * 删除敏感词
     */
    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string) {
        const result = await this.sensitiveWordsService.deleteWord(id);
        if (!result) {
            return { success: false, message: '删除失败' };
        }
        return { success: true, message: '删除成功' };
    }

    /**
     * 切换启用状态
     */
    @Post('admin/:id/toggle')
    @UseGuards(JwtAuthGuard)
    async toggleActive(@Param('id') id: string) {
        const word = await this.sensitiveWordsService.toggleActive(id);
        if (!word) {
            return { success: false, message: '操作失败' };
        }
        return { success: true, message: word.isActive ? '已启用' : '已禁用', data: word };
    }

    /**
     * 刷新缓存
     */
    @Post('admin/refresh-cache')
    @UseGuards(JwtAuthGuard)
    async refreshCache() {
        await this.sensitiveWordsService.refreshCache();
        return { success: true, message: '缓存已刷新' };
    }

    /**
     * 获取检测日志
     */
    @Get('admin/logs')
    @UseGuards(JwtAuthGuard)
    async getLogs(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('scene') scene?: string
    ) {
        const result = await this.sensitiveWordsService.getLogs(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            scene
        );
        return { success: true, ...result };
    }

    /**
     * 获取统计数据
     */
    @Get('admin/stats')
    @UseGuards(JwtAuthGuard)
    async getStats() {
        const stats = await this.sensitiveWordsService.getStats();
        return { success: true, data: stats };
    }

    /**
     * 初始化默认敏感词
     */
    @Post('admin/init')
    @UseGuards(JwtAuthGuard)
    async initDefaults() {
        await this.sensitiveWordsService.initDefaultWords();
        return { success: true, message: '默认敏感词初始化成功' };
    }
}
