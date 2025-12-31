import {
    Controller,
    Get,
    Post,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralReward } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    /**
     * 获取我的推荐奖励记录
     */
    @Get('rewards')
    async getMyRewards(@Request() req): Promise<ReferralReward[]> {
        return this.referralService.getUserRewards(req.user.id);
    }

    /**
     * 获取我的推荐统计
     */
    @Get('stats')
    async getMyStats(@Request() req) {
        return this.referralService.getUserReferralStats(req.user.id);
    }

    /**
     * 获取我推荐的用户列表
     */
    @Get('referred-users')
    async getReferredUsers(@Request() req): Promise<User[]> {
        return this.referralService.getReferredUsers(req.user.id);
    }

    /**
     * 获取我的邀请码
     */
    @Get('invite-code')
    async getInviteCode(@Request() req): Promise<{ code: string }> {
        const code = await this.referralService.generateInviteCode(req.user.id);
        return { code };
    }
}
