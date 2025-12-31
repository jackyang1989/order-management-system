import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserCreditsService } from './user-credits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    AdminAdjustCreditDto,
    BlacklistUserDto,
    CreditLogFilterDto,
    CreditUserType,
} from './user-credit.entity';

@Controller('credits')
export class UserCreditsController {
    constructor(private creditsService: UserCreditsService) { }

    // ============ 用户接口 ============

    /**
     * 获取我的信用信息
     */
    @Get('my')
    @UseGuards(JwtAuthGuard)
    async getMyCredit(@Request() req) {
        const userType = req.user.role === 'merchant' ? CreditUserType.MERCHANT : CreditUserType.BUYER;
        const credit = await this.creditsService.getOrCreateCredit(req.user.userId, userType);
        return { success: true, data: credit };
    }

    /**
     * 获取我的信用记录
     */
    @Get('my/logs')
    @UseGuards(JwtAuthGuard)
    async getMyLogs(@Request() req, @Query() filter: CreditLogFilterDto) {
        const result = await this.creditsService.getUserLogs(req.user.userId, filter);
        return { success: true, ...result };
    }

    /**
     * 获取信用等级说明
     */
    @Get('levels')
    async getLevelConfigs() {
        const configs = await this.creditsService.getLevelConfigs();
        return { success: true, data: configs };
    }

    // ============ 管理员接口 ============

    /**
     * 获取用户信用信息
     */
    @Get('admin/user/:userId')
    @UseGuards(JwtAuthGuard)
    async getUserCredit(@Param('userId') userId: string) {
        const credit = await this.creditsService.getUserCredit(userId);
        return { success: true, data: credit };
    }

    /**
     * 获取用户信用记录
     */
    @Get('admin/user/:userId/logs')
    @UseGuards(JwtAuthGuard)
    async getUserLogs(@Param('userId') userId: string, @Query() filter: CreditLogFilterDto) {
        const result = await this.creditsService.getUserLogs(userId, filter);
        return { success: true, ...result };
    }

    /**
     * 管理员调整信用分
     */
    @Post('admin/user/:userId/adjust')
    @UseGuards(JwtAuthGuard)
    async adjustCredit(
        @Param('userId') userId: string,
        @Body() dto: AdminAdjustCreditDto,
        @Request() req
    ) {
        const credit = await this.creditsService.adminAdjustCredit(userId, dto, req.user.userId);
        return { success: true, message: '信用分调整成功', data: credit };
    }

    /**
     * 加入黑名单
     */
    @Post('admin/user/:userId/blacklist')
    @UseGuards(JwtAuthGuard)
    async addToBlacklist(
        @Param('userId') userId: string,
        @Body() dto: BlacklistUserDto,
        @Request() req
    ) {
        const credit = await this.creditsService.addToBlacklist(userId, dto, req.user.userId);
        return { success: true, message: '已加入黑名单', data: credit };
    }

    /**
     * 移出黑名单
     */
    @Post('admin/user/:userId/unblacklist')
    @UseGuards(JwtAuthGuard)
    async removeFromBlacklist(@Param('userId') userId: string, @Request() req) {
        const credit = await this.creditsService.removeFromBlacklist(userId, req.user.userId);
        return { success: true, message: '已移出黑名单', data: credit };
    }

    /**
     * 获取黑名单列表
     */
    @Get('admin/blacklist')
    @UseGuards(JwtAuthGuard)
    async getBlacklist(@Query('page') page?: string, @Query('limit') limit?: string) {
        const result = await this.creditsService.getBlacklistUsers(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20
        );
        return { success: true, ...result };
    }

    /**
     * 处理过期黑名单（可定时调用）
     */
    @Post('admin/process-expired')
    @UseGuards(JwtAuthGuard)
    async processExpired() {
        const count = await this.creditsService.processExpiredBlacklist();
        return { success: true, message: `已处理${count}个过期黑名单` };
    }

    /**
     * 初始化等级配置
     */
    @Post('admin/configs/init')
    @UseGuards(JwtAuthGuard)
    async initConfigs() {
        await this.creditsService.initDefaultConfigs();
        return { success: true, message: '等级配置初始化成功' };
    }
}
