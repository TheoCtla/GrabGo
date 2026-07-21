import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'WAITING_PULL_CONFIRMATION',
  'PREPARING',
  'READY',
  'COMPLETED',
  'LATE',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED'
]);

export const paymentStatusSchema = z.enum([
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
]);

export const createOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  selectedOptions: z.unknown().optional(),
  specialNote: z.string().optional()
});

export const createOrderPayloadSchema = z.object({
  snackId: z.string(),
  slotId: z.string(),
  items: z.array(createOrderItemSchema).min(1),
  specialNote: z.string().optional()
});

export const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unitPriceCents: z.number(),
  totalPriceCents: z.number(),
  specialNote: z.string().nullable(),
  selectedOptions: z.unknown().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const orderPaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: paymentStatusSchema,
  amountCents: z.number(),
  provider: z.string(),
  providerPaymentId: z.string().nullable(),
  paidAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const orderSlotSchema = z.object({
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

export const orderSnackSchema = z.object({
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
  updatedAt: z.string()
});

export const withdrawalCodeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  code: z.string(),
  qrToken: z.string(),
  usedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const orderUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string()
});

export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  snackId: z.string(),
  slotId: z.string(),
  status: orderStatusSchema,
  productsTotalCents: z.number(),
  serviceFeeCents: z.number(),
  totalCents: z.number(),
  customerFirstName: z.string().nullable().optional(),
  specialNote: z.string().nullable(),
  pickupConfirmedAt: z.string().nullable(),
  lateReportedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(orderItemSchema),
  payment: orderPaymentSchema.nullable(),
  slot: orderSlotSchema,
  snack: orderSnackSchema,
  withdrawalCode: withdrawalCodeSchema.nullable(),
  user: orderUserSchema.optional()
});

export const ordersSchema = z.array(orderSchema);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
export type Order = z.infer<typeof orderSchema>;
