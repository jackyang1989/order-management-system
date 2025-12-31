import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { ReferralReward } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { SystemConfig } from '../system-config/system-config.entity';
import { FinanceRecord } from '../finance-records/finance-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ReferralReward, User, SystemConfig, FinanceRecord])],
    controllers: [ReferralController],
    providers: [ReferralService],
    exports: [ReferralService],
})
export class ReferralModule { }
