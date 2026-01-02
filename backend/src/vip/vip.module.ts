import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { VipPackage, VipPurchase } from './vip.entity';
import { VipRecord } from './vip-record.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([VipPackage, VipPurchase, VipRecord, User])],
    controllers: [VipController],
    providers: [VipService],
    exports: [VipService]
})
export class VipModule { }
