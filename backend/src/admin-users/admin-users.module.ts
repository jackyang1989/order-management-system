import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
} from './admin-user.entity';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';

// P0-1: 安全获取 JWT 密钥
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('[SECURITY] JWT_SECRET 环境变量未配置！');
  }
  return secret || 'dev-only-jwt-secret-do-not-use-in-production';
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AdminRole,
      AdminPermission,
      AdminOperationLog,
    ]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule implements OnModuleInit {
  constructor(private adminUsersService: AdminUsersService) { }

  async onModuleInit() {
    // 初始化超级管理员账号
    await this.adminUsersService.initSuperAdmin();
    // 初始化默认权限
    await this.adminUsersService.initDefaultPermissions();
  }
}
