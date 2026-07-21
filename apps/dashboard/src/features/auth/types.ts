import { z } from 'zod';

export const userRoleSchema = z.enum(['STUDENT', 'MERCHANT', 'ADMIN']);

export const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  phone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: authenticatedUserSchema
});

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = z.infer<typeof authResponseSchema>;
