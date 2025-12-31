import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { RechargeService } from './recharge.service';
import {
    CreateRechargeDto,
    AdminRechargeDto,
    RechargeFilterDto,
    RechargeUserType
} from './recharge.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recharge')
export class RechargeController {
    constructor(private readonly rechargeService: RechargeService) { }

    // ============ 买手端 ============
    @Post('user/create')
    @UseGuards(JwtAuthGuard)
    async createUserRecharge(@Request() req, @Body() dto: CreateRechargeDto) {
        const userId = req.user.sub;
        const recharge = await this.rechargeService.createOrder(userId, RechargeUserType.BUYER, dto);
        return {
            success: true,
            message: '充值订单创建成功',
            data: recharge,
            // 返回支付URL（实际需要对接支付网关）
            payUrl: `/pay/alipay?orderNumber=${recharge.orderNumber}&amount=${recharge.amount}`
        };
    }

    @Get('user/records')
    @UseGuards(JwtAuthGuard)
    async getUserRechargeRecords(@Request() req) {
        const userId = req.user.sub;
        const records = await this.rechargeService.findByUser(userId, RechargeUserType.BUYER);
        return { success: true, data: records };
    }

    // ============ 商家端 ============
    @Post('merchant/create')
    @UseGuards(JwtAuthGuard)
    async createMerchantRecharge(@Request() req, @Body() dto: CreateRechargeDto) {
        const merchantId = req.user.sub;
        const recharge = await this.rechargeService.createOrder(merchantId, RechargeUserType.MERCHANT, dto);
        return {
            success: true,
            message: '充值订单创建成功',
            data: recharge,
            payUrl: `/pay/alipay?orderNumber=${recharge.orderNumber}&amount=${recharge.amount}`
        };
    }

    @Get('merchant/records')
    @UseGuards(JwtAuthGuard)
    async getMerchantRechargeRecords(@Request() req) {
        const merchantId = req.user.sub;
        const records = await this.rechargeService.findByUser(merchantId, RechargeUserType.MERCHANT);
        return { success: true, data: records };
    }

    // ============ 支付回调 ============
    @Post('callback/alipay')
    async alipayCallback(@Body() body: { orderNumber: string; tradeNo: string; success: boolean }) {
        // 实际使用时需要验证支付宝签名
        const recharge = await this.rechargeService.handleCallback(
            body.orderNumber,
            body.tradeNo,
            body.success
        );
        return { success: true, data: recharge };
    }

    // ============ 管理后台 ============
    @Post('admin/recharge')
    @UseGuards(JwtAuthGuard)
    async adminRecharge(@Request() req, @Body() dto: AdminRechargeDto) {
        // TODO: 验证管理员权限
        const operatorId = req.user.sub;
        const recharge = await this.rechargeService.adminRecharge(dto, operatorId);
        return { success: true, message: '充值成功', data: recharge };
    }

    @Get('admin/records')
    @UseGuards(JwtAuthGuard)
    async getAllRechargeRecords(@Query() filter: RechargeFilterDto) {
        // TODO: 验证管理员权限
        const result = await this.rechargeService.findAll(filter);
        return { success: true, ...result };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string) {
        const recharge = await this.rechargeService.findOne(id);
        if (!recharge) {
            return { success: false, message: '充值记录不存在' };
        }
        return { success: true, data: recharge };
    }
}
