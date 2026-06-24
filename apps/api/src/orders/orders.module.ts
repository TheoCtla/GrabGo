import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { OrderDetailService } from './services/order-detail.service';
import { StudentOrdersService } from './services/student-orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, StudentOrdersService, MerchantOrdersService, OrderDetailService]
})
export class OrdersModule {}
