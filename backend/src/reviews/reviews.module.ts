import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewTasksModule } from '../review-tasks/review-tasks.module';

@Module({
  imports: [ReviewTasksModule],
  controllers: [ReviewsController],
})
export class ReviewsModule {}
