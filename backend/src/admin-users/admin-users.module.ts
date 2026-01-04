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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AdminRole,
      AdminPermission,
      AdminOperationLog,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'order-mgmt-jwt-secret-2026',
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
