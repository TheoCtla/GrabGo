import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';

export type OrderDetail = Prisma.OrderGetPayload<{
  include: {
    items: true;
    payment: true;
    slot: true;
    snack: {
      include: {
        merchant: true;
      };
    };
    withdrawalCode: true;
    user: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

@Injectable()
export class OrderDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderByIdForUser(user: AuthenticatedUser, orderId: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true,
        payment: true,
        slot: true,
        snack: {
          include: {
            merchant: true
          }
        },
        withdrawalCode: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.ensureOrderCanBeViewedByUser(user, order);

    return order;
  }

  private ensureOrderCanBeViewedByUser(user: AuthenticatedUser, order: OrderDetail): void {
    if (user.role === Role.STUDENT) {
      if (order.userId !== user.id) {
        throw new ForbiddenException('Order does not belong to the current student');
      }

      return;
    }

    if (user.role === Role.MERCHANT) {
      if (order.snack.merchant.userId !== user.id) {
        throw new ForbiddenException('Snack does not belong to the current merchant');
      }

      return;
    }

    if (user.role === Role.ADMIN) {
      return;
    }

    throw new ForbiddenException('Order cannot be viewed by the current user');
  }
}
