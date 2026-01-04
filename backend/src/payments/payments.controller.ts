import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  PaymentChannel,
  PaymentType,
  PaymentCallbackFilterDto,
} from './payment.entity';
import * as express from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ============ 支付回调接口 ============

  /**
   * 支付宝回调
   */
  @Post('callback/alipay')
  async alipayCallback(
    @Body() body: Record<string, any>,
    @Req() req: express.Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.paymentsService.handleCallback(
      PaymentChannel.ALIPAY,
      PaymentType.RECHARGE,
      body,
      ip,
    );
    // 支付宝要求返回 "success" 表示处理成功
    return result.success ? 'success' : 'fail';
  }

  /**
   * 微信支付回调
   */
  @Post('callback/wechat')
  async wechatCallback(
    @Body() body: Record<string, any>,
    @Req() req: express.Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.paymentsService.handleCallback(
      PaymentChannel.WECHAT,
      PaymentType.RECHARGE,
      body,
      ip,
    );
    // 微信要求返回 XML 格式
    if (result.success) {
      return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
    }
    return '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>';
  }

  // ============ 用户接口 ============

  /**
   * 查询支付订单
   */
  @Get('order/:orderNo')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('orderNo') orderNo: string) {
    const order = await this.paymentsService.getOrder(orderNo);
    if (!order) {
      return { success: false, message: '订单不存在' };
    }
    return { success: true, data: order };
  }

  /**
   * 获取我的支付记录
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.paymentsService.getUserOrders(
      req.user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, ...result };
  }

  // ============ 管理员接口 ============

  /**
   * 获取回调日志
   */
  @Get('admin/callbacks')
  @UseGuards(JwtAuthGuard)
  async getCallbackLogs(@Query() filter: PaymentCallbackFilterDto) {
    const result = await this.paymentsService.getCallbackLogs(filter);
    return { success: true, ...result };
  }

  /**
   * 获取支付统计
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.paymentsService.getPaymentStats();
    return { success: true, data: stats };
  }

  /**
   * 取消过期订单
   */
  @Post('admin/cancel-expired')
  @UseGuards(JwtAuthGuard)
  async cancelExpired() {
    const count = await this.paymentsService.cancelExpiredOrders();
    return { success: true, message: `已取消${count}个过期订单` };
  }
}
