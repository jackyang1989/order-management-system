import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantBlacklistService } from './merchant-blacklist.service';
import { MerchantBlacklistController } from './merchant-blacklist.controller';
import { MerchantBlacklist } from './merchant-blacklist.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantBlacklist]), AuthModule],
  providers: [MerchantBlacklistService],
  controllers: [MerchantBlacklistController],
  exports: [MerchantBlacklistService],
})
export class MerchantBlacklistModule {}
