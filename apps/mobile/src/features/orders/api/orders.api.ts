import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import { CreateOrderPayload, Order, OrderStatus, orderSchema, ordersSchema } from '../types';

export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return httpClient<Order>(endpoints.orders.create, {
    method: 'POST',
    body: payload,
    schema: orderSchema
  });
}

export function paySimulatedOrder(orderId: string): Promise<Order> {
  return httpClient<Order>(endpoints.orders.pay(orderId), {
    method: 'POST',
    schema: orderSchema
  });
}

export function getOrderDetail(orderId: string): Promise<Order> {
  return httpClient<Order>(endpoints.orders.detail(orderId), {
    schema: orderSchema
  });
}

export function getMyOrders(status?: OrderStatus): Promise<Order[]> {
  const endpoint = status
    ? `${endpoints.orders.me}?status=${encodeURIComponent(status)}`
    : endpoints.orders.me;

  return httpClient<Order[]>(endpoint, {
    schema: ordersSchema
  });
}
