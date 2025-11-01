'use client';

import { AlertCircle, CheckCircle, Clock, Users, LogIn } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AnalyticsCard } from './analytics-card';
import { DottedSeparator } from './dotted-separator';
import { useGetTodayAttendance } from '@/features/attendance/api/use-get-today-attendance';
import { useGetTodayAttendanceStats } from '@/features/attendance/api/use-get-today-attendance-stats';
import { useCurrent } from '@/features/auth/api/use-current';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const TodayAttendanceStats = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: stats, isLoading: isLoadingStats } = useGetTodayAttendanceStats(workspaceId);
  const { data: userAttendance, isLoading: isLoadingUserAttendance } = useGetTodayAttendance(workspaceId, user?.$id);

  const isLoading = isLoadingStats || isLoadingUserAttendance;

  if (isLoading) {
    return (
      <ScrollArea className="w-full shrink-0 whitespace-nowrap rounded-lg border">
        <div className="flex w-full flex-row">
          <div className="flex flex-1 items-center">
            <div className="flex flex-col gap-1 p-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  if (!stats) {
    return null;
  }

  const notCheckedIn = stats.total - stats.checkedIn;
  const hasUserCheckedIn = !!userAttendance;
  const userStatus = userAttendance?.status || 'not-checked-in';

  return (
    <div className="flex flex-col gap-3">
      {/* User's Personal Status Card - Compact and Clean */}
      {user && (
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`flex items-center justify-center size-10 rounded-full shrink-0 ${
                  hasUserCheckedIn 
                    ? userStatus === 'present' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                      : userStatus === 'late'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-muted'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {hasUserCheckedIn ? (
                    userStatus === 'present' ? (
                      <CheckCircle className={`size-5 ${userStatus === 'present' ? 'text-emerald-600 dark:text-emerald-400' : userStatus === 'late' ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`} />
                    ) : userStatus === 'late' ? (
                      <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <Clock className="size-5 text-muted-foreground" />
                    )
                  ) : (
                    <Clock className="size-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">Your Status</span>
                    {hasUserCheckedIn && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        userStatus === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        userStatus === 'late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {userStatus === 'present' ? 'Present' : userStatus === 'late' ? 'Late' : userStatus}
                      </span>
                    )}
                  </div>
                  {hasUserCheckedIn ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {userAttendance.checkInTime && `Checked in ${formatDistanceToNow(new Date(userAttendance.checkInTime), { addSuffix: true })}`}
                      {!userAttendance.checkOutTime && userAttendance.checkInTime && ' • Currently at work'}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Not checked in today</p>
                  )}
                </div>
              </div>
              {!hasUserCheckedIn && (
                <Button asChild size="sm" variant="primary">
                  <Link href={`/workspaces/${workspaceId}/attendance`}>
                    <LogIn className="mr-1.5 size-3.5" />
                    Check In
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      <ScrollArea className="w-full shrink-0 whitespace-nowrap rounded-lg border">
        <div className="flex w-full flex-row">
          <div className="flex flex-1 items-center">
            <AnalyticsCard
              title="Total Members"
              value={stats.total}
              variant="neutral"
              icon={Users}
            />

            <DottedSeparator direction="vertical" />
          </div>

          <div className="flex flex-1 items-center">
            <AnalyticsCard
              title="Checked In"
              value={stats.checkedIn}
              variant={stats.checkedIn > 0 ? 'up' : 'neutral'}
              icon={CheckCircle}
            />

            <DottedSeparator direction="vertical" />
          </div>

          <div className="flex flex-1 items-center">
            <AnalyticsCard
              title="Present"
              value={stats.present}
              variant={stats.present > 0 ? 'up' : 'neutral'}
              icon={CheckCircle}
            />

            <DottedSeparator direction="vertical" />
          </div>

          <div className="flex flex-1 items-center">
            <AnalyticsCard
              title="Late"
              value={stats.late}
              variant={stats.late > 0 ? 'down' : 'neutral'}
              icon={AlertCircle}
            />

            <DottedSeparator direction="vertical" />
          </div>

          <div className="flex flex-1 items-center">
            <AnalyticsCard
              title="Not Checked In"
              value={notCheckedIn}
              variant={notCheckedIn > 0 ? 'down' : 'neutral'}
              icon={Clock}
            />
          </div>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
