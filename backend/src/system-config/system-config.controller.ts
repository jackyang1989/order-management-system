import { Controller, Get, Put, Query, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system-config')
export class SystemConfigController {
  constructor(private configService: SystemConfigService) { }

  /**
   * 公开配置接口 - 返回前端需要显示的非敏感配置
   * 无需登录即可访问
   */
  @Get('public')
  async getPublicConfig() {
    const config = await this.configService.getGlobalConfig();
    // 只返回非敏感的公开配置
    return {
      success: true,
      data: {
        // VIP价格
        userVip: config.userVip,
        sellerVip: config.sellerVip,
        // 提现配置
        userMinMoney: config.userMinMoney,
        sellerMinMoney: config.sellerMinMoney,
        userMinReward: config.userMinReward,
        rewardPrice: config.rewardPrice,
        sellerCashFee: config.sellerCashFee,
        userCashFree: config.userCashFree,
        userFeeMaxPrice: config.userFeeMaxPrice,
        // 服务费用
        postage: config.postage,
        praise: config.praise,
        imgPraise: config.imgPraise,
        videoPraise: config.videoPraise,
        // 邀请配置
        invitationNum: config.invitationNum,
        inviteRewardAmount: config.inviteRewardAmount,
        inviteMaxOrders: config.inviteMaxOrders,
        inviteExpiryDays: config.inviteExpiryDays,
        // 注册赠送
        userNum: config.userNum,
        sellerNum: config.sellerNum,
        userVipTime: config.userVipTime,
        sellerVipTime: config.sellerVipTime,
        // 买号星级配置
        starThresholds: config.starThresholds,
        starPriceLimits: config.starPriceLimits,
        firstAccountVipDays: config.firstAccountVipDays,
      },
    };
  }

  @Get('global')
  @UseGuards(JwtAuthGuard)
  async getGlobalConfig() {
    const config = await this.configService.getGlobalConfig();
    return { success: true, data: config };
  }

  @Put('global')
  @UseGuards(JwtAuthGuard)
  async updateGlobalConfig(
    @Body() dto: any,
  ) {
    const updated = await this.configService.updateGlobalConfig(dto);
    return { success: true, message: '配置已更新', data: updated };
  }
}
