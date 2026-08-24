import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const orderSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentMethod: z.string().optional(),
});

export const customServiceRequestSchema = z.object({
  projectType: z.string().min(1, 'Project type is required'),
  budget: z.string().min(1, 'Budget is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});
