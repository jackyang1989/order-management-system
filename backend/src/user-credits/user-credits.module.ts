import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCredit, CreditLog, CreditLevelConfig } from './user-credit.entity';
import { UserCreditsService } from './user-credits.service';
import { UserCreditsController } from './user-credits.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCredit, CreditLog, CreditLevelConfig]),
  ],
  controllers: [UserCreditsController],
  providers: [UserCreditsService],
  exports: [UserCreditsService],
})
export class UserCreditsModule {}
