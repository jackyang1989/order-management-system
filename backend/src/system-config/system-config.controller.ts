import { Controller, Get, Put, Query, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system-config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
    constructor(private configService: SystemConfigService) { }

    @Get()
    async getConfigs(@Query('group') group?: string) {
        const configs = await this.configService.findAll(group);
        return { success: true, data: configs };
    }

    @Put()
    async updateConfigs(@Body('configs') configs: { key: string; value: string; group?: string }[]) {
        const updated = await this.configService.updateMany(configs);
        return { success: true, message: '配置已更新', data: updated };
    }
}
