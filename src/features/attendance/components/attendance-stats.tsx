'use client';

import { AlertCircle, Calendar, CheckCircle, Clock, TrendingUp, XCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrent } from '@/features/auth/api/use-current';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetAttendanceStats } from '../api/use-get-attendance-stats';

export const AttendanceStats = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: stats, isLoading } = useGetAttendanceStats(workspaceId, user?.$id);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Attendance Data</CardTitle>
          <CardDescription>Start checking in to see your attendance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No attendance records found. Check in for the first time to start tracking your attendance.</p>
        </CardContent>
      </Card>
    );
  }

  const attendanceRate = stats.totalDays > 0 ? ((stats.presentDays / stats.totalDays) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDays}</div>
          <p className="text-xs text-muted-foreground">
            Days tracked
          </p>
        </CardContent>
      </Card>

      {/* Present Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Days</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.presentDays}</div>
          <p className="text-xs text-muted-foreground">
            {attendanceRate}% attendance rate
          </p>
        </CardContent>
      </Card>

      {/* Late Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Days</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lateDays}</div>
          <p className="text-xs text-muted-foreground">
            Arrived after 9:30 AM
          </p>
        </CardContent>
      </Card>

      {/* Average Hours */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Hours</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageHours.toFixed(1)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Per day average
          </p>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.currentStreak}</div>
          <p className="text-xs text-muted-foreground">
            Consecutive present days
          </p>
        </CardContent>
      </Card>

      {/* Absent Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.absentDays}</div>
          <p className="text-xs text-muted-foreground">
            Days missed
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
