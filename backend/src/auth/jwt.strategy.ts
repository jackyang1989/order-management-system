import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
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

// P1-4: 从 cookie 或 Authorization header 中提取 JWT token
const extractJwtFromRequest = (req: Request): string | null => {
  // 优先从 cookie 中读取（httpOnly cookie）
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  // 兼容旧版：从 Authorization header 中读取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: any) {
    // P1-1: VIP过期自动降级检查
    // INVARIANT: 所有受保护接口必须经过 VIP 过期检查
    if (payload.sub && !payload.isAdmin && !payload.merchantId) {
      await this.checkAndDowngradeVip(payload.sub);
    }

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

  /**
   * P1-1: VIP过期自动降级
   * 每天最多1次DB写入，多实例安全
   */
  private async checkAndDowngradeVip(userId: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) return;

      // 如果不是VIP，跳过检查
      if (!user.vip) return;

      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // 检查VIP是否过期
      if (user.vipExpireAt && new Date(user.vipExpireAt) < now) {
        // 检查今天是否已经执行过降级（避免重复写入）
        if (user.lastVipCheckAt !== today) {
          user.vip = false;
          user.lastVipCheckAt = today;
          await this.usersRepository.save(user);
        }
      }
    } catch (error) {
      // 静默失败，不影响正常请求
      console.error('VIP过期检查失败:', error);
    }
  }
}
