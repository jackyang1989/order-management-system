import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { OrdersModule } from './orders/orders.module';
import { BuyerAccountsModule } from './buyer-accounts/buyer-accounts.module';
import { BankCardsModule } from './bank-cards/bank-cards.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: 'order_management',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 开发环境自动同步表结构
      logging: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    OrdersModule,
    BuyerAccountsModule,
    BankCardsModule,
    WithdrawalsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
