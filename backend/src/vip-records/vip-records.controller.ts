import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VipRecordsService } from './vip-records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
    VipUserType,
    PurchaseVipDto,
    AdminSetVipDto,
    VipLevelConfigDto,
    VipRecordFilterDto,
} from './vip-record.entity';

@Controller('vip')
export class VipRecordsController {
    constructor(private vipService: VipRecordsService) { }

    // ============ 用户接口 ============

    /**
     * 获取我的VIP状态
     */
    @Get('my-status')
    @UseGuards(JwtAuthGuard)
    async getMyStatus(@Request() req) {
        const status = await this.vipService.getUserVipStatus(req.user.userId);
        return { success: true, data: status };
    }

    /**
     * 获取我的VIP记录
     */
    @Get('my-records')
    @UseGuards(JwtAuthGuard)
    async getMyRecords(@Request() req, @Query() filter: VipRecordFilterDto) {
        const result = await this.vipService.getUserRecords(req.user.userId, filter);
        return { success: true, ...result };
    }

    /**
     * 获取VIP等级列表（供前端展示）
     */
    @Get('levels')
    async getLevels(@Query('type') type: string) {
        const userType = type === 'merchant' ? VipUserType.MERCHANT : VipUserType.BUYER;
        const configs = await this.vipService.getAllLevelConfigs(userType);
        return { success: true, data: configs };
    }

    /**
     * 购买VIP
     */
    @Post('purchase')
    @UseGuards(JwtAuthGuard)
    async purchaseVip(@Request() req, @Body() dto: PurchaseVipDto) {
        const userType = req.user.role === 'merchant' ? VipUserType.MERCHANT : VipUserType.BUYER;
        const result = await this.vipService.purchaseVip(req.user.userId, userType, dto);

        if (!result.success) {
            return { success: false, message: result.message };
        }
        return { success: true, message: '购买成功', data: result.status };
    }

    // ============ 管理员接口 ============

    /**
     * 获取用户VIP状态
     */
    @Get('admin/user/:userId')
    @UseGuards(JwtAuthGuard)
    async getUserStatus(@Param('userId') userId: string) {
        const status = await this.vipService.getUserVipStatus(userId);
        return { success: true, data: status };
    }

    /**
     * 管理员设置VIP
     */
    @Post('admin/set')
    @UseGuards(JwtAuthGuard)
    async adminSetVip(@Request() req, @Body() dto: AdminSetVipDto) {
        const status = await this.vipService.adminSetVip(dto, req.user.userId);
        return { success: true, message: 'VIP设置成功', data: status };
    }

    /**
     * 获取所有VIP记录
     */
    @Get('admin/records')
    @UseGuards(JwtAuthGuard)
    async getAllRecords(@Query() filter: VipRecordFilterDto) {
        const result = await this.vipService.getAllRecords(filter);
        return { success: true, ...result };
    }

    /**
     * 获取VIP统计
     */
    @Get('admin/stats')
    @UseGuards(JwtAuthGuard)
    async getStats(@Query('type') type?: string) {
        const userType = type === 'merchant' ? VipUserType.MERCHANT :
            type === 'buyer' ? VipUserType.BUYER : undefined;
        const stats = await this.vipService.getVipStats(userType);
        return { success: true, data: stats };
    }

    /**
     * 获取所有VIP配置
     */
    @Get('admin/configs')
    @UseGuards(JwtAuthGuard)
    async getAllConfigs() {
        const configs = await this.vipService.getAllLevelConfigs();
        return { success: true, data: configs };
    }

    /**
     * 更新VIP配置
     */
    @Put('admin/configs/:type')
    @UseGuards(JwtAuthGuard)
    async updateConfig(
        @Param('type') type: string,
        @Body() dto: VipLevelConfigDto
    ) {
        const userType = type === 'merchant' ? VipUserType.MERCHANT : VipUserType.BUYER;
        const config = await this.vipService.upsertLevelConfig(userType, dto);
        return { success: true, message: '配置更新成功', data: config };
    }

    /**
     * 初始化默认配置
     */
    @Post('admin/configs/init')
    @UseGuards(JwtAuthGuard)
    async initConfigs() {
        await this.vipService.initDefaultConfigs();
        return { success: true, message: '默认配置初始化成功' };
    }

    /**
     * 处理过期VIP（可定时调用）
     */
    @Post('admin/process-expired')
    @UseGuards(JwtAuthGuard)
    async processExpired() {
        const count = await this.vipService.processExpiredVip();
        return { success: true, message: `已处理${count}个过期VIP` };
    }
}
