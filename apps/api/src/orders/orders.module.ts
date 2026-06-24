import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderCreationService } from './services/order-creation.service';
import { OrderDetailService } from './services/order-detail.service';
import { SimulatedPaymentService } from './services/simulated-payment.service';
import { StudentOrdersService } from './services/student-orders.service';
import { WithdrawalCodeService } from './services/withdrawal-code.service';
import { WithdrawalValidationService } from './services/withdrawal-validation.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderCreationService,
    StudentOrdersService,
    MerchantOrdersService,
    OrderDetailService,
    MerchantOrderStatusService,
    SimulatedPaymentService,
    WithdrawalCodeService,
    WithdrawalValidationService
  ]
})
export class OrdersModule {}
