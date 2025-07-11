import { z } from 'zod';

import { TaskStatus } from './types';

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.'),
  status: z.nativeEnum(TaskStatus, {
    required_error: 'Task status is required.',
  }),
  workspaceId: z.string().trim().min(1, 'Workspace id is required.'),
  projectId: z.string().trim().min(1, 'Project id is required.'),
  dueDate: z.coerce.date(),
  assigneeId: z.string().trim().min(1, 'Assignee id is required.'),
  description: z.string().optional(),
});

export const createCommentSchema = z.object({
  taskId: z.string().trim().min(1, 'Task id is required.'),
  content: z.string().trim().min(1, 'Comment content is required.'),
  authorId: z.string().trim().min(1, 'Author id is required.'),
  username: z.string().trim().min(1, 'Username is required.'),
});
