import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            return false;
        }

        // 支持多种角色判断方式
        return requiredRoles.some((role) => {
            // 检查 role 字段
            if (user.role === role) return true;
            // 检查 roles 数组
            if (user.roles?.includes(role)) return true;
            // 检查 isAdmin 标志（用于管理员）
            if (role === 'admin' && user.isAdmin === true) return true;
            // 检查 isSuperAdmin 标志
            if (role === 'superadmin' && user.isSuperAdmin === true) return true;
            return false;
        });
    }
}
