import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerAccountsService } from './buyer-accounts.service';
import { BuyerAccountsController } from './buyer-accounts.controller';
import { BuyerAccount } from './buyer-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerAccount])],
  providers: [BuyerAccountsService],
  controllers: [BuyerAccountsController],
  exports: [BuyerAccountsService],
})
export class BuyerAccountsModule {}
