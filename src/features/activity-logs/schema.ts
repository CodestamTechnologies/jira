import { z } from 'zod';
import { ActivityAction, ActivityEntityType } from './types';

export const activityLogFiltersSchema = z.object({
  workspaceId: z.string(),
  entityType: z.nativeEnum(ActivityEntityType).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  action: z.nativeEnum(ActivityAction).optional(),
  projectId: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(50), // Increased max for table pagination
  offset: z.coerce.number().min(0).default(0),
});
