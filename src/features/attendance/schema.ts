import { z } from 'zod';

export const createAttendanceSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  checkInLatitude: z.number().min(-90).max(90, 'Invalid latitude'),
  checkInLongitude: z.number().min(-180).max(180, 'Invalid longitude'),
  checkInAddress: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  checkOutLatitude: z.number().min(-90).max(90, 'Invalid latitude'),
  checkOutLongitude: z.number().min(-180).max(180, 'Invalid longitude'),
  checkOutAddress: z.string().optional(),
  notes: z.string().optional(),
});

export const attendanceFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'half-day']).optional(),
  userId: z.string().optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type AttendanceFiltersInput = z.infer<typeof attendanceFiltersSchema>;
