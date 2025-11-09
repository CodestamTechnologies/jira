import { z } from 'zod';

import { TaskStatus } from './types';

export const createTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Task name must be at least 3 characters.')
    .max(200, 'Task name must be less than 200 characters.')
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2 || val.length >= 10,
      'Task name should be more descriptive. Include at least 2 words or be at least 10 characters long.',
    ),
  status: z.nativeEnum(TaskStatus, {
    required_error: 'Task status is required.',
  }),
  workspaceId: z.string().trim().min(1, 'Workspace id is required.'),
  projectId: z.string().trim().min(1, 'Project id is required.'),
  dueDate: z.coerce.date(),
  assigneeIds: z.array(z.string().trim().min(1)).min(1, 'At least one assignee is required.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters.')
    .optional()
    .default(''),
});

export const createCommentSchema = z.object({
  taskId: z.string().trim().min(1, 'Task id is required.'),
  content: z.string().trim().min(1, 'Comment content is required.'),
  authorId: z.string().trim().min(1, 'Author id is required.'),
  username: z.string().trim().min(1, 'Username is required.'),
});
