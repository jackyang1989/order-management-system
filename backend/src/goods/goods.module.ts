import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goods } from './goods.entity';
import { GoodsKey, GoodsKeyWorld } from './goods-key.entity';
import { GoodsService } from './goods.service';
import { GoodsController } from './goods.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Goods, GoodsKey, GoodsKeyWorld])],
    controllers: [GoodsController],
    providers: [GoodsService],
    exports: [GoodsService],
})
export class GoodsModule { }
