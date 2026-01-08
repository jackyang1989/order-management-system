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

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
