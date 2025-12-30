import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TasksModule } from '../tasks/tasks.module';
import { BuyerAccountsModule } from '../buyer-accounts/buyer-accounts.module';
import { Order } from './order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order]),
        forwardRef(() => TasksModule),
        BuyerAccountsModule
    ],
    providers: [OrdersService],
    controllers: [OrdersController],
    exports: [OrdersService]
})
export class OrdersModule { }
