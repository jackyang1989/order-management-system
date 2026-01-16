import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../users/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  // P1-4: 使用 httpOnly cookie 存储 token，提升安全性
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(loginDto);

    // 设置 httpOnly cookie
    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    // 不在响应体中返回 token
    const { accessToken, ...data } = result.data;
    return {
      success: result.success,
      message: result.message,
      data,
    };
  }

  // P1-4: 使用 httpOnly cookie 存储 token
  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.register(createUserDto);

    // 设置 httpOnly cookie
    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    // 不在响应体中返回 token
    const { accessToken, ...data } = result.data;
    return {
      success: result.success,
      message: result.message,
      data,
    };
  }

  /**
   * 发送登录验证码
   */
  @Post('send-login-code')
  @HttpCode(HttpStatus.OK)
  async sendLoginCode(@Body() body: { phone: string }, @Ip() ip: string) {
    return this.authService.sendLoginCode(body.phone, ip);
  }

  /**
   * 短信验证码登录
   * P1-4: 使用 httpOnly cookie 存储 token
   */
  @Post('sms-login')
  @HttpCode(HttpStatus.OK)
  async smsLogin(
    @Body() body: { phone: string; code: string },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.loginWithSmsCode(body.phone, body.code);

    // 设置 httpOnly cookie
    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    // 不在响应体中返回 token
    const { accessToken, ...data } = result.data;
    return {
      success: result.success,
      message: result.message,
      data,
    };
  }

  /**
   * 刷新token接口
   * 使用现有的accessToken刷新，生成新的token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(
    @Request() req,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const user = req.user;

    // 根据用户类型生成新的token
    let payload: any = {
      sub: user.userId,
      username: user.username,
    };

    // 管理员
    if (user.adminId || user.isAdmin) {
      payload = {
        ...payload,
        adminId: user.adminId || user.userId,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        roleId: user.roleId,
        roleName: user.roleName,
        permissions: user.permissions,
      };
    }
    // 商家
    else if (user.merchantId || user.role === 'merchant') {
      payload = {
        ...payload,
        merchantId: user.merchantId || user.userId,
        role: 'merchant',
      };
    }
    // 普通用户
    else {
      payload = {
        ...payload,
        phone: user.phone,
      };
    }

    // 生成新token
    const token = this.jwtService.sign(payload);

    // 设置新的cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天
    });

    return {
      success: true,
      message: 'Token刷新成功',
    };
  }

  /**
   * 登出接口
   * P1-4: 清除 httpOnly cookie
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    // 清除 cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    return {
      success: true,
      message: '登出成功',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    // 统一的 /auth/me 接口，支持所有三种角色
    const user = req.user;

    // 管理员
    if (user.adminId || user.isAdmin) {
      return {
        success: true,
        data: {
          type: 'admin',
          userId: user.adminId || user.userId,
          username: user.username,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          roleId: user.roleId,
          roleName: user.roleName,
          permissions: user.permissions,
        },
      };
    }

    // 商家
    if (user.merchantId || user.role === 'merchant') {
      return {
        success: true,
        data: {
          type: 'merchant',
          userId: user.merchantId || user.userId,
          username: user.username,
          role: user.role,
        },
      };
    }

    // 普通用户
    return {
      success: true,
      data: {
        type: 'user',
        userId: user.userId,
        username: user.username,
        phone: user.phone,
      },
    };
  }

  /**
   * 重置密码（通过短信验证码）
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: { mobile: string; code: string; newPassword: string },
  ) {
    return this.authService.resetPasswordWithSms(
      body.mobile,
      body.code,
      body.newPassword,
    );
  }
}
