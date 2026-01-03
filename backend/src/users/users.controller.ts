import { Controller, Get, Post, UseGuards, Request, Query, Body } from '@nestjs/common';
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
        // 同时获取统计数据
        const stats = await this.usersService.getProfileStats(req.user.userId);
        const balanceOverview = await this.usersService.getBalanceOverview(req.user.userId);

        return {
            success: true,
            data: {
                ...user,
                stats,
                balanceOverview
            }
        };
    }

    // 单独的统计数据端点（用于首页展示）
    @Get('stats')
    async getStats(@Request() req) {
        const stats = await this.usersService.getProfileStats(req.user.userId);
        return {
            success: true,
            data: stats
        };
    }

    // 资金概览端点
    @Get('balance')
    async getBalance(@Request() req) {
        const balance = await this.usersService.getBalanceOverview(req.user.userId);
        return {
            success: true,
            data: balance
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

    @Get('fund-records')
    async getFundRecords(
        @Request() req,
        @Query('type') type?: 'principal' | 'silver',
        @Query('action') action?: 'in' | 'out',
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string
    ) {
        const result = await this.usersService.getFundRecords(
            req.user.userId,
            type,
            action,
            parseInt(page || '1'),
            parseInt(pageSize || '20')
        );
        return {
            success: true,
            data: result
        };
    }

    // ============ 用户安全设置API (对应原版个人信息修改) ============

    // 修改登录密码
    @Post('change-password')
    async changePassword(
        @Request() req,
        @Body() body: { oldPassword: string; newPassword: string }
    ) {
        const result = await this.usersService.changePassword(
            req.user.userId,
            body.oldPassword,
            body.newPassword
        );
        return result;
    }

    // 修改支付密码
    @Post('change-pay-password')
    async changePayPassword(
        @Request() req,
        @Body() body: { newPayPassword: string; phone: string; smsCode: string }
    ) {
        const result = await this.usersService.changePayPassword(
            req.user.userId,
            body.newPayPassword,
            body.phone,
            body.smsCode
        );
        return result;
    }

    // 修改手机号
    @Post('change-phone')
    async changePhone(
        @Request() req,
        @Body() body: { oldPhone: string; payPassword: string; newPhone: string; smsCode: string }
    ) {
        const result = await this.usersService.changePhone(
            req.user.userId,
            body.oldPhone,
            body.payPassword,
            body.newPhone,
            body.smsCode
        );
        return result;
    }

    // 发送短信验证码
    @Post('send-sms')
    async sendSmsCode(
        @Body() body: { phone: string; type: 'change_phone' | 'change_password' | 'change_pay_password' }
    ) {
        const result = await this.usersService.sendSmsCode(body.phone, body.type);
        return result;
    }
}
