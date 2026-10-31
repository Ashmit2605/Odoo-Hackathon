import { z } from 'zod';

// Password rule from SQL header: 9+ chars, uppercase, lowercase, special char
export const passwordSchema = z
  .string()
  .min(9, 'Password must be at least 9 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const registerSchema = z.object({
  name:     z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  email:    z.string().trim().toLowerCase().email('Invalid email').max(255),
  password: passwordSchema,
  // Optional customer fields — merged into customers row
  companyName: z.string().trim().max(200).optional(),
  phone:       z.string().trim().max(30).optional(),
  address:     z.string().trim().max(2000).optional(),
});

export const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

// All fields optional — only provided fields are updated
export const updateProfileSchema = z.object({
  name:        z.string().trim().min(2, 'Name must be at least 2 characters').max(150).optional(),
  phone:       z.string().trim().max(30).optional(),
  companyName: z.string().trim().max(200).optional(),
  address:     z.string().trim().max(2000).optional(),
});