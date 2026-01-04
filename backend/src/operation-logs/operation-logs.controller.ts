import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { QueryOperationLogDto } from './operation-log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  /**
   * 获取操作日志列表
   */
  @Get()
  async findAll(@Query() query: QueryOperationLogDto) {
    const { list, total } = await this.operationLogsService.findAll(query);
    return {
      success: true,
      data: {
        list,
        total,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
      },
    };
  }

  /**
   * 获取日志详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const log = await this.operationLogsService.findOne(id);
    if (!log) {
      return {
        success: false,
        message: '日志不存在',
      };
    }
    return {
      success: true,
      data: log,
    };
  }

  /**
   * 获取可用模块列表
   */
  @Get('meta/modules')
  async getModules() {
    const modules = await this.operationLogsService.getModules();
    return {
      success: true,
      data: modules,
    };
  }

  /**
   * 获取统计信息
   */
  @Get('meta/stats')
  async getStats() {
    const stats = await this.operationLogsService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 清理旧日志
   */
  @Delete('cleanup/:days')
  async cleanup(@Param('days') days: string) {
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return {
        success: false,
        message: '天数参数无效',
      };
    }

    const count = await this.operationLogsService.cleanup(daysNum);
    return {
      success: true,
      message: `已清理 ${count} 条日志`,
      data: { deletedCount: count },
    };
  }

  /**
   * 导出日志
   */
  @Post('export')
  async exportLogs(@Body() query: QueryOperationLogDto) {
    // 获取所有匹配的日志
    const { list } = await this.operationLogsService.findAll({
      ...query,
      page: 1,
      pageSize: 10000, // 最多导出1万条
    });

    return {
      success: true,
      data: list,
      message: `共导出 ${list.length} 条日志`,
    };
  }
}
