import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantBlacklistService } from './merchant-blacklist.service';
import { MerchantBlacklistController } from './merchant-blacklist.controller';
import { AdminBlacklistController } from './admin-blacklist.controller';
import { MerchantBlacklist } from './merchant-blacklist.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantBlacklist]), AuthModule],
  providers: [MerchantBlacklistService],
  controllers: [MerchantBlacklistController, AdminBlacklistController],
  exports: [MerchantBlacklistService],
})
export class MerchantBlacklistModule {}
