import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  PaymentStatus,
  Role,
  SlotStatus,
  SnackStatus,
  WithdrawalCode
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { MerchantOrdersQueryDto } from './dto/merchant-orders-query.dto';
import { StudentOrdersQueryDto } from './dto/student-orders-query.dto';
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { OrdersService } from './orders.service';
import { MerchantOrdersService } from './services/merchant-orders.service';
import { MerchantOrderStatusService } from './services/merchant-order-status.service';
import { OrderCreated, OrderCreationService } from './services/order-creation.service';
import { OrderDetailService } from './services/order-detail.service';
import { SimulatedPaymentService } from './services/simulated-payment.service';
import { StudentOrdersService } from './services/student-orders.service';
import { WithdrawalValidationService } from './services/withdrawal-validation.service';

type OrderCreationServiceMock = {
  createOrder: jest.Mock<Promise<unknown>, [string, CreateOrderDto]>;
};

type StudentOrdersServiceMock = {
  findStudentOrders: jest.Mock<Promise<unknown>, [string, StudentOrdersQueryDto]>;
};

type MerchantOrdersServiceMock = {
  findMerchantOrders: jest.Mock<Promise<unknown>, [string, MerchantOrdersQueryDto]>;
};

type OrderDetailServiceMock = {
  findOrderByIdForUser: jest.Mock<Promise<unknown>, [AuthenticatedUser, string]>;
};

type MerchantOrderStatusServiceMock = {
  updateMerchantOrderStatus: jest.Mock<Promise<unknown>, [string, string, OrderStatus]>;
};

type SimulatedPaymentServiceMock = {
  paySimulatedOrder: jest.Mock<Promise<unknown>, [string, string]>;
};

type WithdrawalValidationServiceMock = {
  validateWithdrawal: jest.Mock<Promise<unknown>, [string, ValidateWithdrawalDto]>;
};

describe('OrdersService', () => {
  let service: OrdersService;
  const now = new Date('2026-01-01T10:00:00.000Z');
  const merchantId = 'merchant-user-id';
  const studentId = 'student-id';
  const studentUser: AuthenticatedUser = {
    id: studentId,
    email: 'student@grabgo.test',
    role: Role.STUDENT
  };
  const dto: CreateOrderDto = {
    snackId: 'snack-id',
    slotId: 'slot-id',
    items: [
      {
        productId: 'product-id',
        quantity: 2
      }
    ]
  };
  const orderCreationServiceMock: OrderCreationServiceMock = {
    createOrder: jest.fn<Promise<unknown>, [string, CreateOrderDto]>()
  };
  const studentOrdersServiceMock: StudentOrdersServiceMock = {
    findStudentOrders: jest.fn<Promise<unknown>, [string, StudentOrdersQueryDto]>()
  };
  const merchantOrdersServiceMock: MerchantOrdersServiceMock = {
    findMerchantOrders: jest.fn<Promise<unknown>, [string, MerchantOrdersQueryDto]>()
  };
  const orderDetailServiceMock: OrderDetailServiceMock = {
    findOrderByIdForUser: jest.fn<Promise<unknown>, [AuthenticatedUser, string]>()
  };
  const merchantOrderStatusServiceMock: MerchantOrderStatusServiceMock = {
    updateMerchantOrderStatus: jest.fn<Promise<unknown>, [string, string, OrderStatus]>()
  };
  const simulatedPaymentServiceMock: SimulatedPaymentServiceMock = {
    paySimulatedOrder: jest.fn<Promise<unknown>, [string, string]>()
  };
  const withdrawalValidationServiceMock: WithdrawalValidationServiceMock = {
    validateWithdrawal: jest.fn<Promise<unknown>, [string, ValidateWithdrawalDto]>()
  };

  function createOrder(overrides: Partial<OrderCreated> = {}): OrderCreated {
    return {
      id: 'order-id',
      userId: studentId,
      snackId: dto.snackId,
      slotId: dto.slotId,
      status: OrderStatus.PENDING_PAYMENT,
      productsTotalCents: 900,
      serviceFeeCents: 49,
      totalCents: 949,
      customerFirstName: 'Ada',
      specialNote: null,
      pickupConfirmedAt: null,
      lateReportedAt: null,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: 'order-item-id',
          orderId: 'order-id',
          productId: 'product-id',
          productName: 'Sandwich',
          quantity: 2,
          unitPriceCents: 450,
          totalPriceCents: 900,
          specialNote: null,
          selectedOptions: null,
          createdAt: now,
          updatedAt: now
        }
      ],
      payment: {
        id: 'payment-id',
        orderId: 'order-id',
        status: PaymentStatus.PENDING,
        amountCents: 949,
        provider: 'simulated',
        providerPaymentId: null,
        paidAt: null,
        createdAt: now,
        updatedAt: now
      },
      slot: {
        id: 'slot-id',
        snackId: 'snack-id',
        startAt: new Date('2026-01-01T12:00:00.000Z'),
        endAt: new Date('2026-01-01T12:15:00.000Z'),
        capacity: 10,
        reservedCount: 4,
        status: SlotStatus.AVAILABLE,
        createdAt: now,
        updatedAt: now
      },
      snack: {
        id: 'snack-id',
        merchantId: 'merchant-id',
        campusId: 'campus-id',
        name: 'Snack Campus',
        description: null,
        status: SnackStatus.ONLINE,
        circuitBreaker: false,
        snoozedUntil: null,
        openingTime: null,
        closingTime: null,
        createdAt: now,
        updatedAt: now
      },
      withdrawalCode: null,
      ...overrides
    };
  }

  function createWithdrawalCode(overrides: Partial<WithdrawalCode> = {}): WithdrawalCode {
    return {
      id: 'withdrawal-code-id',
      orderId: 'order-id',
      code: '1234',
      qrToken: 'qr-token',
      usedAt: null,
      expiresAt: new Date('2026-01-01T14:15:00.000Z'),
      createdAt: now,
      updatedAt: now,
      ...overrides
    };
  }

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(now);
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrderCreationService,
          useValue: orderCreationServiceMock
        },
        {
          provide: StudentOrdersService,
          useValue: studentOrdersServiceMock
        },
        {
          provide: MerchantOrdersService,
          useValue: merchantOrdersServiceMock
        },
        {
          provide: OrderDetailService,
          useValue: orderDetailServiceMock
        },
        {
          provide: MerchantOrderStatusService,
          useValue: merchantOrderStatusServiceMock
        },
        {
          provide: SimulatedPaymentService,
          useValue: simulatedPaymentServiceMock
        },
        {
          provide: WithdrawalValidationService,
          useValue: withdrawalValidationServiceMock
        }
      ]
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delegates order creation to OrderCreationService', async () => {
    const order = createOrder();
    orderCreationServiceMock.createOrder.mockResolvedValue(order);

    await expect(service.createOrder(studentId, dto)).resolves.toEqual(order);
    expect(orderCreationServiceMock.createOrder).toHaveBeenCalledWith(studentId, dto);
  });

  it('delegates student order listing to StudentOrdersService', async () => {
    const query: StudentOrdersQueryDto = {
      status: OrderStatus.CONFIRMED
    };
    const orders = [createOrder({ status: query.status })];
    studentOrdersServiceMock.findStudentOrders.mockResolvedValue(orders);

    await expect(service.findStudentOrders(studentId, query)).resolves.toEqual(orders);
    expect(studentOrdersServiceMock.findStudentOrders).toHaveBeenCalledWith(studentId, query);
  });

  it('delegates merchant order listing to MerchantOrdersService', async () => {
    const query: MerchantOrdersQueryDto = {
      snackId: 'snack-id'
    };
    const orders = [createOrder()];
    merchantOrdersServiceMock.findMerchantOrders.mockResolvedValue(orders);

    await expect(service.findMerchantOrders(merchantId, query)).resolves.toEqual(orders);
    expect(merchantOrdersServiceMock.findMerchantOrders).toHaveBeenCalledWith(merchantId, query);
  });

  it('delegates order detail lookup to OrderDetailService', async () => {
    const order = createOrder();
    orderDetailServiceMock.findOrderByIdForUser.mockResolvedValue(order);

    await expect(service.findOrderByIdForUser(studentUser, 'order-id')).resolves.toEqual(order);
    expect(orderDetailServiceMock.findOrderByIdForUser).toHaveBeenCalledWith(
      studentUser,
      'order-id'
    );
  });

  it('delegates merchant order status updates to MerchantOrderStatusService', async () => {
    const order = createOrder({
      status: OrderStatus.READY
    });
    merchantOrderStatusServiceMock.updateMerchantOrderStatus.mockResolvedValue(order);

    await expect(
      service.updateMerchantOrderStatus(merchantId, 'order-id', OrderStatus.READY)
    ).resolves.toEqual(order);
    expect(merchantOrderStatusServiceMock.updateMerchantOrderStatus).toHaveBeenCalledWith(
      merchantId,
      'order-id',
      OrderStatus.READY
    );
  });

  it('delegates simulated payment to SimulatedPaymentService', async () => {
    const paidOrder = createOrder({
      status: OrderStatus.CONFIRMED,
      withdrawalCode: createWithdrawalCode()
    });
    simulatedPaymentServiceMock.paySimulatedOrder.mockResolvedValue(paidOrder);

    await expect(service.paySimulatedOrder(studentId, 'order-id')).resolves.toEqual(paidOrder);
    expect(simulatedPaymentServiceMock.paySimulatedOrder).toHaveBeenCalledWith(
      studentId,
      'order-id'
    );
  });

  it('delegates withdrawal validation to WithdrawalValidationService', async () => {
    const dto: ValidateWithdrawalDto = {
      qrToken: 'qr-token'
    };
    const completedOrder = createOrder({
      status: OrderStatus.COMPLETED,
      pickupConfirmedAt: now,
      withdrawalCode: createWithdrawalCode({
        usedAt: now
      })
    });
    withdrawalValidationServiceMock.validateWithdrawal.mockResolvedValue(completedOrder);

    await expect(service.validateWithdrawal(merchantId, dto)).resolves.toEqual(completedOrder);
    expect(withdrawalValidationServiceMock.validateWithdrawal).toHaveBeenCalledWith(
      merchantId,
      dto
    );
  });
});
