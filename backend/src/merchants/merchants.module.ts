import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Merchant } from './merchant.entity';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { MerchantsAdminController } from './merchants-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { AdminConfigModule } from '../admin-config/admin-config.module';

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
    TypeOrmModule.forFeature([Merchant]),
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '7d' },
    }),
    FinanceRecordsModule,
    AdminConfigModule,
  ],
  providers: [MerchantsService],
  controllers: [MerchantsController, MerchantsAdminController],
  exports: [MerchantsService],
})
export class MerchantsModule { }
