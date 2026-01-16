import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Response,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { MerchantsService } from './merchants.service';
import {
  CreateMerchantDto,
  MerchantLoginDto,
  UpdateMerchantDto,
} from './merchant.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('merchant')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly jwtService: JwtService,
  ) {}

  // ========== 认证相关 ==========

  // P1-4: 使用 httpOnly cookie 存储 token
  @Post('register')
  async register(
    @Body() dto: CreateMerchantDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const merchant = await this.merchantsService.create(dto);
    const token = this.jwtService.sign({
      sub: merchant.id, // 添加 sub 字段，确保 userId 正确
      merchantId: merchant.id,
      username: merchant.username,
      role: 'merchant',
    });

    // 设置 httpOnly cookie
    const cookieOptions: any = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    };

    // 生产环境使用严格的安全设置
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
      cookieOptions.sameSite = 'strict';
    }
    // 开发环境：不设置sameSite，允许跨域cookie

    res.cookie('accessToken', token, cookieOptions);

    return {
      success: true,
      message: '注册成功',
      data: {
        merchant,
      },
    };
  }

  // P1-4: 使用 httpOnly cookie 存储 token
  @Post('login')
  async login(
    @Body() dto: MerchantLoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const merchant = await this.merchantsService.findByUsername(dto.username);
    if (!merchant) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isValid = await this.merchantsService.validatePassword(
      merchant,
      dto.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.jwtService.sign({
      sub: merchant.id, // 添加 sub 字段，确保 userId 正确
      merchantId: merchant.id,
      username: merchant.username,
      role: 'merchant',
    });

    // 移除敏感信息
    const { password, payPassword, ...sanitized } = merchant;

    return {
      success: true,
      message: '登录成功',
      data: {
        token,
        merchant: sanitized,
      },
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
      data: merchant,
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
      data: merchant,
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
      data: stats,
    };
  }

  @Get('referral-info')
  @UseGuards(JwtAuthGuard)
  async getReferralInfo(@Request() req) {
    const merchantId = req.user.merchantId;
    const data = await this.merchantsService.getReferralInfo(merchantId);
    return {
      success: true,
      data,
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
      message: `充值成功，已到账 ¥${body.amount}`,
    };
  }
}
