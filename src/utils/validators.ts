import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export const registerSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^0[789][01]\d{8}$/, { message: 'Enter a valid 11-digit Nigerian phone number' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const sendMoneySchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be greater than zero' }),
  note: z.string().optional(),
});

export const kycStep1Schema = z.object({
  fullName: z.string().min(3, { message: 'Full name must match BVN records' }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use YYYY-MM-DD format' }),
  gender: z.string().min(1, { message: 'Select your gender' }),
  bvn: z.string().length(11, { message: 'BVN must be exactly 11 digits' }),
});
