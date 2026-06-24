import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderDetailService } from './services/order-detail.service';
import { StudentOrdersService } from './services/student-orders.service';
import { WithdrawalCodeService } from './services/withdrawal-code.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    StudentOrdersService,
    MerchantOrdersService,
    OrderDetailService,
    MerchantOrderStatusService,
    WithdrawalCodeService
  ]
})
export class OrdersModule {}
