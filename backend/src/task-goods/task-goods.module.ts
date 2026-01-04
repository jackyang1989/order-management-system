import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGoods, TaskKeyword } from './task-goods.entity';
import { TaskGoodsService } from './task-goods.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskGoods, TaskKeyword])],
  providers: [TaskGoodsService],
  exports: [TaskGoodsService],
})
export class TaskGoodsModule {}
