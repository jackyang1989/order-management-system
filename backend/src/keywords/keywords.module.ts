import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsKey, KeywordDetail } from './keyword.entity';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';

@Module({
    imports: [TypeOrmModule.forFeature([GoodsKey, KeywordDetail])],
    controllers: [KeywordsController],
    providers: [KeywordsService],
    exports: [KeywordsService],
})
export class KeywordsModule { }
