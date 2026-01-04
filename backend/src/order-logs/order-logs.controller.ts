import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { OrderLogsService } from './order-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderLogFilterDto } from './order-log.entity';

@Controller('order-logs')
export class OrderLogsController {
  constructor(private orderLogsService: OrderLogsService) {}

  /**
   * 获取订单日志列表
   */
  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  async findByOrder(
    @Param('orderId') orderId: string,
    @Query() filter: OrderLogFilterDto,
  ) {
    const logs = await this.orderLogsService.findByOrder(orderId, filter);
    return { success: true, data: logs };
  }

  /**
   * 获取订单时间线
   */
  @Get(':orderId/timeline')
  @UseGuards(JwtAuthGuard)
  async getTimeline(@Param('orderId') orderId: string) {
    const timeline = await this.orderLogsService.getOrderTimeline(orderId);
    return { success: true, data: timeline };
  }
}
