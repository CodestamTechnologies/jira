import { z } from 'zod';

export const projectStatusSchema = z.enum(['active', 'paused', 'closed']);

/** Coerces form values to boolean: string "false" -> false, "true" or true -> true (z.coerce.boolean() treats "false" as true). */
const formBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((v) => v === true || v === 'true');

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  description: z.string().trim().optional(),
  link: z.string().trim().optional(),
  image: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
  workspaceId: z.string({
    message: 'Workspace id is required.',
  }),
  clientEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  status: projectStatusSchema.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.').optional(),
  description: z.string().trim().optional(),
  link: z.string().trim().optional(),
  image: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
  workspaceId: z.string({
    message: 'Workspace id is required.',
  }),
  clientEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  status: projectStatusSchema.optional(),
  isClosed: formBoolean.optional(),
});

export const updateProjectStatusSchema = z.object({
  workspaceId: z.string({
    message: 'Workspace id is required.',
  }),
  isClosed: formBoolean,
  status: projectStatusSchema.optional(),
});
