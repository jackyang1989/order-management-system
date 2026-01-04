import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';
import { UserInvite } from '../user-invites/user-invite.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserInvite, User, Order])],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
