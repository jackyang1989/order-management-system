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

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await this.usersService.validatePassword(user, password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    // 支持手机号或用户名登录
    let user: any = null;
    if (loginDto.phone) {
      user = await this.usersService.findByPhone(loginDto.phone);
    }
    if (!user && loginDto.username) {
      user = await this.usersService.findByUsername(loginDto.username);
    }

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      phone: user.phone,
    };

    return {
      success: true,
      message: '登录成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          vip: user.vip,
          vipExpireAt: user.vipExpireAt,
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

    // 检查用户名是否已存在
    const existingUser = await this.usersService.findByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('用户名已存在');
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
      username: user.username,
      phone: user.phone,
    };

    return {
      success: true,
      message: '注册成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          vip: user.vip,
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

    // 生成 JWT
    const payload = {
      sub: user.id,
      username: user.username,
      phone: user.phone,
    };

    return {
      success: true,
      message: '登录成功',
      data: {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          vip: user.vip,
          vipExpireAt: user.vipExpireAt,
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
