import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'order-mgmt-jwt-secret-2026',
    });
  }

  async validate(payload: any) {
    // P1-1: VIP过期自动降级检查
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
