import { z } from 'zod'

export const createPDFTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  templateConfig: z.string().min(1, 'Template configuration is required'), // JSON string
  workspaceId: z.string().trim().min(1, 'Workspace ID is required'),
  isDefault: z.boolean().default(false),
  version: z.string().default('1.0.0'),
})

export const updatePDFTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Template name is required').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  templateConfig: z.string().min(1, 'Template configuration is required').optional(),
  version: z.string().optional(),
})

