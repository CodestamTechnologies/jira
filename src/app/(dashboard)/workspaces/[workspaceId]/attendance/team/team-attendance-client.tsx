'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useGetTeamAttendance } from '@/features/attendance/api/use-get-team-attendance';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useAdminRedirect } from '@/features/attendance/hooks/use-admin-redirect';
import { useDownloadTeamAttendance } from '@/features/attendance/hooks/use-download-team-attendance';
import { calculateTeamAttendanceStats } from '@/features/attendance/utils/team-attendance-stats';
import { TeamAttendanceDatePicker } from '@/features/attendance/components/team-attendance-date-picker';
import { TeamAttendanceSummaryCards } from '@/features/attendance/components/team-attendance-summary-cards';
import { TeamAttendanceTable } from '@/features/attendance/components/team-attendance-table';

export const TeamAttendanceClient = () => {
  const workspaceId = useWorkspaceId();
  const { isAdminLoading } = useAdminRedirect(
    `/workspaces/${workspaceId}/attendance`
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: teamAttendance, isLoading } = useGetTeamAttendance(
    workspaceId,
    selectedDate
  );

  const { downloadTeamAttendance, isDownloading } = useDownloadTeamAttendance();
  const stats = calculateTeamAttendanceStats(teamAttendance);

  const handleDownloadPDF = async () => {
    if (!teamAttendance || teamAttendance.length === 0) {
      return;
    }

    try {
      await downloadTeamAttendance({
        teamAttendance,
        selectedDate,
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  if (isAdminLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
          <p className="text-muted-foreground">
            View attendance for all team members on a specific day
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading || !teamAttendance || teamAttendance.length === 0}
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </div>

      {/* Date Picker */}
      <TeamAttendanceDatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Summary Cards */}
      <TeamAttendanceSummaryCards stats={stats} />

      {/* Team Attendance Table */}
      <TeamAttendanceTable
        teamAttendance={teamAttendance || []}
        selectedDate={selectedDate}
        isLoading={isLoading}
      />
    </div>
  );
};
