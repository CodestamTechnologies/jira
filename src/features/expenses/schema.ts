import { z } from 'zod';
import { ExpenseCategory, ExpenseStatus } from './types';

/**
 * Expense schema definitions
 * Used for validation on both client and server
 */

/**
 * Create expense schema
 * Validates expense creation data
 */
export const createExpenseSchema = z.object({
  // Preprocess to handle empty strings - convert to undefined before coercion
  amount: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return val;
    },
    z.coerce
      .number({
        required_error: 'Amount is required.',
        invalid_type_error: 'Amount must be a number.',
      })
      .min(0, 'Amount must be non-negative.')
      .max(999999999, 'Amount too large.')
      .refine((val) => !isNaN(val), {
        message: 'Amount must be a valid number.',
      })
      .refine((val) => Math.round(val * 100) / 100 === val, {
        message: 'Amount can have at most 2 decimal places.',
      }),
  ),
  date: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return val;
    },
    z.coerce.date({
      required_error: 'Date is required.',
      invalid_type_error: 'Invalid date format.',
    }),
  ),
  description: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z
      .string({
        required_error: 'Description is required.',
      })
      .min(1, 'Description is required.')
      .max(500, 'Description must be less than 500 characters.'),
  ),
  category: z.preprocess(
    (val) => (typeof val === 'string' ? val.toLowerCase().trim() : val),
    z.nativeEnum(ExpenseCategory, {
      required_error: 'Category is required.',
      invalid_type_error: 'Invalid category.',
    }),
  ),
  customCategory: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.trim() : val),
      z.string().max(100, 'Custom category must be less than 100 characters.'),
    )
    .optional(),
  projectId: z.preprocess(
    (val) => {
      const str = typeof val === 'string' ? val.trim() : '';
      return str === '' || str === 'none' ? undefined : str;
    },
    z.string().min(1).optional(),
  ),
  workspaceId: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z.string().min(1, 'Workspace ID is required.'),
  ),
  // billFileId is set server-side after file upload, not part of form data
  notes: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.trim() : val),
      z.string().max(2000, 'Notes must be less than 2000 characters.'),
    )
    .optional()
    .or(z.literal('')),
  status: z.nativeEnum(ExpenseStatus).default(ExpenseStatus.APPROVED).optional(),
  // billFile handled exactly like project image field
  billFile: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
});

/**
 * Update expense schema
 * All fields optional except workspaceId for authorization
 */
export const updateExpenseSchema = createExpenseSchema
  .partial()
  .extend({
    workspaceId: z.string().trim().min(1, 'Workspace ID is required.'),
  });

/**
 * Expense filters schema
 * Used for filtering expenses list
 */
export const expenseFiltersSchema = z.object({
  workspaceId: z.string().trim().min(1, 'Workspace ID is required.'),
  projectId: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  status: z.nativeEnum(ExpenseStatus).optional(),
});

/**
 * Type exports for TypeScript
 */
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>;
