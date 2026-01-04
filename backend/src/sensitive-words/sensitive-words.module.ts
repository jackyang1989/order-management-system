import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveWord, SensitiveWordLog } from './sensitive-word.entity';
import { SensitiveWordsService } from './sensitive-words.service';
import { SensitiveWordsController } from './sensitive-words.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SensitiveWord, SensitiveWordLog])],
  controllers: [SensitiveWordsController],
  providers: [SensitiveWordsService],
  exports: [SensitiveWordsService],
})
export class SensitiveWordsModule {}
