import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDayCount, PlatformDayStat } from './day-count.entity';
import { DayCountsService } from './day-counts.service';
import { DayCountsController } from './day-counts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserDayCount, PlatformDayStat])],
  controllers: [DayCountsController],
  providers: [DayCountsService],
  exports: [DayCountsService],
})
export class DayCountsModule {}
