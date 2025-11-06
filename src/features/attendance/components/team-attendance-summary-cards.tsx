import { Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamAttendanceStats } from '../utils/team-attendance-stats';

interface TeamAttendanceSummaryCardsProps {
  stats: TeamAttendanceStats;
}

export const TeamAttendanceSummaryCards = ({
  stats,
}: TeamAttendanceSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold">{stats.totalMembers}</div>
          <p className="text-xs text-muted-foreground">Team size</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Present</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-green-600">{stats.presentCount}</div>
          <p className="text-xs text-muted-foreground">On time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Late</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
          <p className="text-xs text-muted-foreground">Arrived late</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Half Day</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.halfDayCount}</div>
          <p className="text-xs text-muted-foreground">Less than 4 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Absent</CardTitle>
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-red-600">{stats.absentCount}</div>
          <p className="text-xs text-muted-foreground">No check-in</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs md:text-sm font-medium">Checked In</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl md:text-2xl font-bold text-blue-600">{stats.checkedInCount}</div>
          <p className="text-xs text-muted-foreground">Total checked in</p>
        </CardContent>
      </Card>
    </div>
  );
};
