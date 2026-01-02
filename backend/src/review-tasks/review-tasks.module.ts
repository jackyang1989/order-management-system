import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewTask, ReviewTaskPraise } from './review-task.entity';
import { Order } from '../orders/order.entity';
import { ReviewTasksService } from './review-tasks.service';
import { ReviewTasksController } from './review-tasks.controller';
import { UsersModule } from '../users/users.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ReviewTask, ReviewTaskPraise, Order]),
        forwardRef(() => UsersModule),
        forwardRef(() => MerchantsModule),
        forwardRef(() => MessagesModule),
        FinanceRecordsModule,
    ],
    providers: [ReviewTasksService],
    controllers: [ReviewTasksController],
    exports: [ReviewTasksService]
})
export class ReviewTasksModule { }
