import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('buyer-accounts')
    async getBuyerAccounts(@Request() req) {
        // 这个端点已被 /buyer-accounts 替代，保留兼容性
        return {
            success: true,
            data: []
        };
    }

    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findOne(req.user.userId);
        return {
            success: true,
            data: user
        };
    }

    @Get('invite/stats')
    async getInviteStats(@Request() req) {
        const stats = await this.usersService.getInviteStats(req.user.userId);
        return {
            success: true,
            data: stats
        };
    }

    @Get('invite/records')
    async getInviteRecords(@Request() req) {
        const records = await this.usersService.getInviteRecords(req.user.userId);
        return {
            success: true,
            data: records
        };
    }
}
