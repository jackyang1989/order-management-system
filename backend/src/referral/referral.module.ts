import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { ReferralReward } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { SystemConfig } from '../admin-config/config.entity';
import { FinanceRecord } from '../finance-records/finance-record.entity';
import { UserInvite } from '../user-invites/user-invite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReferralReward,
      User,
      SystemConfig,
      FinanceRecord,
      UserInvite,
    ]),
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
