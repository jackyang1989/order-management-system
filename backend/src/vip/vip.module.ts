import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { VipPackage, VipPurchase, RechargeOrder } from './vip.entity';
// VipRecord removed
import { User } from '../users/user.entity';
import { FundRecord } from '../users/fund-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VipPackage,
      VipPurchase,
      RechargeOrder,
      User,
      FundRecord,
    ]),
  ],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule { }
