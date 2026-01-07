import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerAccountsService } from './buyer-accounts.service';
import { BuyerAccountsController } from './buyer-accounts.controller';
import { BuyerAccount } from './buyer-account.entity';

import { UsersModule } from '../users/users.module';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerAccount]), UsersModule, SystemConfigModule],
  providers: [BuyerAccountsService],
  controllers: [BuyerAccountsController],
  exports: [BuyerAccountsService],
})
export class BuyerAccountsModule { }
