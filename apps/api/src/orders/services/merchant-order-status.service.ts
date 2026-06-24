import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_WITHDRAWAL_ORDER_STATUSES } from '../constants/order-status.constants';
const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.EXPIRED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED
];
const MERCHANT_ORDER_TARGET_STATUSES: OrderStatus[] = [
  OrderStatus.WAITING_PULL_CONFIRMATION,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.LATE
];
const MERCHANT_ORDER_STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.CONFIRMED]: [OrderStatus.WAITING_PULL_CONFIRMATION, OrderStatus.PREPARING],
  [OrderStatus.WAITING_PULL_CONFIRMATION]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.LATE],
  [OrderStatus.LATE]: [OrderStatus.READY]
};

type MerchantOrder = Prisma.OrderGetPayload<{
  include: {
    snack: {
      include: {
        merchant: true;
      };
    };
  };
}>;

export type MerchantUpdatedOrder = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: true;
    withdrawalCode: true;
  };
}>;

@Injectable()
export class MerchantOrderStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMerchantOrderStatus(
    merchantId: string,
    orderId: string,
    status: OrderStatus
  ): Promise<MerchantUpdatedOrder> {
    this.ensureMerchantOrderTargetStatusIsAllowed(status);

    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        snack: {
          include: {
            merchant: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.ensureMerchantCanUpdateOrder(order, merchantId);
    this.ensureMerchantOrderTransitionIsAllowed(order.status, status);

    const orderUpdate = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: order.status,
        AND: [
          {
            status: {
              in: ACTIVE_WITHDRAWAL_ORDER_STATUSES
            }
          }
        ],
        snack: {
          merchant: {
            userId: merchantId
          }
        }
      },
      data: {
        status
      }
    });

    if (orderUpdate.count !== 1) {
      throw new BadRequestException('Order status can no longer be updated');
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: {
        id: orderId
      },
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
  }

  private ensureMerchantOrderTargetStatusIsAllowed(status: OrderStatus): void {
    if (!MERCHANT_ORDER_TARGET_STATUSES.includes(status)) {
      throw new BadRequestException('Order status cannot be set by merchant');
    }
  }

  private ensureMerchantCanUpdateOrder(order: MerchantOrder, merchantId: string): void {
    if (order.snack.merchant.userId !== merchantId) {
      throw new ForbiddenException('Snack does not belong to the current merchant');
    }

    if (TERMINAL_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('Order is terminal');
    }

    if (!ACTIVE_WITHDRAWAL_ORDER_STATUSES.includes(order.status)) {
      throw new BadRequestException('Order is not confirmed');
    }
  }

  private ensureMerchantOrderTransitionIsAllowed(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus
  ): void {
    const allowedNextStatuses = MERCHANT_ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(nextStatus)) {
      throw new BadRequestException('Invalid order status transition');
    }
  }
}
