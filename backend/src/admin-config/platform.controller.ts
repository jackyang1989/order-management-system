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
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { Platform } from './platform.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/platforms')
@UseGuards(JwtAuthGuard)
export class PlatformController {
    constructor(private readonly platformService: PlatformService) { }

    /**
     * 获取所有平台
     */
    @Get()
    async findAll(@Query('activeOnly') activeOnly?: string) {
        const platforms = await this.platformService.findAll(activeOnly !== 'false');
        return {
            success: true,
            data: platforms,
        };
    }

    /**
     * 创建平台
     */
    @Post()
    async create(@Body() data: Partial<Platform>) {
        const platform = await this.platformService.create(data);
        return {
            success: true,
            message: '平台已创建',
            data: platform,
        };
    }

    /**
     * 更新平台
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: Partial<Platform>,
    ) {
        const platform = await this.platformService.update(id, data);
        return {
            success: true,
            message: '平台已更新',
            data: platform,
        };
    }

    /**
     * 启用/禁用平台
     */
    @Put(':id/toggle')
    async toggle(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        const platform = await this.platformService.toggleActive(id, isActive);
        return {
            success: true,
            message: isActive ? '平台已启用' : '平台已禁用',
            data: platform,
        };
    }

    /**
     * 删除平台
     */
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.platformService.delete(id);
        return {
            success: true,
            message: '平台已删除',
        };
    }
}
