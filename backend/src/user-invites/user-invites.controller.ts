import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UserInvitesService } from './user-invites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InviteFilterDto, InviteType, UpdateRewardConfigDto } from './user-invite.entity';

@Controller('invites')
export class UserInvitesController {
    constructor(private invitesService: UserInvitesService) { }

    // ============ 用户接口 ============

    /**
     * 获取我的邀请码
     */
    @Get('my-code')
    @UseGuards(JwtAuthGuard)
    async getMyInviteCode(@Request() req) {
        const userType = req.user.role === 'merchant' ? InviteType.MERCHANT : InviteType.BUYER;
        let code = await this.invitesService.getUserInviteCode(req.user.userId, userType);

        if (!code) {
            // 自动生成邀请码
            code = await this.invitesService.generateInviteCode(req.user.userId, userType);
        }

        return { success: true, data: code };
    }

    /**
     * 获取我的邀请记录
     */
    @Get('my-invites')
    @UseGuards(JwtAuthGuard)
    async getMyInvites(@Request() req, @Query() filter: InviteFilterDto) {
        const result = await this.invitesService.findUserInvites(req.user.userId, filter);
        return { success: true, ...result };
    }

    /**
     * 验证邀请码
     */
    @Get('validate/:code')
    async validateCode(@Param('code') code: string) {
        const inviteCode = await this.invitesService.validateInviteCode(code);
        if (!inviteCode) {
            return { success: false, message: '邀请码无效或已过期' };
        }
        return { success: true, message: '邀请码有效', data: { valid: true } };
    }

    /**
     * 获取我被谁邀请的信息
     */
    @Get('my-inviter')
    @UseGuards(JwtAuthGuard)
    async getMyInviter(@Request() req) {
        const invite = await this.invitesService.getInviteByInvitee(req.user.userId);
        if (!invite) {
            return { success: true, data: null, message: '您不是通过邀请注册的' };
        }
        return { success: true, data: invite };
    }

    /**
     * 获取奖励配置（供前端展示）
     */
    @Get('reward-config')
    async getRewardConfig(@Query('type') type: string) {
        const inviteType = type === 'merchant' ? InviteType.MERCHANT : InviteType.BUYER;
        const config = await this.invitesService.getRewardConfig(inviteType);
        return { success: true, data: config };
    }

    // ============ 管理员接口 ============

    /**
     * 获取所有邀请记录
     */
    @Get('admin/list')
    @UseGuards(JwtAuthGuard)
    async getAllInvites(@Query() filter: InviteFilterDto) {
        const result = await this.invitesService.findAllInvites(filter);
        return { success: true, ...result };
    }

    /**
     * 获取邀请统计
     */
    @Get('admin/stats')
    @UseGuards(JwtAuthGuard)
    async getStats() {
        const stats = await this.invitesService.getInviteStats();
        return { success: true, data: stats };
    }

    /**
     * 手动发放奖励
     */
    @Post('admin/:id/reward')
    @UseGuards(JwtAuthGuard)
    async processReward(@Param('id') id: string) {
        const result = await this.invitesService.adminProcessReward(id);
        if (!result) {
            return { success: false, message: '发放失败，邀请记录不存在或状态不正确' };
        }
        return { success: true, message: '奖励发放成功' };
    }

    /**
     * 获取所有奖励配置
     */
    @Get('admin/configs')
    @UseGuards(JwtAuthGuard)
    async getAllConfigs() {
        const configs = await this.invitesService.getAllRewardConfigs();
        return { success: true, data: configs };
    }

    /**
     * 更新奖励配置
     */
    @Put('admin/configs/:type')
    @UseGuards(JwtAuthGuard)
    async updateConfig(
        @Param('type') type: string,
        @Body() dto: UpdateRewardConfigDto
    ) {
        const inviteType = type === 'merchant' ? InviteType.MERCHANT : InviteType.BUYER;
        const config = await this.invitesService.updateRewardConfig(inviteType, dto);
        return { success: true, message: '配置更新成功', data: config };
    }

    /**
     * 初始化默认配置
     */
    @Post('admin/configs/init')
    @UseGuards(JwtAuthGuard)
    async initConfigs() {
        await this.invitesService.initDefaultConfigs();
        return { success: true, message: '默认配置初始化成功' };
    }
}
