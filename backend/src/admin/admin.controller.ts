import { Controller, Get, Put, Query, Param, Body, UseGuards, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MerchantStatus } from '../merchants/merchant.entity';
import { WithdrawalStatus } from '../withdrawals/withdrawal.entity';

// TODO: 添加 AdminGuard 验证管理员权限
import { ShopsService } from '../shops/shops.service';
import { ShopStatus } from '../shops/shop.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard) // TODO: Add AdminGuard
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly shopsService: ShopsService
    ) { }

    // ============ 仪表盘 ============
    @Get('stats')
    async getStats() {
        const stats = await this.adminService.getStats();
        return { success: true, data: stats };
    }

    // ============ 用户管理 ============
    @Get('users')
    async getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string
    ) {
        const result = await this.adminService.getUsers(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            search
        );
        return { success: true, ...result };
    }

    @Put('users/:id/status')
    async updateUserStatus(
        @Param('id') id: string,
        @Body('active') active: boolean
    ) {
        const user = await this.adminService.updateUserStatus(id, active);
        if (!user) {
            return { success: false, message: '用户不存在' };
        }
        return { success: true, message: '状态更新成功', data: user };
    }

    // ============ 商家管理 ============
    @Get('merchants')
    async getMerchants(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const statusEnum = status !== undefined ? parseInt(status) as MerchantStatus : undefined;
        const result = await this.adminService.getMerchants(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            statusEnum
        );
        return { success: true, ...result };
    }

    @Put('merchants/:id/approve')
    async approveMerchant(
        @Param('id') id: string,
        @Body('approved') approved: boolean
    ) {
        const merchant = await this.adminService.approveMerchant(id, approved);
        if (!merchant) {
            return { success: false, message: '商家不存在' };
        }
        return {
            success: true,
            message: approved ? '商家审核通过' : '商家已拒绝',
            data: merchant
        };
    }

    // ============ 任务管理 ============
    @Get('tasks')
    async getTasks(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const statusNum = status !== undefined ? parseInt(status) : undefined;
        const result = await this.adminService.getTasks(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            statusNum
        );
        return { success: true, ...result };
    }

    @Put('tasks/:id/status')
    async updateTaskStatus(
        @Param('id') id: string,
        @Body('status') status: number
    ) {
        const task = await this.adminService.updateTaskStatus(id, status);
        if (!task) {
            return { success: false, message: '任务不存在' };
        }
        return { success: true, message: '状态更新成功', data: task };
    }

    // ============ 提现审核 ============
    @Get('withdrawals')
    async getWithdrawals(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const statusEnum = status !== undefined ? status as unknown as WithdrawalStatus : undefined;
        const result = await this.adminService.getWithdrawals(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            statusEnum
        );
        return { success: true, ...result };
    }

    @Put('withdrawals/:id/approve')
    async approveWithdrawal(
        @Param('id') id: string,
        @Body() body: { approved: boolean; remark?: string }
    ) {
        const withdrawal = await this.adminService.approveWithdrawal(id, body.approved, body.remark);
        if (!withdrawal) {
            return { success: false, message: '提现记录不存在' };
        }
        return {
            success: true,
            message: body.approved ? '提现已通过' : '提现已拒绝',
            data: withdrawal
        };
    }

    // ============ 店铺管理 ============
    @Get('shops')
    async getShops(@Query() query: any) {
        return this.shopsService.findAll(query);
    }

    @Post('shops/:id/review')
    async reviewShop(@Param('id') id: string, @Body() body: { status: ShopStatus, remark?: string }) {
        return this.shopsService.review(id, body.status, body.remark);
    }
}
