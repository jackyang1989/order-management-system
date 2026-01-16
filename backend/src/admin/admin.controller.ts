import {
  Controller,
  Get,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Post,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard, RequirePermissions } from '../auth/admin.guard';
import { MerchantStatus } from '../merchants/merchant.entity';
import { WithdrawalStatus } from '../withdrawals/withdrawal.entity';
import { ShopsService } from '../shops/shops.service';
import { ShopStatus, ShopPlatform } from '../shops/shop.entity';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus, UpdateBuyerAccountDto } from '../buyer-accounts/buyer-account.entity';
import { MerchantsService } from '../merchants/merchants.service';
import { CreateMerchantDto } from '../merchants/merchant.entity';
import { UsersService } from '../users/users.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly shopsService: ShopsService,
    private readonly buyerAccountsService: BuyerAccountsService,
    private readonly merchantsService: MerchantsService,
    private readonly usersService: UsersService,
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
    @Query('search') search?: string,
  ) {
    const result = await this.adminService.getUsers(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      search,
    );
    return { success: true, ...result };
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body('active') active: boolean,
  ) {
    const user = await this.adminService.updateUserStatus(id, active);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, message: '状态更新成功', data: user };
  }

  @Post('users')
  async createUser(@Body() body: {
    username: string;
    password: string;
    phone: string;
    wechat?: string;
    vipExpireAt?: string;
    balance?: number;
    silver?: number;
    note?: string;
  }) {
    try {
      // 生成一个随机的邀请码作为注册用
      const user = await this.usersService.create({
        username: body.username,
        password: body.password,
        phone: body.phone,
        wechat: body.wechat,
        invitationCode: '', // 不使用邀请码
        vipExpireAt: body.vipExpireAt,
        balance: body.balance,
        silver: body.silver,
        note: body.note,
      });
      return {
        success: true,
        message: '买手创建成功',
        data: user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '创建失败',
      };
    }
  }

  // ============ 商家管理 ============
  @Get('merchants')
  async getMerchants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    const statusEnum =
      status !== undefined ? (parseInt(status) as MerchantStatus) : undefined;
    const result = await this.adminService.getMerchants(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      statusEnum,
      keyword,
    );
    return { success: true, ...result };
  }

  @Put('merchants/:id/approve')
  async approveMerchant(
    @Param('id') id: string,
    @Body('approved') approved: boolean,
  ) {
    const merchant = await this.adminService.approveMerchant(id, approved);
    if (!merchant) {
      return { success: false, message: '商家不存在' };
    }
    return {
      success: true,
      message: approved ? '商家审核通过' : '商家已拒绝',
      data: merchant,
    };
  }

  @Post('merchants')
  async createMerchant(@Body() dto: CreateMerchantDto) {
    try {
      const merchant = await this.merchantsService.create(dto);
      return {
        success: true,
        message: '商家创建成功',
        data: merchant,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '创建失败',
      };
    }
  }

  @Put('merchants/:id')
  async updateMerchant(
    @Param('id') id: string,
    @Body() body: {
      phone?: string;
      wechat?: string;
      companyName?: string;
      balance?: number;
      silver?: number;
      vipExpireAt?: string;
      note?: string;
      referrerId?: string;
    },
  ) {
    try {
      const result = await this.merchantsService.updateMerchantInfo(id, body);
      if (!result.success) {
        return { success: false, message: result.message };
      }
      return {
        success: true,
        message: '商家信息更新成功',
        data: result.merchant,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '更新失败',
      };
    }
  }

  // ============ 任务管理 ============
  @Get('tasks')
  async getTasks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const statusNum = status !== undefined ? parseInt(status) : undefined;
    const result = await this.adminService.getTasks(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      statusNum,
    );
    return { success: true, ...result };
  }

  @Put('tasks/:id/status')
  async updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: number,
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
    @Query('status') status?: string,
  ) {
    const statusEnum =
      status !== undefined
        ? (parseInt(status) as WithdrawalStatus)
        : undefined;
    const result = await this.adminService.getWithdrawals(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      statusEnum,
    );
    return { success: true, ...result };
  }

  @Put('withdrawals/:id/approve')
  async approveWithdrawal(
    @Param('id') id: string,
    @Body() body: { approved: boolean; remark?: string },
    @Req() req,
  ) {
    const withdrawal = await this.adminService.approveWithdrawal(
      id,
      body.approved,
      body.remark,
      req.admin.adminId, // Changed from req.user to req.admin
    );
    if (!withdrawal) {
      return { success: false, message: '提现记录不存在' };
    }
    return {
      success: true,
      message: body.approved ? '提现已通过' : '提现已拒绝',
      data: withdrawal,
    };
  }

  @Put('withdrawals/:id/confirm-payment')
  async confirmWithdrawalPayment(
    @Param('id') id: string,
    @Req() req,
  ) {
    const withdrawal = await this.adminService.confirmWithdrawalPayment(
      id,
      req.admin.adminId,
    );
    if (!withdrawal) {
      return { success: false, message: '提现记录不存在或状态不正确' };
    }
    return {
      success: true,
      message: '已确认打款',
      data: withdrawal,
    };
  }

  // ============ 店铺管理 ============
  @Get('shops')
  async getShops(@Query() query: any) {
    // 如果提供了merchantId参数且是merchantNo格式，需要先转换为UUID
    if (query.merchantId && query.merchantId.startsWith('M')) {
      const merchant = await this.merchantsService.findByMerchantNo(query.merchantId);
      if (merchant) {
        query.merchantId = merchant.id;
      }
    }
    return this.shopsService.findAll(query);
  }

  @Put('shops/:id')
  async updateShop(
    @Param('id') id: string,
    @Body() body: {
      platform?: ShopPlatform;
      shopName?: string;
      accountName?: string;
      contactName?: string;
      mobile?: string;
      province?: string;
      city?: string;
      district?: string;
      detailAddress?: string;
      url?: string;
      needLogistics?: boolean;
      expressCode?: string;
      screenshot?: string;
    },
  ) {
    try {
      const shop = await this.shopsService.adminUpdate(id, body);
      return { success: true, message: '店铺信息更新成功', data: shop };
    } catch (error: any) {
      return { success: false, message: error.message || '更新失败' };
    }
  }

  @Post('shops/:id/review')
  async reviewShop(
    @Param('id') id: string,
    @Body() body: { status: ShopStatus; remark?: string },
  ) {
    return this.shopsService.review(id, body.status, body.remark);
  }

  // ============ 买号审核 ============
  @Get('buyer-accounts')
  async getBuyerAccounts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const statusEnum =
      status !== undefined
        ? (parseInt(status) as BuyerAccountStatus)
        : undefined;

    // 如果提供了userId参数，需要先将userNo转换为UUID
    let actualUserId = userId;
    if (userId && userId.startsWith('U')) {
      const user = await this.usersService.findByUserNo(userId);
      if (user) {
        actualUserId = user.id;
      }
    }

    const result = await this.buyerAccountsService.getAllAccounts(
      parseInt(page || '1'),
      parseInt(limit || '20'),
      statusEnum,
      actualUserId,
    );
    return { success: true, ...result };
  }

  @Get('buyer-accounts/pending')
  async getPendingBuyerAccounts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.buyerAccountsService.getPendingAccounts(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
    return { success: true, ...result };
  }

  @Put('buyer-accounts/:id/review')
  async reviewBuyerAccount(
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectReason?: string },
  ) {
    const account = await this.buyerAccountsService.reviewAccount(
      id,
      body.approved,
      body.rejectReason,
    );
    return {
      success: true,
      message: body.approved ? '买号审核通过' : '买号已拒绝',
      data: account,
    };
  }

  @Put('buyer-accounts/:id/star')
  async setBuyerAccountStar(
    @Param('id') id: string,
    @Body('star') star: number,
  ) {
    const account = await this.buyerAccountsService.setAccountStar(id, star);
    return {
      success: true,
      message: '星级设置成功',
      data: account,
    };
  }

  @Put('buyer-accounts/:id')
  async updateBuyerAccount(
    @Param('id') id: string,
    @Body() updateDto: UpdateBuyerAccountDto,
  ) {
    const account = await this.buyerAccountsService.adminUpdate(id, updateDto);
    return {
      success: true,
      message: '买号更新成功',
      data: account,
    };
  }

  @Delete('buyer-accounts/:id')
  async deleteBuyerAccount(@Param('id') id: string) {
    await this.buyerAccountsService.adminDelete(id);
    return {
      success: true,
      message: '买号删除成功',
    };
  }

  // ============ 批量审核 ============
  @Post('withdrawals/batch-approve')
  async batchApproveWithdrawals(
    @Body() body: { ids: string[]; approved: boolean; remark?: string },
  ) {
    const results = await this.adminService.batchApproveWithdrawals(
      body.ids,
      body.approved,
      body.remark,
    );
    return {
      success: true,
      message: `批量操作完成，成功 ${results.success} 条，失败 ${results.failed} 条`,
      data: results,
    };
  }

  @Post('buyer-accounts/batch-review')
  async batchReviewBuyerAccounts(
    @Body() body: { ids: string[]; approved: boolean; rejectReason?: string },
  ) {
    const results = await this.buyerAccountsService.batchReviewAccounts(
      body.ids,
      body.approved,
      body.rejectReason,
    );
    return {
      success: true,
      message: `批量操作完成，成功 ${results.success} 条，失败 ${results.failed} 条`,
      data: results,
    };
  }

  // ============ 用户/商家余额管理 ============

  @Get('users/:id/detail')
  async getUserDetail(@Param('id') id: string) {
    const user = await this.adminService.getUserDetail(id);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  }

  @Get('merchants/:id/detail')
  async getMerchantDetail(@Param('id') id: string) {
    const merchant = await this.adminService.getMerchantDetail(id);
    if (!merchant) {
      return { success: false, message: '商家不存在' };
    }
    return { success: true, data: merchant };
  }

  @Post('users/:id/adjust-balance')
  async adjustUserBalance(
    @Param('id') id: string,
    @Body()
    body: { type: 'balance' | 'silver'; amount: number; reason: string },
  ) {
    // TODO: 从请求中获取管理员ID
    const operatorId = 'admin';
    const result = await this.adminService.adjustUserBalance(
      id,
      body.type,
      body.amount,
      body.reason,
      operatorId,
    );
    if (!result.success) {
      return { success: false, message: result.error };
    }
    return {
      success: true,
      message: `${body.type === 'balance' ? '余额' : '银锭'}调整成功`,
      data: { newBalance: result.newBalance },
    };
  }

  @Post('merchants/:id/adjust-balance')
  async adjustMerchantBalance(
    @Param('id') id: string,
    @Body()
    body: { type: 'balance' | 'silver'; amount: number; reason: string },
  ) {
    const operatorId = 'admin';
    const result = await this.adminService.adjustMerchantBalance(
      id,
      body.type,
      body.amount,
      body.reason,
      operatorId,
    );
    if (!result.success) {
      return { success: false, message: result.error };
    }
    return {
      success: true,
      message: `${body.type === 'balance' ? '余额' : '银锭'}调整成功`,
      data: { newBalance: result.newBalance },
    };
  }

  @Post('users/:id/set-vip')
  async setUserVip(
    @Param('id') id: string,
    @Body() body: { vip: boolean; expireAt?: string },
  ) {
    const expireAt = body.expireAt ? new Date(body.expireAt) : undefined;
    const result = await this.adminService.setUserVip(id, body.vip, expireAt);
    if (!result.success) {
      return { success: false, message: result.error };
    }
    return {
      success: true,
      message: body.vip ? 'VIP已开通' : 'VIP已关闭',
    };
  }

  @Post('merchants/:id/set-vip')
  async setMerchantVip(
    @Param('id') id: string,
    @Body() body: { vip: boolean; expireAt?: string },
  ) {
    const expireAt = body.expireAt ? new Date(body.expireAt) : undefined;
    const result = await this.adminService.setMerchantVip(
      id,
      body.vip,
      expireAt,
    );
    if (!result.success) {
      return { success: false, message: result.error };
    }
    return {
      success: true,
      message: body.vip ? 'VIP已开通' : 'VIP已关闭',
    };
  }

  // ============ 统计报表 ============

  /**
   * 经营概况 - 今日/昨日/本周/本月数据对比
   */
  @Get('reports/business-overview')
  async getBusinessOverview() {
    const data = await this.adminService.getBusinessOverview();
    return { success: true, data };
  }

  /**
   * 资金大盘 - 平台资金流转统计
   */
  @Get('reports/fund-overview')
  async getFundOverview() {
    const data = await this.adminService.getFundOverview();
    return { success: true, data };
  }

  /**
   * 用户增长趋势
   */
  @Get('reports/user-growth')
  async getUserGrowthTrend(@Query('days') days?: string) {
    const data = await this.adminService.getUserGrowthTrend(
      days ? parseInt(days) : 30,
    );
    return { success: true, data };
  }

  /**
   * 订单趋势
   */
  @Get('reports/order-trend')
  async getOrderTrend(@Query('days') days?: string) {
    const data = await this.adminService.getOrderTrend(
      days ? parseInt(days) : 30,
    );
    return { success: true, data };
  }

  // ============ 数据修复工具 ============

  /**
   * 修复单个任务的已领取数量
   */
  @Post('tasks/:id/fix-claimed-count')
  @RequirePermissions('task:manage')
  async fixTaskClaimedCount(@Param('id') id: string) {
    const result = await this.adminService.fixTaskClaimedCount(id);
    return {
      success: true,
      message: result.fixed ? '修复成功' : '无需修复',
      data: result,
    };
  }

  /**
   * 批量修复所有任务的已领取数量
   */
  @Post('tasks/fix-all-claimed-counts')
  @RequirePermissions('task:manage')
  async fixAllClaimedCounts() {
    const result = await this.adminService.fixAllTaskClaimedCounts();
    return {
      success: true,
      message: `修复完成，共检查 ${result.total} 个任务，修复 ${result.fixed} 个`,
      data: result,
    };
  }
}
