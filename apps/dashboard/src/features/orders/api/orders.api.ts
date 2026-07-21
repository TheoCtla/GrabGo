import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import {
  MerchantOrder,
  MerchantOrderMutationResponse,
  OrderDetail,
  UpdateOrderStatusPayload,
  ValidateWithdrawalPayload,
  ValidateWithdrawalResponse,
  merchantOrderMutationResponseSchema,
  merchantOrdersSchema,
  orderDetailSchema
} from '../types';

export function getMerchantOrders(): Promise<MerchantOrder[]> {
  return httpClient<MerchantOrder[]>(endpoints.orders.merchant, {
    schema: merchantOrdersSchema
  });
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
