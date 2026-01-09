import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankCardsService } from './bank-cards.service';
import { BankCardsController } from './bank-cards.controller';
import { BankCard } from './bank-card.entity';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankCard, User, Merchant]), AuthModule],
  providers: [BankCardsService],
  controllers: [BankCardsController],
  exports: [BankCardsService],
})
export class BankCardsModule {}
