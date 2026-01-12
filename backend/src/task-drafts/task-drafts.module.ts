import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDraftsService } from './task-drafts.service';
import { TaskDraftsController } from './task-drafts.controller';
import { TaskDraft } from './task-draft.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { DingdanxiaModule } from '../dingdanxia/dingdanxia.module';
import { AdminConfigModule } from '../admin-config/admin-config.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskDraft, Task, User]),
        DingdanxiaModule,
        AdminConfigModule,
    ],
    controllers: [TaskDraftsController],
    providers: [TaskDraftsService],
    exports: [TaskDraftsService],
})
export class TaskDraftsModule { }
