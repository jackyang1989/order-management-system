import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { SmsModule } from '../sms/sms.module';

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
    UsersModule,
    PassportModule,
    SmsModule,
    TypeOrmModule.forFeature([User]), // P1-1: 用于JwtStrategy中的VIP过期检查
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [AuthService, JwtStrategy, AdminGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, AdminGuard],
})
export class AuthModule {}
