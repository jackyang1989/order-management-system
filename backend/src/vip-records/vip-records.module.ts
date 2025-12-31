import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipRecord, VipLevelConfig, UserVipStatus } from './vip-record.entity';
import { VipRecordsService } from './vip-records.service';
import { VipRecordsController } from './vip-records.controller';

@Module({
    imports: [TypeOrmModule.forFeature([VipRecord, VipLevelConfig, UserVipStatus])],
    controllers: [VipRecordsController],
    providers: [VipRecordsService],
    exports: [VipRecordsService]
})
export class VipRecordsModule { }
