import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerAccountsService } from './buyer-accounts.service';
import { BuyerAccountsController } from './buyer-accounts.controller';
import { BuyerAccount } from './buyer-account.entity';

import { UsersModule } from '../users/users.module';
import { AdminConfigModule } from '../admin-config/admin-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerAccount]), UsersModule, AdminConfigModule],
  providers: [BuyerAccountsService],
  controllers: [BuyerAccountsController],
  exports: [BuyerAccountsService],
})
export class BuyerAccountsModule { }
