import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto, MerchantLoginDto, UpdateMerchantDto } from './merchant.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('merchant')
export class MerchantsController {
    constructor(
        private readonly merchantsService: MerchantsService,
        private readonly jwtService: JwtService,
    ) { }

    // ========== 认证相关 ==========

    @Post('register')
    async register(@Body() dto: CreateMerchantDto) {
        const merchant = await this.merchantsService.create(dto);
        const token = this.jwtService.sign({
            merchantId: merchant.id,
            username: merchant.username,
            role: 'merchant'
        });

        return {
            success: true,
            message: '注册成功',
            data: {
                merchant,
                token
            }
        };
    }

    @Post('login')
    async login(@Body() dto: MerchantLoginDto) {
        const merchant = await this.merchantsService.findByUsername(dto.username);
        if (!merchant) {
            throw new UnauthorizedException('用户名或密码错误');
        }

        const isValid = await this.merchantsService.validatePassword(merchant, dto.password);
        if (!isValid) {
            throw new UnauthorizedException('用户名或密码错误');
        }

        const token = this.jwtService.sign({
            merchantId: merchant.id,
            username: merchant.username,
            role: 'merchant'
        });

        // 移除敏感信息
        const { password, payPassword, ...sanitized } = merchant;

        return {
            success: true,
            message: '登录成功',
            data: {
                merchant: sanitized,
                token
            }
        };
    }

    // ========== 商家信息 ==========

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const merchantId = req.user.merchantId;
        const merchant = await this.merchantsService.findOne(merchantId);
        return {
            success: true,
            data: merchant
        };
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Request() req, @Body() dto: UpdateMerchantDto) {
        const merchantId = req.user.merchantId;
        const merchant = await this.merchantsService.update(merchantId, dto);
        return {
            success: true,
            message: '更新成功',
            data: merchant
        };
    }

    // ========== 统计数据 ==========

    @Get('stats')
    @UseGuards(JwtAuthGuard)
    async getStats(@Request() req) {
        const merchantId = req.user.merchantId;
        const stats = await this.merchantsService.getStats(merchantId);
        return {
            success: true,
            data: stats
        };
    }

    // ========== 余额操作 ==========

    @Post('recharge')
    @UseGuards(JwtAuthGuard)
    async recharge(@Request() req, @Body() body: { amount: number }) {
        const merchantId = req.user.merchantId;

        // 简化版：直接加余额（实际需要对接支付）
        await this.merchantsService.addBalance(merchantId, body.amount, '充值');

        return {
            success: true,
            message: `充值成功，已到账 ¥${body.amount}`
        };
    }
}
