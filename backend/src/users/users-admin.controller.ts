import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersAdminService } from './users-admin.service';
import { User } from './user.entity';

// ============ DTO 定义 ============

export class UserQueryDto {
    page?: number;
    limit?: number;
    keyword?: string;  // 搜索关键词（用户名、手机号）
    status?: 'active' | 'banned' | 'all';
    vip?: 'vip' | 'normal' | 'all';
    verifyStatus?: number;  // 实名状态
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export class AdjustBalanceDto {
    type: 'balance' | 'silver';  // 调整类型
    action: 'add' | 'deduct';    // 操作：充值/扣除
    amount: number;              // 金额
    reason: string;              // 原因
    remark?: string;             // 备注
}

export class BatchOperationDto {
    userIds: string[];
    action: 'ban' | 'unban' | 'activate' | 'deactivate' | 'setVip' | 'removeVip';
    reason?: string;
    vipDays?: number;  // VIP天数（用于setVip）
}

export class UserDetailUpdateDto {
    phone?: string;
    qq?: string;
    realName?: string;
    idCard?: string;
    verifyStatus?: number;
    isActive?: boolean;
    isBanned?: boolean;
    banReason?: string;
    vip?: boolean;
    vipExpireAt?: Date;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersAdminController {
    constructor(private readonly usersAdminService: UsersAdminService) { }

    /**
     * 获取用户列表（分页、筛选、搜索）
     */
    @Get()
    async findAll(@Query() query: UserQueryDto) {
        const result = await this.usersAdminService.findAll(query);
        return { success: true, ...result };
    }

    /**
     * 获取用户详情
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.usersAdminService.findOne(id);
        return { success: true, data: user };
    }

    /**
     * 获取用户统计信息
     */
    @Get(':id/stats')
    async getUserStats(@Param('id') id: string) {
        const stats = await this.usersAdminService.getUserStats(id);
        return { success: true, data: stats };
    }

    /**
     * 更新用户信息
     */
    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UserDetailUpdateDto) {
        const user = await this.usersAdminService.updateUser(id, data);
        return { success: true, data: user };
    }

    /**
     * 调整用户余额（充值/扣除）
     */
    @Post(':id/balance')
    async adjustBalance(
        @Param('id') id: string,
        @Body() dto: AdjustBalanceDto,
    ) {
        if (dto.amount <= 0) {
            throw new BadRequestException('金额必须大于0');
        }
        const result = await this.usersAdminService.adjustBalance(id, dto);
        return { success: true, data: result };
    }

    /**
     * 封禁用户
     */
    @Post(':id/ban')
    async banUser(
        @Param('id') id: string,
        @Body() body: { reason: string },
    ) {
        const user = await this.usersAdminService.banUser(id, body.reason);
        return { success: true, data: user, message: '用户已封禁' };
    }

    /**
     * 解封用户
     */
    @Post(':id/unban')
    async unbanUser(@Param('id') id: string) {
        const user = await this.usersAdminService.unbanUser(id);
        return { success: true, data: user, message: '用户已解封' };
    }

    /**
     * 设置用户VIP
     */
    @Post(':id/vip')
    async setVip(
        @Param('id') id: string,
        @Body() body: { days: number; level?: number },
    ) {
        const user = await this.usersAdminService.setVip(id, body.days, body.level);
        return { success: true, data: user, message: 'VIP已设置' };
    }

    /**
     * 取消用户VIP
     */
    @Post(':id/remove-vip')
    async removeVip(@Param('id') id: string) {
        const user = await this.usersAdminService.removeVip(id);
        return { success: true, data: user, message: 'VIP已取消' };
    }

    /**
     * 重置用户密码
     */
    @Post(':id/reset-password')
    async resetPassword(
        @Param('id') id: string,
        @Body() body: { newPassword: string },
    ) {
        await this.usersAdminService.resetPassword(id, body.newPassword);
        return { success: true, message: '密码已重置' };
    }

    /**
     * 重置用户支付密码
     */
    @Post(':id/reset-pay-password')
    async resetPayPassword(
        @Param('id') id: string,
        @Body() body: { newPayPassword: string },
    ) {
        await this.usersAdminService.resetPayPassword(id, body.newPayPassword);
        return { success: true, message: '支付密码已重置' };
    }

    /**
     * 审核实名认证
     */
    @Post(':id/verify')
    async verifyUser(
        @Param('id') id: string,
        @Body() body: { status: number; reason?: string },
    ) {
        const user = await this.usersAdminService.verifyUser(id, body.status, body.reason);
        return { success: true, data: user };
    }

    /**
     * 获取用户余额变动记录
     */
    @Get(':id/balance-logs')
    async getBalanceLogs(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('type') type?: string,
    ) {
        const result = await this.usersAdminService.getBalanceLogs(
            id,
            parseInt(page || '1', 10),
            parseInt(limit || '20', 10),
            type,
        );
        return { success: true, ...result };
    }

    /**
     * 获取用户登录日志
     */
    @Get(':id/login-logs')
    async getLoginLogs(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const result = await this.usersAdminService.getLoginLogs(
            id,
            parseInt(page || '1', 10),
            parseInt(limit || '20', 10),
        );
        return { success: true, ...result };
    }

    /**
     * 批量操作
     */
    @Post('batch')
    async batchOperation(@Body() dto: BatchOperationDto) {
        const result = await this.usersAdminService.batchOperation(dto);
        return { success: true, data: result };
    }

    /**
     * 导出用户数据
     */
    @Get('export')
    async exportUsers(@Query() query: UserQueryDto) {
        const result = await this.usersAdminService.exportUsers(query);
        return { success: true, data: result };
    }

    /**
     * 获取统计概览
     */
    @Get('stats/overview')
    async getOverviewStats() {
        const stats = await this.usersAdminService.getOverviewStats();
        return { success: true, data: stats };
    }
}
