import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goods } from './goods.entity';
// GoodsKey 已迁移到 keywords 模块 (src/keywords/keyword.entity.ts)
import { GoodsService } from './goods.service';
import { GoodsController } from './goods.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Goods])],
    controllers: [GoodsController],
    providers: [GoodsService],
    exports: [GoodsService],
})
export class GoodsModule { }
