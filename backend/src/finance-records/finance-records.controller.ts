import { Controller, Get, Query, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { FinanceRecordsService } from './finance-records.service';
import {
  FinanceRecordFilterDto,
  FinanceUserType,
  FinanceMoneyType,
} from './finance-record.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';

@Controller('finance-records')
@UseGuards(JwtAuthGuard)
export class FinanceRecordsController {
  constructor(private readonly financeRecordsService: FinanceRecordsService) {}

  // ============ 买手端 ============
  @Get('user/balance')
  async getUserBalanceRecords(
    @Request() req,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const userId = req.user.sub;
    const result = await this.financeRecordsService.findUserBalanceRecords(
      userId,
      filter,
    );
    return { success: true, ...result };
  }

  @Get('user/silver')
  async getUserSilverRecords(
    @Request() req,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const userId = req.user.sub;
    const result = await this.financeRecordsService.findUserSilverRecords(
      userId,
      filter,
    );
    return { success: true, ...result };
  }

  // ============ 商家端 ============
  @Get('merchant/balance')
  async getMerchantBalanceRecords(
    @Request() req,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const merchantId = req.user.sub;
    const result = await this.financeRecordsService.findMerchantBalanceRecords(
      merchantId,
      filter,
    );
    return { success: true, ...result };
  }

  @Get('merchant/silver')
  async getMerchantSilverRecords(
    @Request() req,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const merchantId = req.user.sub;
    const result = await this.financeRecordsService.findMerchantSilverRecords(
      merchantId,
      filter,
    );
    return { success: true, ...result };
  }

  // ============ 商家端导出 ============
  @Get('merchant/balance/export')
  async exportMerchantBalanceRecords(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('请选择导出时间范围');
    }

    try {
      const merchantId = req.user.sub;
      const result =
        await this.financeRecordsService.exportMerchantBalanceRecords(
          merchantId,
          startDate,
          endDate,
        );

      // 生成CSV内容
      const headers = ['金额', '财务类型', '账户余额', '财务描述', '财务写入时间'];
      const csvContent = [
        headers.join(','),
        ...result.data.map((r) =>
          [
            r.amount,
            `"${r.financeType}"`,
            r.balanceAfter,
            `"${r.memo.replace(/"/g, '""')}"`,
            r.createdAt,
          ].join(','),
        ),
      ].join('\n');

      // 添加BOM以支持中文
      const bom = '\uFEFF';
      const filename = encodeURIComponent(`押金财务导出表_${startDate}_${endDate}.csv`);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(bom + csvContent);
    } catch (error) {
      throw new BadRequestException(error.message || '导出失败');
    }
  }

  @Get('merchant/silver/export')
  async exportMerchantSilverRecords(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('请选择导出时间范围');
    }

    try {
      const merchantId = req.user.sub;
      const result =
        await this.financeRecordsService.exportMerchantSilverRecords(
          merchantId,
          startDate,
          endDate,
        );

      // 生成CSV内容
      const headers = ['金额', '财务类型', '账户余额', '财务描述', '财务写入时间'];
      const csvContent = [
        headers.join(','),
        ...result.data.map((r) =>
          [
            r.amount,
            `"${r.financeType}"`,
            r.balanceAfter,
            `"${r.memo.replace(/"/g, '""')}"`,
            r.createdAt,
          ].join(','),
        ),
      ].join('\n');

      // 添加BOM以支持中文
      const bom = '\uFEFF';
      const filename = encodeURIComponent(`银锭财务导出表_${startDate}_${endDate}.csv`);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(bom + csvContent);
    } catch (error) {
      throw new BadRequestException(error.message || '导出失败');
    }
  }

  // ============ 管理后台 ============
  @Get('admin/all')
  @UseGuards(AdminGuard)
  @RequirePermissions('finance:list')
  async getAllRecords(@Query() filter: FinanceRecordFilterDto) {
    const fs = require('fs');
    const logFile = '/tmp/finance-controller-debug.log';

    fs.appendFileSync(logFile, `\n=== ${new Date().toISOString()} ===\n`);
    fs.appendFileSync(logFile, `Received filter: ${JSON.stringify(filter)}\n`);
    fs.appendFileSync(logFile, `filter.userType BEFORE: ${filter.userType} (type: ${typeof filter.userType})\n`);

    // Manually convert string to number for type safety
    if (filter.userType !== undefined) {
      filter.userType = parseInt(filter.userType as any, 10);
    }
    if (filter.moneyType !== undefined) {
      filter.moneyType = parseInt(filter.moneyType as any, 10);
    }
    if (filter.financeType !== undefined) {
      filter.financeType = parseInt(filter.financeType as any, 10);
    }
    if (filter.page !== undefined) {
      filter.page = parseInt(filter.page as any, 10);
    }
    if (filter.limit !== undefined) {
      filter.limit = parseInt(filter.limit as any, 10);
    }

    fs.appendFileSync(logFile, `filter.userType AFTER: ${filter.userType} (type: ${typeof filter.userType})\n`);

    const result = await this.financeRecordsService.findAll(filter);

    fs.appendFileSync(logFile, `Result count: ${result.data.length}, Total: ${result.total}\n`);

    return { success: true, ...result };
  }

  @Get('admin/user/:userId/balance')
  @UseGuards(AdminGuard)
  @RequirePermissions('finance:list')
  async getAdminUserBalanceRecords(
    @Request() req,
    @Query('userId') userId: string,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const result = await this.financeRecordsService.findUserBalanceRecords(
      userId,
      filter,
    );
    return { success: true, ...result };
  }

  @Get('admin/user/:userId/silver')
  @UseGuards(AdminGuard)
  @RequirePermissions('finance:list')
  async getAdminUserSilverRecords(
    @Request() req,
    @Query('userId') userId: string,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const result = await this.financeRecordsService.findUserSilverRecords(
      userId,
      filter,
    );
    return { success: true, ...result };
  }

  @Get('admin/merchant/:merchantId/balance')
  @UseGuards(AdminGuard)
  @RequirePermissions('finance:list')
  async getAdminMerchantBalanceRecords(
    @Request() req,
    @Query('merchantId') merchantId: string,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const result = await this.financeRecordsService.findMerchantBalanceRecords(
      merchantId,
      filter,
    );
    return { success: true, ...result };
  }

  @Get('admin/merchant/:merchantId/silver')
  @UseGuards(AdminGuard)
  @RequirePermissions('finance:list')
  async getAdminMerchantSilverRecords(
    @Request() req,
    @Query('merchantId') merchantId: string,
    @Query() filter: FinanceRecordFilterDto,
  ) {
    const result = await this.financeRecordsService.findMerchantSilverRecords(
      merchantId,
      filter,
    );
    return { success: true, ...result };
  }
}
