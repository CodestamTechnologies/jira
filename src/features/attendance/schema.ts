import { z } from 'zod';
import { normalizeText, countNormalizedCharacters } from './utils';

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
  notes: z
    .string()
    .optional()
    .refine(
      (val) => {
        // If notes are provided, validate length
        if (!val || val.trim() === '') return true; // Optional, so empty is fine
        const normalized = normalizeText(val);
        return countNormalizedCharacters(normalized) >= 10;
      },
      {
        message: 'Daily summary must be at least 10 characters (after removing special formatting)',
      }
    )
    .refine(
      (val) => {
        // If notes are provided, validate max length
        if (!val || val.trim() === '') return true; // Optional, so empty is fine
        const normalized = normalizeText(val);
        return countNormalizedCharacters(normalized) <= 1000;
      },
      {
        message: 'Daily summary cannot exceed 1000 characters',
      }
    )
    .transform((val) => val ? normalizeText(val) : ''), // Normalize before storing, or empty string if not provided
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
