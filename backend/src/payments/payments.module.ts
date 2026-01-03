import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentCallback, PaymentOrder } from './payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayService } from './payment-gateway.service';

@Module({
    imports: [TypeOrmModule.forFeature([PaymentCallback, PaymentOrder])],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaymentGatewayService],
    exports: [PaymentsService, PaymentGatewayService]
})
export class PaymentsModule { }
