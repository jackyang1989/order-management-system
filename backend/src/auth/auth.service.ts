import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, LoginDto } from '../users/user.entity';
import { SmsService } from '../sms/sms.service';
import { SmsCodeType } from '../sms/sms.entity';
import { AdminConfigService } from '../admin-config/admin-config.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private adminConfigService: AdminConfigService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    // 支持手机号或 userNo 验证
    let user = await this.usersService.findByPhone(identifier);
    if (!user) {
      user = await this.usersService.findByUserNo(identifier);
    }
    if (user && (await this.usersService.validatePassword(user, password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    console.log('[Auth] Login attempt:', { phone: loginDto.phone, userNo: loginDto.userNo });

    // 支持手机号或 userNo 登录
    let user: any = null;
    if (loginDto.phone) {
      user = await this.usersService.findByPhone(loginDto.phone);
      console.log('[Auth] Found user by phone:', !!user);
    }
    if (!user && loginDto.userNo) {
      user = await this.usersService.findByUserNo(loginDto.userNo);
      console.log('[Auth] Found user by userNo:', !!user);
    }

    if (!user) {
      console.log('[Auth] User not found');
      throw new UnauthorizedException('手机号/用户ID或密码错误');
    }

    const isValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    console.log('[Auth] Password valid:', isValid);

    if (!isValid) {
      throw new UnauthorizedException('手机号/用户ID或密码错误');
    }

    // 检查封禁状态
    if (user.isBanned) {
      const reason = user.banReason ? `：${user.banReason}` : '';
      throw new ForbiddenException(`账号已被封禁${reason}`);
    }

    const payload = {
      sub: user.id,
      userNo: user.userNo,
      phone: user.phone,
    };

    return {
      success: true,
      message: '登录成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          userNo: user.userNo,
          phone: user.phone,
          balance: user.balance,
          silver: user.silver,
          reward: user.reward,
          invitationCode: user.invitationCode,
        },
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // 检查用户注册开关
    const isEnabled = this.adminConfigService.getBooleanValue('user_registration_enabled', true);
    if (!isEnabled) {
      throw new ForbiddenException('用户注册功能已关闭');
    }

    // 检查手机号是否已存在
    const existingPhone = await this.usersService.findByPhone(
      createUserDto.phone,
    );
    if (existingPhone) {
      throw new ConflictException('手机号已被注册');
    }

    // 验证邀请码
    const referrer = await this.usersService.findByInvitationCode(
      createUserDto.invitationCode,
    );
    if (!referrer) {
      // 允许 'ADMIN' 作为初始邀请码用于测试
      if (createUserDto.invitationCode !== 'ADMIN') {
        throw new BadRequestException('无效的邀请码');
      }
    }

    const user = await this.usersService.create(createUserDto);

    const payload = {
      sub: user.id,
      userNo: user.userNo,
      phone: user.phone,
    };

    return {
      success: true,
      message: '注册成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          userNo: user.userNo,
          phone: user.phone,
          balance: user.balance,
          silver: user.silver,
          reward: user.reward,
          invitationCode: user.invitationCode,
        },
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return {
      success: true,
      data: user,
    };
  }

  /**
   * 发送登录验证码
   */
  async sendLoginCode(phone: string, ip?: string) {
    // 检查手机号是否已注册
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('该手机号未注册');
    }

    return this.smsService.sendCode(
      { phone, type: SmsCodeType.LOGIN },
      ip,
    );
  }

  /**
   * 短信验证码登录
   */
  async loginWithSmsCode(phone: string, code: string) {
    // 验证手机号是否存在
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('该手机号未注册');
    }

    // 验证验证码
    const verifyResult = await this.smsService.verifyCode({
      phone,
      code,
      type: SmsCodeType.LOGIN,
    });

    if (!verifyResult.success) {
      throw new UnauthorizedException(verifyResult.message);
    }

    // 检查封禁状态
    if (user.isBanned) {
      const reason = user.banReason ? `：${user.banReason}` : '';
      throw new ForbiddenException(`账号已被封禁${reason}`);
    }

    // 生成 JWT
    const payload = {
      sub: user.id,
      userNo: user.userNo,
      phone: user.phone,
    };

    return {
      success: true,
      message: '登录成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          userNo: user.userNo,
          phone: user.phone,
          balance: user.balance,
          silver: user.silver,
          reward: user.reward,
          invitationCode: user.invitationCode,
        },
      },
    };
  }

  /**
   * 通过短信验证码重置密码
   */
  async resetPasswordWithSms(mobile: string, code: string, newPassword: string) {
    // 验证手机号是否存在
    const user = await this.usersService.findByPhone(mobile);
    if (!user) {
      throw new BadRequestException('该手机号未注册');
    }

    // 验证验证码
    const verifyResult = await this.smsService.verifyCode({
      phone: mobile,
      code,
      type: SmsCodeType.RESET_PASSWORD,
    });

    if (!verifyResult.success) {
      throw new BadRequestException(verifyResult.message || '验证码错误或已过期');
    }

    // 更新密码
    await this.usersService.updatePassword(user.id, newPassword);

    return {
      success: true,
      message: '密码重置成功',
      redirectUrl: '/login',
    };
  }
}
