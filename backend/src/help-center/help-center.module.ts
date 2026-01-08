import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpArticle } from './help-article.entity';
import { HelpCenterService } from './help-center.service';
import {
  HelpCenterController,
  HelpCenterAdminController,
} from './help-center.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([HelpArticle]), AuthModule],
  controllers: [HelpCenterController, HelpCenterAdminController],
  providers: [HelpCenterService],
  exports: [HelpCenterService],
})
export class HelpCenterModule { }
