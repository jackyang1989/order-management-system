import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { TaskClaimProcessor } from './task-claim.processor';
import { Task } from '../tasks/task.entity';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { BuyerAccount } from '../buyer-accounts/buyer-account.entity';

@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD || undefined,
            },
        }),
        BullModule.registerQueue({
            name: 'task-claim',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
            },
        }),
        TypeOrmModule.forFeature([Task, Order, User, BuyerAccount]),
    ],
    providers: [QueueService, TaskClaimProcessor],
    exports: [QueueService],
})
export class QueueModule { }
