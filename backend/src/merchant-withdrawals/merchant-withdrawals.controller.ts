import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MerchantWithdrawalsService } from './merchant-withdrawals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMerchantWithdrawalDto, ReviewMerchantWithdrawalDto, MerchantWithdrawalStatus } from './merchant-withdrawal.entity';

@Controller('merchant-withdrawals')
@UseGuards(JwtAuthGuard)
export class MerchantWithdrawalsController {
    constructor(private withdrawalsService: MerchantWithdrawalsService) { }

    // ============ 商家端接口 ============

    @Get()
    async findAll(@Request() req) {
        const withdrawals = await this.withdrawalsService.findAllByMerchant(req.user.userId);
        return { success: true, data: withdrawals };
    }

    @Get('stats')
    async getStats(@Request() req) {
        const stats = await this.withdrawalsService.getStats(req.user.userId);
        return { success: true, data: stats };
    }

    @Post()
    async create(@Body() createDto: CreateMerchantWithdrawalDto, @Request() req) {
        try {
            const withdrawal = await this.withdrawalsService.create(req.user.userId, createDto);
            return {
                success: true,
                message: '提现申请提交成功',
                data: withdrawal
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============ 管理员接口 ============

    @Get('admin/pending')
    async getPending(
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const result = await this.withdrawalsService.findAllPending(
            parseInt(page || '1'),
            parseInt(limit || '20')
        );
        return { success: true, ...result };
    }

    @Get('admin/list')
    async getAllWithdrawals(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('merchantId') merchantId?: string
    ) {
        const filters: any = {};
        if (status !== undefined) filters.status = parseInt(status) as MerchantWithdrawalStatus;
        if (merchantId) filters.merchantId = merchantId;

        const result = await this.withdrawalsService.findAll(
            parseInt(page || '1'),
            parseInt(limit || '20'),
            filters
        );
        return { success: true, ...result };
    }

    @Get('admin/stats')
    async getAdminStats() {
        const stats = await this.withdrawalsService.getAdminStats();
        return { success: true, data: stats };
    }

    @Post('admin/:id/review')
    async review(
        @Param('id') id: string,
        @Body() reviewDto: ReviewMerchantWithdrawalDto,
        @Request() req
    ) {
        try {
            const withdrawal = await this.withdrawalsService.review(
                id,
                reviewDto,
                req.user.userId
            );
            return {
                success: true,
                message: withdrawal.status === MerchantWithdrawalStatus.COMPLETED
                    ? '提现审核通过'
                    : '提现已拒绝',
                data: withdrawal
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}
