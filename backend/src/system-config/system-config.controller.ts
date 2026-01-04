import { Controller, Get, Put, Query, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system-config')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private configService: SystemConfigService) { }

  @Get('global')
  async getGlobalConfig() {
    const config = await this.configService.getGlobalConfig();
    return { success: true, data: config };
  }

  @Put('global')
  async updateGlobalConfig(
    @Body() dto: any,
  ) {
    const updated = await this.configService.updateGlobalConfig(dto);
    return { success: true, message: '配置已更新', data: updated };
  }
}
