import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'tfkz-order-management-secret-key-2026',
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
