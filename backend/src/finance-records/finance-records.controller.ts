import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceRecordsService } from './finance-records.service';
import { FinanceRecordFilterDto, FinanceUserType, FinanceMoneyType } from './finance-record.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';

@Controller('finance-records')
@UseGuards(JwtAuthGuard)
export class FinanceRecordsController {
    constructor(private readonly financeRecordsService: FinanceRecordsService) { }

    // ============ 买手端 ============
    @Get('user/balance')
    async getUserBalanceRecords(@Request() req, @Query() filter: FinanceRecordFilterDto) {
        const userId = req.user.sub;
        const result = await this.financeRecordsService.findUserBalanceRecords(userId, filter);
        return { success: true, ...result };
    }

    @Get('user/silver')
    async getUserSilverRecords(@Request() req, @Query() filter: FinanceRecordFilterDto) {
        const userId = req.user.sub;
        const result = await this.financeRecordsService.findUserSilverRecords(userId, filter);
        return { success: true, ...result };
    }

    // ============ 商家端 ============
    @Get('merchant/balance')
    async getMerchantBalanceRecords(@Request() req, @Query() filter: FinanceRecordFilterDto) {
        const merchantId = req.user.sub;
        const result = await this.financeRecordsService.findMerchantBalanceRecords(merchantId, filter);
        return { success: true, ...result };
    }

    @Get('merchant/silver')
    async getMerchantSilverRecords(@Request() req, @Query() filter: FinanceRecordFilterDto) {
        const merchantId = req.user.sub;
        const result = await this.financeRecordsService.findMerchantSilverRecords(merchantId, filter);
        return { success: true, ...result };
    }

    // ============ 管理后台 ============
    @Get('admin/all')
    @UseGuards(AdminGuard)
    @RequirePermissions('finance:list')
    async getAllRecords(@Query() filter: FinanceRecordFilterDto) {
        const result = await this.financeRecordsService.findAll(filter);
        return { success: true, ...result };
    }

    @Get('admin/user/:userId/balance')
    @UseGuards(AdminGuard)
    @RequirePermissions('finance:list')
    async getAdminUserBalanceRecords(
        @Request() req,
        @Query('userId') userId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        const result = await this.financeRecordsService.findUserBalanceRecords(userId, filter);
        return { success: true, ...result };
    }

    @Get('admin/user/:userId/silver')
    @UseGuards(AdminGuard)
    @RequirePermissions('finance:list')
    async getAdminUserSilverRecords(
        @Request() req,
        @Query('userId') userId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        const result = await this.financeRecordsService.findUserSilverRecords(userId, filter);
        return { success: true, ...result };
    }

    @Get('admin/merchant/:merchantId/balance')
    @UseGuards(AdminGuard)
    @RequirePermissions('finance:list')
    async getAdminMerchantBalanceRecords(
        @Request() req,
        @Query('merchantId') merchantId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        const result = await this.financeRecordsService.findMerchantBalanceRecords(merchantId, filter);
        return { success: true, ...result };
    }

    @Get('admin/merchant/:merchantId/silver')
    @UseGuards(AdminGuard)
    @RequirePermissions('finance:list')
    async getAdminMerchantSilverRecords(
        @Request() req,
        @Query('merchantId') merchantId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        const result = await this.financeRecordsService.findMerchantSilverRecords(merchantId, filter);
        return { success: true, ...result };
    }
}
