import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import {
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
} from './system-config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('admin/system-config')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  async getConfig(): Promise<{
    success: boolean;
    data: SystemConfigResponseDto;
  }> {
    const config = await this.systemConfigService.getConfig();
    return {
      success: true,
      data: config,
    };
  }

  @Put()
  async updateConfig(
    @Body() dto: UpdateSystemConfigDto,
  ): Promise<{
    success: boolean;
    message: string;
    data: SystemConfigResponseDto;
  }> {
    const config = await this.systemConfigService.updateConfig(dto);
    return {
      success: true,
      message: '配置更新成功',
      data: config,
    };
  }
}
