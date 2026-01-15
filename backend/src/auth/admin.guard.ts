import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export const ADMIN_KEY = 'isAdmin';
export const PERMISSIONS_KEY = 'permissions';

// 装饰器：标记需要管理员权限
export function AdminOnly() {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(ADMIN_KEY, true, descriptor?.value || target);
    return descriptor || target;
  };
}

// 装饰器：标记需要特定权限
export function RequirePermissions(...permissions: string[]) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      PERMISSIONS_KEY,
      permissions,
      descriptor?.value || target,
    );
    return descriptor || target;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未提供有效的认证令牌');
    }

    const token = authHeader.substring(7);

    try {
      // P0-1: 安全获取 JWT 密钥
      const jwtSecret = process.env.JWT_SECRET ||
        (process.env.NODE_ENV === 'production'
          ? (() => { throw new Error('[SECURITY] JWT_SECRET 未配置'); })()
          : 'dev-only-jwt-secret-do-not-use-in-production');

      const payload = this.jwtService.verify(token, {
        secret: jwtSecret,
      });

      // 检查是否是管理员用户
      if (!payload.isAdmin && !payload.adminId) {
        throw new ForbiddenException('需要管理员权限');
      }

      // 检查是否需要特定权限
      const requiredPermissions = this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler(),
      );

      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = payload.permissions || [];

        // 超级管理员拥有所有权限
        if (
          payload.roleName === 'super_admin' ||
          payload.roleName === '超级管理员' ||
          payload.isSuperAdmin
        ) {
          request.admin = payload;
          return true;
        }

        // 检查通配符权限
        if (userPermissions.includes('*')) {
          request.admin = payload;
          return true;
        }

        const hasPermission = requiredPermissions.every((perm) =>
          userPermissions.includes(perm),
        );

        if (!hasPermission) {
          throw new ForbiddenException('权限不足');
        }
      }

      // 将管理员信息附加到请求对象
      request.admin = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('无效的认证令牌');
    }
  }
}
