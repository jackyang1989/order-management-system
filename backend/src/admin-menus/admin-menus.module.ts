import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminMenu } from './admin-menu.entity';
import { AdminMenusService } from './admin-menus.service';
import { AdminMenusController } from './admin-menus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminMenu])],
  controllers: [AdminMenusController],
  providers: [AdminMenusService],
  exports: [AdminMenusService],
})
export class AdminMenusModule {}
