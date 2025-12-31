import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskDraftsService } from './task-drafts.service';
import { TaskDraftsController } from './task-drafts.controller';
import { TaskDraft } from './task-draft.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { SystemConfig } from '../system-config/system-config.entity';
import { DingdanxiaModule } from '../dingdanxia/dingdanxia.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TaskDraft, Task, User, SystemConfig]),
        DingdanxiaModule,
    ],
    controllers: [TaskDraftsController],
    providers: [TaskDraftsService],
    exports: [TaskDraftsService],
})
export class TaskDraftsModule { }
