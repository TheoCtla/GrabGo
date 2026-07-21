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

export const merchantOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  snackId: z.string(),
  slotId: z.string(),
  customerFirstName: z.string().nullable().optional(),
  status: orderStatusSchema,
  productsTotalCents: z.number(),
  serviceFeeCents: z.number(),
  totalCents: z.number(),
  specialNote: z.string().nullable(),
  pickupConfirmedAt: z.string().nullable(),
  lateReportedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(z.unknown()),
  payment: z.unknown().nullable(),
  slot: z.object({
    id: z.string(),
    snackId: z.string(),
    startAt: z.string(),
    endAt: z.string(),
    capacity: z.number(),
    reservedCount: z.number(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
  }),
  snack: z.object({
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
  }),
  withdrawalCode: z.unknown().nullable(),
  user: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email()
  })
});

export const merchantOrdersSchema = z.array(merchantOrderSchema);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type MerchantOrder = z.infer<typeof merchantOrderSchema>;
