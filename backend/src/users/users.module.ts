import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminService } from './users-admin.service';
import { UsersAdminController } from './users-admin.controller';
import { User } from './user.entity';
import { FundRecord } from './fund-record.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, FundRecord, Order])],
  providers: [UsersService, UsersAdminService],
  controllers: [UsersController, UsersAdminController],
  exports: [UsersService, UsersAdminService],
})
export class UsersModule {}
