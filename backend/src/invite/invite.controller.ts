import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { InviteService, InviteRecordFilter } from './invite.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 邀请/推荐控制器
 * 对齐旧版 PHP: Invite::record(), Recommend::getCTask()
 */
@Controller('invite')
@UseGuards(JwtAuthGuard)
export class InviteController {
  constructor(private readonly inviteService: InviteService) { }

  /**
   * 获取邀请配置
   */
  @Get('config')
  async getConfig() {
    const config = await this.inviteService.getInviteConfig();
    return { success: true, data: config };
  }

  /**
   * 检查是否可以邀请商家
   */
  @Get('merchant-eligibility')
  async checkMerchantEligibility(@Request() req) {
    const result = await this.inviteService.canInviteMerchant(req.user.userId);
    return { success: true, data: result };
  }

  /**
   * 获取邀请记录
   * 对齐旧版: Invite::record()
   * 支持日期筛选
   */
  @Get('record')
  async record(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
  ) {
    const filter: InviteRecordFilter = {};
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (keyword) filter.keyword = keyword;

    const result = await this.inviteService.record(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 15,
      filter,
    );
    return { success: true, data: result };
  }

  /**
   * 获取推荐任务（被邀请用户完成的任务）
   * 对齐旧版: Recommend::getCTask()
   */
  @Get('tasks')
  async tasks(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.inviteService.recommendedTasks(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 15,
    );
    return { success: true, data: result };
  }
}
