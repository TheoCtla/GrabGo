import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import {
  MerchantOrder,
  MerchantOrderMutationResponse,
  OrderDetail,
  OrderStatus,
  UpdateOrderStatusPayload,
  ValidateWithdrawalPayload,
  ValidateWithdrawalResponse,
  merchantOrderMutationResponseSchema,
  merchantOrdersSchema,
  orderDetailSchema
} from '../types';

type MerchantOrdersQuery = {
  from?: string;
  status?: OrderStatus;
  to?: string;
};

const SUMMARY_ORDER_STATUSES: OrderStatus[] = [
  'CONFIRMED',
  'WAITING_PULL_CONFIRMATION',
  'PREPARING',
  'READY',
  'LATE',
  'COMPLETED'
];

export function getMerchantOrders(): Promise<MerchantOrder[]> {
  return getMerchantOrdersByQuery();
}

export async function getMerchantOrdersForSummary(query: {
  from: string;
  to: string;
}): Promise<MerchantOrder[]> {
  const ordersByStatus = await Promise.all(
    SUMMARY_ORDER_STATUSES.map((status) =>
      getMerchantOrdersByQuery({
        ...query,
        status
      })
    )
  );

  return ordersByStatus.flat();
}

function getMerchantOrdersByQuery(query: MerchantOrdersQuery = {}): Promise<MerchantOrder[]> {
  return httpClient<MerchantOrder[]>(getMerchantOrdersEndpoint(query), {
    schema: merchantOrdersSchema
  });
}

function getMerchantOrdersEndpoint(query: MerchantOrdersQuery): string {
  const searchParams = new URLSearchParams();

  if (query.status) {
    searchParams.set('status', query.status);
  }

  if (query.from) {
    searchParams.set('from', query.from);
  }

  if (query.to) {
    searchParams.set('to', query.to);
  }

  const queryString = searchParams.toString();

  return queryString ? `${endpoints.orders.merchant}?${queryString}` : endpoints.orders.merchant;
}

export function getOrderDetail(orderId: string): Promise<OrderDetail> {
  return httpClient<OrderDetail>(endpoints.orders.detail(orderId), {
    schema: orderDetailSchema
  });
}

export function updateMerchantOrderStatus(
  orderId: string,
  payload: UpdateOrderStatusPayload
): Promise<MerchantOrderMutationResponse> {
  return httpClient<MerchantOrderMutationResponse>(endpoints.orders.status(orderId), {
    method: 'PATCH',
    body: payload,
    schema: merchantOrderMutationResponseSchema
  });
}

export function validateWithdrawal(
  payload: ValidateWithdrawalPayload
): Promise<ValidateWithdrawalResponse> {
  return httpClient<ValidateWithdrawalResponse>(endpoints.orders.withdrawalValidate, {
    method: 'POST',
    body: payload,
    schema: merchantOrderMutationResponseSchema
  });
}
