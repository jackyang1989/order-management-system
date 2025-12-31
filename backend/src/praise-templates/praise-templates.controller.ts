import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PraiseTemplatesService } from './praise-templates.service';
import { PraiseTemplate, PraiseTemplateType } from './praise-template.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('praise-templates')
@UseGuards(JwtAuthGuard)
export class PraiseTemplatesController {
    constructor(private readonly templatesService: PraiseTemplatesService) { }

    /**
     * 创建好评模板
     */
    @Post()
    async create(
        @Request() req,
        @Body() data: {
            type: PraiseTemplateType;
            name?: string;
            content?: string;
            images?: string[];
            videoUrl?: string;
            videoCover?: string;
        },
    ): Promise<PraiseTemplate> {
        return this.templatesService.create(req.user.id, data);
    }

    /**
     * 获取我的好评模板列表
     */
    @Get()
    async findAll(
        @Request() req,
        @Query('type') type?: string,
    ): Promise<PraiseTemplate[]> {
        const praiseType = type ? parseInt(type) as PraiseTemplateType : undefined;
        return this.templatesService.findAll(req.user.id, praiseType);
    }

    /**
     * 获取模板统计
     */
    @Get('stats')
    async getStats(@Request() req) {
        return this.templatesService.getStats(req.user.id);
    }

    /**
     * 获取随机模板
     */
    @Get('random')
    async getRandomTemplate(
        @Request() req,
        @Query('type') type: string,
    ): Promise<PraiseTemplate | null> {
        const praiseType = parseInt(type) as PraiseTemplateType;
        return this.templatesService.getRandomTemplate(req.user.id, praiseType);
    }

    /**
     * 获取单个模板
     */
    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Request() req,
    ): Promise<PraiseTemplate> {
        return this.templatesService.findOne(id, req.user.id);
    }

    /**
     * 更新模板
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Request() req,
        @Body() data: Partial<{
            name: string;
            content: string;
            images: string[];
            videoUrl: string;
            videoCover: string;
            sortOrder: number;
        }>,
    ): Promise<PraiseTemplate> {
        return this.templatesService.update(id, req.user.id, data);
    }

    /**
     * 删除模板
     */
    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @Request() req,
    ): Promise<{ success: boolean }> {
        await this.templatesService.remove(id, req.user.id);
        return { success: true };
    }

    /**
     * 批量导入文字模板
     */
    @Post('batch/text')
    async batchImportText(
        @Request() req,
        @Body('contents') contents: string[],
    ): Promise<{ count: number }> {
        const count = await this.templatesService.batchImportText(req.user.id, contents);
        return { count };
    }

    /**
     * 批量导入图片模板
     */
    @Post('batch/images')
    async batchImportImages(
        @Request() req,
        @Body('imageGroups') imageGroups: string[][],
    ): Promise<{ count: number }> {
        const count = await this.templatesService.batchImportImages(req.user.id, imageGroups);
        return { count };
    }
}
