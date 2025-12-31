import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewTask } from './review-task.entity';
import { ReviewTasksService } from './review-tasks.service';
import { ReviewTasksController } from './review-tasks.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ReviewTask])],
    providers: [ReviewTasksService],
    controllers: [ReviewTasksController],
    exports: [ReviewTasksService]
})
export class ReviewTasksModule { }
