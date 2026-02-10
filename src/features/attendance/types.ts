export interface Attendance {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  workspaceId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAddress?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutAddress?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

export interface CreateAttendanceRequest {
  workspaceId: string;
  checkInLatitude: number;
  checkInLongitude: number;
  checkInAddress?: string;
  notes?: string;
}

export interface UpdateAttendanceRequest {
  checkOutLatitude: number;
  checkOutLongitude: number;
  checkOutAddress?: string;
  notes?: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  averageHours: number;
  currentStreak: number;
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  status?: 'present' | 'absent' | 'late' | 'half-day';
  userId?: string;
}

import { Models } from 'node-appwrite';

export interface SpecialDay extends Models.Document {
  workspaceId: string;
  date: string;
  type: 'holiday' | 'working';
  description?: string;
}
