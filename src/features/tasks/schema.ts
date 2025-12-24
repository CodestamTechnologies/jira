import { z } from 'zod';

import { TaskStatus } from './types';

export const createTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Task name must be at least 3 characters.')
    .max(200, 'Task name must be less than 200 characters.'),
  status: z.nativeEnum(TaskStatus, {
    message: 'Task status is required.',
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
  parentId: z.string().trim().optional(),
  mentions: z.array(z.string()).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content is required.'),
  mentions: z.array(z.string()).optional(),
});
