import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInvite, InviteCode, InviteRewardConfig } from './user-invite.entity';
import { UserInvitesService } from './user-invites.service';
import { UserInvitesController } from './user-invites.controller';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserInvite, InviteCode, InviteRewardConfig]),
        FinanceRecordsModule,
    ],
    controllers: [UserInvitesController],
    providers: [UserInvitesService],
    exports: [UserInvitesService]
})
export class UserInvitesModule { }
