import { z } from 'zod';

/**
 * Request schema for task validation
 */
export const validateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
});
