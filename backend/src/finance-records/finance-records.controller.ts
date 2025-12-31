import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { FinanceRecordsService } from './finance-records.service';
import { FinanceRecordFilterDto, FinanceUserType, FinanceMoneyType } from './finance-record.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
    async getAllRecords(@Query() filter: FinanceRecordFilterDto) {
        // TODO: 添加管理员权限验证
        const result = await this.financeRecordsService.findAll(filter);
        return { success: true, ...result };
    }

    @Get('admin/user/:userId/balance')
    async getAdminUserBalanceRecords(
        @Request() req,
        @Query('userId') userId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        // TODO: 添加管理员权限验证
        const result = await this.financeRecordsService.findUserBalanceRecords(userId, filter);
        return { success: true, ...result };
    }

    @Get('admin/user/:userId/silver')
    async getAdminUserSilverRecords(
        @Request() req,
        @Query('userId') userId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        // TODO: 添加管理员权限验证
        const result = await this.financeRecordsService.findUserSilverRecords(userId, filter);
        return { success: true, ...result };
    }

    @Get('admin/merchant/:merchantId/balance')
    async getAdminMerchantBalanceRecords(
        @Request() req,
        @Query('merchantId') merchantId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        // TODO: 添加管理员权限验证
        const result = await this.financeRecordsService.findMerchantBalanceRecords(merchantId, filter);
        return { success: true, ...result };
    }

    @Get('admin/merchant/:merchantId/silver')
    async getAdminMerchantSilverRecords(
        @Request() req,
        @Query('merchantId') merchantId: string,
        @Query() filter: FinanceRecordFilterDto
    ) {
        // TODO: 添加管理员权限验证
        const result = await this.financeRecordsService.findMerchantSilverRecords(merchantId, filter);
        return { success: true, ...result };
    }
}
