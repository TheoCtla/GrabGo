import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SIMULATED_PAYMENT_PROVIDER } from '../constants/order-payment.constants';
import { WithdrawalCodeService } from './withdrawal-code.service';

type PayableOrder = Prisma.OrderGetPayload<{
  include: {
    payment: true;
    slot: true;
    withdrawalCode: true;
  };
}>;

export type SimulatedPaidOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

@Injectable()
export class SimulatedPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly withdrawalCodeService: WithdrawalCodeService
  ) {}

  async paySimulatedOrder(studentId: string, orderId: string): Promise<SimulatedPaidOrder> {
    const now = new Date();
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        slot: true,
        withdrawalCode: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.ensureOrderCanBePaid(order, studentId);

    return this.prisma.$transaction(async (tx) => {
      const paymentUpdate = await tx.payment.updateMany({
        where: {
          orderId,
          provider: SIMULATED_PAYMENT_PROVIDER,
          status: PaymentStatus.PENDING,
          order: {
            userId: studentId,
            status: OrderStatus.PENDING_PAYMENT
          }
        },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now
        }
      });

      if (paymentUpdate.count !== 1) {
        throw new BadRequestException('Payment cannot be completed');
      }

      const orderUpdate = await tx.order.updateMany({
        where: {
          id: orderId,
          userId: studentId,
          status: OrderStatus.PENDING_PAYMENT,
          payment: {
            status: PaymentStatus.PAID
          }
        },
        data: {
          status: OrderStatus.CONFIRMED
        }
      });

      if (orderUpdate.count !== 1) {
        throw new BadRequestException('Order cannot be confirmed');
      }

      await this.withdrawalCodeService.generateWithdrawalCodeForOrder(tx, order);

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payment: true,
          slot: true,
          snack: true,
          withdrawalCode: true
        }
      });

      if (!updatedOrder) {
        throw new NotFoundException('Order not found');
      }

      return updatedOrder;
    });
  }

  private ensureOrderCanBePaid(order: PayableOrder, studentId: string): void {
    if (order.userId !== studentId) {
      throw new ForbiddenException('Order does not belong to the current student');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not payable');
    }

    if (!order.payment) {
      throw new BadRequestException('Payment is missing');
    }

    if (order.payment.provider !== SIMULATED_PAYMENT_PROVIDER) {
      throw new BadRequestException('Payment provider is not simulated');
    }

    if (order.payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending');
    }
  }
}
