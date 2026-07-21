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

export const merchantActionableOrderStatusSchema = z.enum([
  'CONFIRMED',
  'WAITING_PULL_CONFIRMATION',
  'PREPARING',
  'READY',
  'LATE'
]);

export const merchantTargetOrderStatusSchema = z.enum([
  'WAITING_PULL_CONFIRMATION',
  'PREPARING',
  'READY',
  'LATE'
]);

const nullableDateSchema = z.string().nullable();

const orderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number(),
  unitPriceCents: z.number(),
  totalPriceCents: z.number(),
  specialNote: z.string().nullable(),
  selectedOptions: z.unknown().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const paymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: z.string(),
  amountCents: z.number(),
  provider: z.string(),
  providerPaymentId: z.string().nullable(),
  paidAt: nullableDateSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

const slotSchema = z.object({
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

const snackSchema = z.object({
  id: z.string(),
  merchantId: z.string(),
  campusId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  circuitBreaker: z.boolean(),
  snoozedUntil: nullableDateSchema,
  openingTime: z.string().nullable(),
  closingTime: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const merchantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  companyName: z.string(),
  siret: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const withdrawalCodeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  code: z.string(),
  qrToken: z.string(),
  usedAt: nullableDateSchema,
  expiresAt: nullableDateSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

const orderUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email()
});

const baseOrderSchema = z.object({
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
  pickupConfirmedAt: nullableDateSchema,
  lateReportedAt: nullableDateSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(orderItemSchema),
  payment: paymentSchema.nullable(),
  slot: slotSchema,
  snack: snackSchema,
  withdrawalCode: withdrawalCodeSchema.nullable()
});

export const merchantOrderSchema = baseOrderSchema.extend({
  user: orderUserSchema
});

export const orderDetailSchema = merchantOrderSchema.extend({
  snack: snackSchema.extend({
    merchant: merchantSchema.optional()
  })
});

export const merchantOrderMutationResponseSchema = baseOrderSchema;
export const merchantOrdersSchema = z.array(merchantOrderSchema);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type MerchantActionableOrderStatus = z.infer<typeof merchantActionableOrderStatusSchema>;
export type MerchantTargetOrderStatus = z.infer<typeof merchantTargetOrderStatusSchema>;
export type MerchantOrder = z.infer<typeof merchantOrderSchema>;
export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type MerchantOrderMutationResponse = z.infer<typeof merchantOrderMutationResponseSchema>;

export type UpdateOrderStatusPayload = {
  status: MerchantTargetOrderStatus;
};

export type ValidateWithdrawalPayload =
  | {
      code: string;
      snackId: string;
      qrToken?: never;
    }
  | {
      qrToken: string;
      code?: never;
      snackId?: never;
    };

export type ValidateWithdrawalResponse = MerchantOrderMutationResponse;
