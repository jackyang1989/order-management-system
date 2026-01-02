import { Controller, Get, Put, Query, Param, Body, UseGuards, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';
import { MerchantStatus } from '../merchants/merchant.entity';
import { WithdrawalStatus } from '../withdrawals/withdrawal.entity';
import { ShopsService } from '../shops/shops.service';
import { ShopStatus } from '../shops/shop.entity';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus } from '../buyer-accounts/buyer-account.entity';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly shopsService: ShopsService,
        private readonly buyerAccountsService: BuyerAccountsService
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

    // ============ 买号审核 ============
    @Get('buyer-accounts')
    async getBuyerAccounts(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const statusEnum = status !== undefined ? parseInt(status) as BuyerAccountStatus : undefined;
        const result = await this.buyerAccountsService.getAllAccounts(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            statusEnum
        );
        return { success: true, ...result };
    }

    @Get('buyer-accounts/pending')
    async getPendingBuyerAccounts(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const result = await this.buyerAccountsService.getPendingAccounts(
            parseInt(page || '1'),
            parseInt(limit || '20')
        );
        return { success: true, ...result };
    }

    @Put('buyer-accounts/:id/review')
    async reviewBuyerAccount(
        @Param('id') id: string,
        @Body() body: { approved: boolean; rejectReason?: string }
    ) {
        const account = await this.buyerAccountsService.reviewAccount(
            id,
            body.approved,
            body.rejectReason
        );
        return {
            success: true,
            message: body.approved ? '买号审核通过' : '买号已拒绝',
            data: account
        };
    }

    @Put('buyer-accounts/:id/star')
    async setBuyerAccountStar(
        @Param('id') id: string,
        @Body('star') star: number
    ) {
        const account = await this.buyerAccountsService.setAccountStar(id, star);
        return {
            success: true,
            message: '星级设置成功',
            data: account
        };
    }

    // ============ 批量审核 ============
    @Post('withdrawals/batch-approve')
    async batchApproveWithdrawals(
        @Body() body: { ids: string[]; approved: boolean; remark?: string }
    ) {
        const results = await this.adminService.batchApproveWithdrawals(body.ids, body.approved, body.remark);
        return {
            success: true,
            message: `批量操作完成，成功 ${results.success} 条，失败 ${results.failed} 条`,
            data: results
        };
    }

    @Post('buyer-accounts/batch-review')
    async batchReviewBuyerAccounts(
        @Body() body: { ids: string[]; approved: boolean; rejectReason?: string }
    ) {
        const results = await this.buyerAccountsService.batchReviewAccounts(body.ids, body.approved, body.rejectReason);
        return {
            success: true,
            message: `批量操作完成，成功 ${results.success} 条，失败 ${results.failed} 条`,
            data: results
        };
    }
}
