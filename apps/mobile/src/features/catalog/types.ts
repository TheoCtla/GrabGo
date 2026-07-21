import { z } from 'zod';

export const campusSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const allergenSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const productOptionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  priceDeltaCents: z.number(),
  isAvailable: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const productSchema = z.object({
  id: z.string(),
  snackId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  priceCents: z.number(),
  stock: z.number(),
  isAvailable: z.boolean(),
  allergensVerifiedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  allergens: z.array(allergenSchema).optional().default([]),
  options: z.array(productOptionSchema).optional().default([])
});

export const snackSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  campusId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  circuitBreaker: z.boolean(),
  snoozedUntil: z.string().nullable(),
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  campus: campusSchema.optional(),
  products: z.array(productSchema).optional().default([])
});

export const slotSchema = z.object({
  id: z.string(),
  snackId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  capacity: z.number(),
  reservedCount: z.number(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const campusesSchema = z.array(campusSchema);
export const snacksSchema = z.array(snackSchema);
export const productsSchema = z.array(productSchema);
export const slotsSchema = z.array(slotSchema);

export type Campus = z.infer<typeof campusSchema>;
export type Snack = z.infer<typeof snackSchema>;
export type Product = z.infer<typeof productSchema>;
export type Slot = z.infer<typeof slotSchema>;
