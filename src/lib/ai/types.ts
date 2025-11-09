import { z } from 'zod';

export const taskValidationResponseSchema = z.object({
  error: z.boolean().describe('Whether the task is vague or incomplete'),
  message: z.string().describe('Explanation of what is wrong with the task, or confirmation if it is good'),
});

export type TaskValidationResponse = z.infer<typeof taskValidationResponseSchema>;

export interface TaskValidationInput {
  name: string;
  description?: string;
}
