import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantBankCard } from './merchant-bank-card.entity';
import { MerchantBankCardsService } from './merchant-bank-cards.service';
import { MerchantBankCardsController } from './merchant-bank-cards.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MerchantBankCard])],
    controllers: [MerchantBankCardsController],
    providers: [MerchantBankCardsService],
    exports: [MerchantBankCardsService]
})
export class MerchantBankCardsModule { }
