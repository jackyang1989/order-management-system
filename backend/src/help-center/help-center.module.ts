import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpArticle } from './help-article.entity';
import { HelpCenterService } from './help-center.service';
import {
  HelpCenterController,
  HelpCenterAdminController,
} from './help-center.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HelpArticle])],
  controllers: [HelpCenterController, HelpCenterAdminController],
  providers: [HelpCenterService],
  exports: [HelpCenterService],
})
export class HelpCenterModule {}
