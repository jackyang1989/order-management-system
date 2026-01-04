import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendSmsCodeDto, VerifySmsCodeDto } from './sms.entity';
import type { Request } from 'express';

@Controller('sms')
export class SmsController {
  constructor(private smsService: SmsService) {}

  /**
   * 发送验证码
   */
  @Post('send')
  async sendCode(@Body() dto: SendSmsCodeDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.smsService.sendCode(dto, ip);
    return result;
  }

  /**
   * 验证验证码
   */
  @Post('verify')
  async verifyCode(@Body() dto: VerifySmsCodeDto) {
    const result = await this.smsService.verifyCode(dto);
    return result;
  }

  // ============ 管理员接口 ============

  /**
   * 获取发送日志
   */
  @Get('admin/logs')
  @UseGuards(JwtAuthGuard)
  async getLogs(
    @Query('phone') phone?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.smsService.getLogs(
      phone,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, ...result };
  }

  /**
   * 获取发送统计
   */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.smsService.getStats();
    return { success: true, data: stats };
  }

  /**
   * 清理过期验证码
   */
  @Post('admin/clean-expired')
  @UseGuards(JwtAuthGuard)
  async cleanExpired() {
    const count = await this.smsService.cleanExpiredCodes();
    return { success: true, message: `已清理${count}条过期验证码` };
  }
}
