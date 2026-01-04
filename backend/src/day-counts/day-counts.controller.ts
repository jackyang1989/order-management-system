import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DayCountsService } from './day-counts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DayCountFilterDto } from './day-count.entity';

@Controller('stats')
export class DayCountsController {
  constructor(private dayCountsService: DayCountsService) {}

  // ============ 用户接口 ============

  /**
   * 获取我的统计数据
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Request() req, @Query() filter: DayCountFilterDto) {
    const result = await this.dayCountsService.getUserStats(
      req.user.userId,
      filter,
    );
    return { success: true, ...result };
  }

  // ============ 管理员接口 ============

  /**
   * 获取今日概览
   */
  @Get('admin/today')
  @UseGuards(JwtAuthGuard)
  async getTodayOverview() {
    const data = await this.dayCountsService.getTodayOverview();
    return { success: true, data };
  }

  /**
   * 获取平台统计
   */
  @Get('admin/platform')
  @UseGuards(JwtAuthGuard)
  async getPlatformStats(@Query() filter: DayCountFilterDto) {
    const result = await this.dayCountsService.getPlatformStats(filter);
    return { success: true, ...result };
  }

  /**
   * 获取趋势数据
   */
  @Get('admin/trend')
  @UseGuards(JwtAuthGuard)
  async getTrend(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const data = await this.dayCountsService.getTrend(daysNum);
    return { success: true, data };
  }

  /**
   * 获取指定用户统计
   */
  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserStats(
    @Query('userId') userId: string,
    @Query() filter: DayCountFilterDto,
  ) {
    const result = await this.dayCountsService.getUserStats(userId, filter);
    return { success: true, ...result };
  }
}
