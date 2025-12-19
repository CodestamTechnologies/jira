import { z } from 'zod';

export const createInvoiceSchema = z.object({
  // invoiceNumber is IGNORED - always server-generated for security
  projectId: z.string().min(1, 'Project ID is required.'),
  workspaceId: z.string().min(1, 'Workspace ID is required.'),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, 'Item description is required.').max(500, 'Description too long.'),
        price: z.number().min(0, 'Price must be non-negative.').max(999999999, 'Price too large.'),
      }),
    )
    .min(1, 'At least one item is required.')
    .max(100, 'Too many items.'),
  notes: z.string().trim().max(2000, 'Notes too long.').optional(),
  // subtotal and total are IGNORED - always recalculated server-side for security
  subtotal: z.number().optional(),
  total: z.number().optional(),
  // Payment link URL (optional - can be created before invoice creation)
  paymentLinkUrl: z.string().url('Valid payment link URL is required.').optional(),
});
