import {
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralReward, ReferralRewardType } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    /**
     * 获取我的推荐奖励记录
     * 支持分页和类型筛选
     */
    @Get('rewards')
    async getMyRewards(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: string,
    ): Promise<{
        success: boolean;
        data: {
            list: ReferralReward[];
            total: number;
            page: number;
            limit: number;
        };
    }> {
        const result = await this.referralService.getUserRewardsPaginated(
            req.user.id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
            type ? parseInt(type) : undefined,
        );
        return { success: true, data: result };
    }

    /**
     * 获取我的推荐统计
     */
    @Get('stats')
    async getMyStats(@Request() req) {
        const stats = await this.referralService.getUserReferralStats(req.user.id);
        return { success: true, data: stats };
    }

    /**
     * 获取我推荐的用户列表
     */
    @Get('referred-users')
    async getReferredUsers(@Request() req): Promise<{ success: boolean; data: User[] }> {
        const users = await this.referralService.getReferredUsers(req.user.id);
        return { success: true, data: users };
    }

    /**
     * 获取我的邀请码
     */
    @Get('invite-code')
    async getInviteCode(@Request() req): Promise<{ success: boolean; data: { code: string } }> {
        const code = await this.referralService.generateInviteCode(req.user.id);
        return { success: true, data: { code } };
    }
}
