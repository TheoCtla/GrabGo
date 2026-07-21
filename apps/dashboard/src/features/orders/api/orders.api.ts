import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import { MerchantOrder, merchantOrdersSchema } from '../types';

export function getMerchantOrders(): Promise<MerchantOrder[]> {
  return httpClient<MerchantOrder[]>(endpoints.orders.merchant, {
    schema: merchantOrdersSchema
  });
}
