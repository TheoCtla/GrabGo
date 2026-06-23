import { OrderStatus, Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { MerchantOrdersQueryDto } from './dto/merchant-orders-query.dto';
import { StudentOrdersQueryDto } from './dto/student-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

type OrdersServiceMock = {
  createOrder: jest.Mock<Promise<unknown>, [string, CreateOrderDto]>;
  findOrderByIdForUser: jest.Mock<Promise<unknown>, [AuthenticatedUser, string]>;
  findMerchantOrders: jest.Mock<Promise<unknown>, [string, MerchantOrdersQueryDto]>;
  findStudentOrders: jest.Mock<Promise<unknown>, [string, StudentOrdersQueryDto]>;
  paySimulatedOrder: jest.Mock<Promise<unknown>, [string, string]>;
  updateMerchantOrderStatus: jest.Mock<Promise<unknown>, [string, string, OrderStatus]>;
  validateWithdrawal: jest.Mock<Promise<unknown>, [string, ValidateWithdrawalDto]>;
};

describe('OrdersController', () => {
  const user: AuthenticatedUser = {
    id: 'student-id',
    email: 'student@grabgo.test',
    role: Role.STUDENT
  };
  const ordersService: OrdersServiceMock = {
    createOrder: jest.fn<Promise<unknown>, [string, CreateOrderDto]>(),
    findOrderByIdForUser: jest.fn<Promise<unknown>, [AuthenticatedUser, string]>(),
    findMerchantOrders: jest.fn<Promise<unknown>, [string, MerchantOrdersQueryDto]>(),
    findStudentOrders: jest.fn<Promise<unknown>, [string, StudentOrdersQueryDto]>(),
    paySimulatedOrder: jest.fn<Promise<unknown>, [string, string]>(),
    updateMerchantOrderStatus: jest.fn<Promise<unknown>, [string, string, OrderStatus]>(),
    validateWithdrawal: jest.fn<Promise<unknown>, [string, ValidateWithdrawalDto]>()
  };
  const controller = new OrdersController(ordersService as unknown as OrdersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls OrdersService.createOrder with the current user id', async () => {
    const dto: CreateOrderDto = {
      snackId: 'snack-id',
      slotId: 'slot-id',
      items: [
        {
          productId: 'product-id',
          quantity: 1
        }
      ]
    };
    const order = { id: 'order-id' };
    ordersService.createOrder.mockResolvedValue(order);

    await expect(controller.createOrder(user, dto)).resolves.toEqual(order);
    expect(ordersService.createOrder).toHaveBeenCalledWith(user.id, dto);
  });

  it('calls OrdersService.findStudentOrders with the current user id and query', async () => {
    const query: StudentOrdersQueryDto = {
      status: OrderStatus.CONFIRMED
    };
    const orders = [{ id: 'order-id', status: query.status }];
    ordersService.findStudentOrders.mockResolvedValue(orders);

    await expect(controller.findStudentOrders(user, query)).resolves.toEqual(orders);
    expect(ordersService.findStudentOrders).toHaveBeenCalledWith(user.id, query);
  });

  it('calls OrdersService.findMerchantOrders with the current user id and query', async () => {
    const merchantUser: AuthenticatedUser = {
      id: 'merchant-user-id',
      email: 'merchant@grabgo.test',
      role: Role.MERCHANT
    };
    const query: MerchantOrdersQueryDto = {
      status: OrderStatus.READY
    };
    const orders = [{ id: 'order-id', status: query.status }];
    ordersService.findMerchantOrders.mockResolvedValue(orders);

    await expect(controller.findMerchantOrders(merchantUser, query)).resolves.toEqual(orders);
    expect(ordersService.findMerchantOrders).toHaveBeenCalledWith(merchantUser.id, query);
  });

  it('calls OrdersService.findOrderByIdForUser with the current user and order id', async () => {
    const order = { id: 'order-id' };
    ordersService.findOrderByIdForUser.mockResolvedValue(order);

    await expect(controller.findOrderById(user, { id: 'order-id' })).resolves.toEqual(order);
    expect(ordersService.findOrderByIdForUser).toHaveBeenCalledWith(user, 'order-id');
  });

  it('calls OrdersService.paySimulatedOrder with the current user id and order id', async () => {
    const order = { id: 'order-id', status: 'CONFIRMED' };
    ordersService.paySimulatedOrder.mockResolvedValue(order);

    await expect(controller.payOrder(user, { id: 'order-id' })).resolves.toEqual(order);
    expect(ordersService.paySimulatedOrder).toHaveBeenCalledWith(user.id, 'order-id');
  });

  it('calls OrdersService.validateWithdrawal with the current user id and dto', async () => {
    const merchantUser: AuthenticatedUser = {
      id: 'merchant-user-id',
      email: 'merchant@grabgo.test',
      role: Role.MERCHANT
    };
    const dto: ValidateWithdrawalDto = {
      qrToken: 'qr-token'
    };
    const order = { id: 'order-id', status: 'COMPLETED' };
    ordersService.validateWithdrawal.mockResolvedValue(order);

    await expect(controller.validateWithdrawal(merchantUser, dto)).resolves.toEqual(order);
    expect(ordersService.validateWithdrawal).toHaveBeenCalledWith(merchantUser.id, dto);
  });

  it('calls OrdersService.updateMerchantOrderStatus with the current user id, order id and status', async () => {
    const merchantUser: AuthenticatedUser = {
      id: 'merchant-user-id',
      email: 'merchant@grabgo.test',
      role: Role.MERCHANT
    };
    const dto: UpdateOrderStatusDto = {
      status: OrderStatus.PREPARING
    };
    const order = { id: 'order-id', status: dto.status };
    ordersService.updateMerchantOrderStatus.mockResolvedValue(order);

    await expect(
      controller.updateOrderStatus(merchantUser, { id: 'order-id' }, dto)
    ).resolves.toEqual(order);
    expect(ordersService.updateMerchantOrderStatus).toHaveBeenCalledWith(
      merchantUser.id,
      'order-id',
      dto.status
    );
  });
});
