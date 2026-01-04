import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, LoginDto } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
}
