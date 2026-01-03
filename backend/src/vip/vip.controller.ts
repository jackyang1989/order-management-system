import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Inject, Optional } from '@nestjs/common';
import { VipService } from './vip.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVipPackageDto, PurchaseVipDto } from './vip.entity';
import { VipLevelService } from '../admin-config/vip-level.service';

@Controller('vip')
export class VipController {
    constructor(
        private vipService: VipService,
        @Optional() @Inject(VipLevelService) private vipLevelService?: VipLevelService,
    ) { }

    // ========== 公开接口 ==========

    /**
     * 获取所有可用套餐
     */
    @Get('packages')
    async getPackages() {
        const packages = await this.vipService.findAllPackages();
        return { success: true, data: packages };
    }

    /**
     * 获取套餐详情
     */
    @Get('packages/:id')
    async getPackageDetail(@Param('id') id: string) {
        const pkg = await this.vipService.findPackageById(id);
        if (!pkg) {
            return { success: false, message: '套餐不存在' };
        }
        return { success: true, data: pkg };
    }

    // ========== 用户接口 ==========

    /**
     * 获取当前用户VIP状态
     */
    @Get('status')
    @UseGuards(JwtAuthGuard)
    async getVipStatus(@Request() req) {
        const status = await this.vipService.getUserVipStatus(req.user.userId);
        return { success: true, data: status };
    }

    /**
     * 购买VIP
     */
    @Post('purchase')
    @UseGuards(JwtAuthGuard)
    async purchaseVip(@Request() req, @Body() dto: PurchaseVipDto) {
        try {
            const result = await this.vipService.purchaseVip(req.user.userId, dto);

            // 判断返回类型：支付宝订单 vs 直接购买成功
            if ('payUrl' in result) {
                return {
                    success: true,
                    message: '正在跳转到支付宝支付页面',
                    data: {
                        payUrl: result.payUrl,
                        orderNo: result.orderNo
                    }
                };
            }

            return {
                success: true,
                message: 'VIP购买成功',
                data: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 支付宝回调（模拟）
     */
    @Post('alipay/callback')
    async alipayCallback(@Body() body: { orderNo: string }) {
        try {
            const purchase = await this.vipService.handleAlipayCallback(body.orderNo);
            return {
                success: true,
                message: 'VIP开通成功',
                data: purchase
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取用户余额信息（用于前端展示）
     */
    @Get('balance')
    @UseGuards(JwtAuthGuard)
    async getUserBalance(@Request() req) {
        const status = await this.vipService.getUserVipStatus(req.user.userId);
        // 这里需要从用户服务获取余额，简化处理
        return {
            success: true,
            data: status
        };
    }

    /**
     * 获取购买记录
     */
    @Get('records')
    @UseGuards(JwtAuthGuard)
    async getPurchaseRecords(
        @Request() req,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string
    ) {
        const result = await this.vipService.getUserPurchases(
            req.user.userId,
            parseInt(page || '1'),
            parseInt(pageSize || '20')
        );
        return { success: true, data: result };
    }

    // ========== 管理员接口 ==========

    /**
     * 创建套餐
     */
    @Post('admin/packages')
    @UseGuards(JwtAuthGuard)
    async createPackage(@Body() dto: CreateVipPackageDto) {
        const pkg = await this.vipService.createPackage(dto);
        return { success: true, message: '套餐创建成功', data: pkg };
    }

    /**
     * 更新套餐
     */
    @Put('admin/packages/:id')
    @UseGuards(JwtAuthGuard)
    async updatePackage(@Param('id') id: string, @Body() dto: Partial<CreateVipPackageDto>) {
        const pkg = await this.vipService.updatePackage(id, dto);
        if (!pkg) {
            return { success: false, message: '套餐不存在' };
        }
        return { success: true, message: '套餐更新成功', data: pkg };
    }

    /**
     * 删除套餐
     */
    @Delete('admin/packages/:id')
    @UseGuards(JwtAuthGuard)
    async deletePackage(@Param('id') id: string) {
        const result = await this.vipService.deletePackage(id);
        if (!result) {
            return { success: false, message: '删除失败' };
        }
        return { success: true, message: '套餐已删除' };
    }

    /**
     * 初始化默认套餐
     */
    @Post('admin/init')
    @UseGuards(JwtAuthGuard)
    async initPackages() {
        await this.vipService.initDefaultPackages();
        return { success: true, message: '默认套餐初始化成功' };
    }

    // ========== VIP等级公开接口（从VipPublicController合并） ==========

    /**
     * 获取买手VIP等级列表
     */
    @Get('buyer/levels')
    async getBuyerLevels() {
        if (!this.vipLevelService) {
            return { success: false, message: 'VipLevelService not available' };
        }
        const data = await this.vipLevelService.findAll('buyer');
        return { success: true, data };
    }

    /**
     * 获取商家VIP等级列表
     */
    @Get('merchant/levels')
    async getMerchantLevels() {
        if (!this.vipLevelService) {
            return { success: false, message: 'VipLevelService not available' };
        }
        const data = await this.vipLevelService.findAll('merchant');
        return { success: true, data };
    }

    /**
     * 获取升级价格
     */
    @Get('upgrade-price')
    async getUpgradePrice(
        @Query('type') type: 'buyer' | 'merchant',
        @Query('currentLevel') currentLevel: string,
        @Query('targetLevel') targetLevel: string,
    ) {
        if (!this.vipLevelService) {
            return { success: false, message: 'VipLevelService not available' };
        }
        const price = await this.vipLevelService.getUpgradePrice(
            type,
            parseInt(currentLevel, 10) || 0,
            parseInt(targetLevel, 10) || 1,
        );
        return { success: true, price };
    }
}
