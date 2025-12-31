import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionRate } from './commission-rate.entity';
import { CommissionRatesService } from './commission-rates.service';
import { CommissionRatesController } from './commission-rates.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CommissionRate])],
    providers: [CommissionRatesService],
    controllers: [CommissionRatesController],
    exports: [CommissionRatesService],
})
export class CommissionRatesModule { }
