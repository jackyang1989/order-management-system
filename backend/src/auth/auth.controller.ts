import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
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
   */
  @Post('sms-login')
  @HttpCode(HttpStatus.OK)
  async smsLogin(@Body() body: { phone: string; code: string }) {
    return this.authService.loginWithSmsCode(body.phone, body.code);
  }

  /**
   * 刷新token接口
   * 使用现有的accessToken刷新，生成新的token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(@Request() req) {
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

    return {
      success: true,
      message: 'Token刷新成功',
      data: {
        accessToken: token,
      },
    };
  }

  /**
   * 登出接口
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
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
