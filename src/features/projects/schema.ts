import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  image: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
  workspaceId: z.string({
    message: 'Workspace id is required.',
  }),
  clientEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.').optional(),
  image: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
  workspaceId: z.string({
    message: 'Workspace id is required.',
  }),
  clientEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  isClosed: z.boolean().optional(),
});
