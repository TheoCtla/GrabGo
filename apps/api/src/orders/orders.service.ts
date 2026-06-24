import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { MerchantOrdersQueryDto } from './dto/merchant-orders-query.dto';
import { StudentOrdersQueryDto } from './dto/student-orders-query.dto';
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderCreated, OrderCreationService } from './services/order-creation.service';
import { OrderDetailService } from './services/order-detail.service';
import { SimulatedPaymentService } from './services/simulated-payment.service';
import { StudentOrdersService } from './services/student-orders.service';
import { WithdrawalValidationService } from './services/withdrawal-validation.service';

type StudentOrderListItem = OrderCreated;

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderCreationService: OrderCreationService,
    private readonly studentOrdersService: StudentOrdersService,
    private readonly merchantOrdersService: MerchantOrdersService,
    private readonly orderDetailService: OrderDetailService,
    private readonly merchantOrderStatusService: MerchantOrderStatusService,
    private readonly simulatedPaymentService: SimulatedPaymentService,
    private readonly withdrawalValidationService: WithdrawalValidationService
  ) {}

  async createOrder(studentId: string, dto: CreateOrderDto): Promise<OrderCreated> {
    return this.orderCreationService.createOrder(studentId, dto);
  }

  async findStudentOrders(
    studentId: string,
    query: StudentOrdersQueryDto
  ): Promise<StudentOrderListItem[]> {
    return this.studentOrdersService.findStudentOrders(studentId, query);
  }

  async findMerchantOrders(
    merchantId: string,
    query: MerchantOrdersQueryDto
  ): ReturnType<MerchantOrdersService['findMerchantOrders']> {
    return this.merchantOrdersService.findMerchantOrders(merchantId, query);
  }

  async findOrderByIdForUser(
    user: AuthenticatedUser,
    orderId: string
  ): ReturnType<OrderDetailService['findOrderByIdForUser']> {
    return this.orderDetailService.findOrderByIdForUser(user, orderId);
  }

  async paySimulatedOrder(studentId: string, orderId: string): Promise<OrderCreated> {
    return this.simulatedPaymentService.paySimulatedOrder(studentId, orderId);
  }

  async validateWithdrawal(merchantId: string, dto: ValidateWithdrawalDto): Promise<OrderCreated> {
    return this.withdrawalValidationService.validateWithdrawal(merchantId, dto);
  }

  async updateMerchantOrderStatus(
    merchantId: string,
    orderId: string,
    status: OrderStatus
  ): ReturnType<MerchantOrderStatusService['updateMerchantOrderStatus']> {
    return this.merchantOrderStatusService.updateMerchantOrderStatus(merchantId, orderId, status);
  }
}
