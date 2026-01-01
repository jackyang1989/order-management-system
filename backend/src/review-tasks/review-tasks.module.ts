import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewTask } from './review-task.entity';
import { ReviewTasksService } from './review-tasks.service';
import { ReviewTasksController } from './review-tasks.controller';
import { UsersModule } from '../users/users.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReviewTask]),
        forwardRef(() => UsersModule),
        forwardRef(() => MerchantsModule),
        FinanceRecordsModule,
    ],
    providers: [ReviewTasksService],
    controllers: [ReviewTasksController],
    exports: [ReviewTasksService]
})
export class ReviewTasksModule { }
