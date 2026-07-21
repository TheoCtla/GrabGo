import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import {
  Campus,
  Product,
  Slot,
  Snack,
  campusesSchema,
  productsSchema,
  slotsSchema,
  snackSchema,
  snacksSchema
} from '../types';

export function getCampuses(): Promise<Campus[]> {
  return httpClient<Campus[]>(endpoints.catalog.campuses, {
    schema: campusesSchema
  });
}

export function getSnacks(campusId?: string): Promise<Snack[]> {
  return httpClient<Snack[]>(endpoints.catalog.snacks(campusId), {
    schema: snacksSchema
  });
}

export function getSnackDetail(snackId: string): Promise<Snack> {
  return httpClient<Snack>(endpoints.catalog.snackDetail(snackId), {
    schema: snackSchema
  });
}

export function getProducts(snackId: string): Promise<Product[]> {
  return httpClient<Product[]>(endpoints.catalog.products(snackId), {
    schema: productsSchema
  });
}

export function getAvailableSlots(snackId: string): Promise<Slot[]> {
  return httpClient<Slot[]>(endpoints.catalog.slots(snackId), {
    schema: slotsSchema
  });
}
