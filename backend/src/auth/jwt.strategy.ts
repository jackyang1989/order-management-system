import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

// P0-1: 安全检查 - 确保 JWT_SECRET 环境变量已配置
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // 生产环境必须配置 JWT_SECRET
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY] JWT_SECRET 环境变量未配置！生产环境必须设置强随机密钥（至少256位）',
      );
    }
    // 开发环境使用默认密钥并警告
    console.warn(
      '[SECURITY WARNING] JWT_SECRET 未配置，使用开发环境默认密钥。请勿在生产环境使用！',
    );
    return 'dev-only-jwt-secret-do-not-use-in-production';
  }
  // 检查密钥强度（至少32字符 = 256位）
  if (secret.length < 32) {
    console.warn(
      '[SECURITY WARNING] JWT_SECRET 长度不足32字符，建议使用更强的密钥',
    );
  }
  return secret;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.username,
      phone: payload.phone,
      // 管理员相关字段
      isAdmin: payload.isAdmin,
      isSuperAdmin: payload.isSuperAdmin,
      adminId: payload.adminId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions,
      // 商家相关字段
      merchantId: payload.merchantId,
      role: payload.role,
    };
  }
}
