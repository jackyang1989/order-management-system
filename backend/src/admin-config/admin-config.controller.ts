import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminConfigService } from './admin-config.service';
import { SystemConfig } from './config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/config')
@UseGuards(JwtAuthGuard)
export class AdminConfigController {
    constructor(private readonly configService: AdminConfigService) { }

    /**
     * 获取所有配置（按分组）
     */
    @Get()
    async getAllConfigs() {
        const configs = await this.configService.getAllConfigs();
        const groups = this.configService.getGroupsMeta();
        return {
            success: true,
            data: { configs, groups },
        };
    }

    /**
     * 获取指定分组的配置
     */
    @Get('group/:group')
    async getConfigsByGroup(@Param('group') group: string) {
        const configs = await this.configService.getConfigsByGroup(group);
        return {
            success: true,
            data: configs,
        };
    }

    /**
     * 获取分组列表
     */
    @Get('groups')
    async getGroups() {
        return {
            success: true,
            data: this.configService.getGroupsMeta(),
        };
    }

    /**
     * 批量更新配置
     */
    @Put()
    async updateConfigs(
        @Body('configs') configs: { key: string; value: string }[],
    ) {
        const updated = await this.configService.updateConfigs(configs);
        return {
            success: true,
            message: '配置已更新',
            data: updated,
        };
    }

    /**
     * 更新单个配置
     */
    @Put(':key')
    async updateConfig(
        @Param('key') key: string,
        @Body('value') value: string,
    ) {
        const updated = await this.configService.updateConfig(key, value);
        return {
            success: true,
            message: '配置已更新',
            data: updated,
        };
    }

    /**
     * 创建新配置项
     */
    @Post()
    async createConfig(
        @Body() data: Partial<SystemConfig>,
    ) {
        const config = await this.configService.createConfig(data);
        return {
            success: true,
            message: '配置项已创建',
            data: config,
        };
    }

    /**
     * 删除配置项
     */
    @Delete(':key')
    async deleteConfig(@Param('key') key: string) {
        await this.configService.deleteConfig(key);
        return {
            success: true,
            message: '配置项已删除',
        };
    }

    /**
     * 刷新配置缓存
     */
    @Post('refresh-cache')
    async refreshCache() {
        await this.configService.refreshCache();
        return {
            success: true,
            message: '配置缓存已刷新',
        };
    }
}
