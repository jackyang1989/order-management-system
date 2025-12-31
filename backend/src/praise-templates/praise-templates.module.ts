import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PraiseTemplatesService } from './praise-templates.service';
import { PraiseTemplatesController } from './praise-templates.controller';
import { PraiseTemplate } from './praise-template.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PraiseTemplate])],
    controllers: [PraiseTemplatesController],
    providers: [PraiseTemplatesService],
    exports: [PraiseTemplatesService],
})
export class PraiseTemplatesModule { }
