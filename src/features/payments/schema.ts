import { z } from 'zod'

export const createPaymentLinkSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(999999999, 'Amount too large'),
  currency: z.string().min(3).max(3).default('INR'),
  description: z.string().trim().min(1, 'Description is required').max(500, 'Description too long'),
  customer: z
    .object({
      name: z.string().trim().min(1, 'Customer name is required').max(100, 'Name too long'),
      email: z.string().email('Valid email is required').max(100, 'Email too long'),
      contact: z
        .string()
        .trim()
        .regex(/^[0-9]{10}$/, 'Contact must be a valid 10-digit phone number')
        .optional(),
    })
    .optional(),
  notes: z
    .record(z.string())
    .optional(),
  expireBy: z
    .number()
    .int()
    .positive()
    .optional(),
  reminderEnable: z.boolean().default(true),
  callbackUrl: z.string().url('Valid callback URL is required').optional(),
  callbackMethod: z.enum(['get', 'post']).default('post'),
})
