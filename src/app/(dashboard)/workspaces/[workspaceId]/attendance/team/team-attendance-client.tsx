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
import { MobileTeamAttendanceCard } from '@/features/attendance/components/mobile-team-attendance-card';

export const TeamAttendanceClient = () => {
  const workspaceId = useWorkspaceId();
  const { isAdminLoading } = useAdminRedirect(
    `/workspaces/${workspaceId}/attendance`
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: teamAttendance, isLoading } = useGetTeamAttendance({
    workspaceId,
    date: selectedDate,
  });

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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Attendance</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            View attendance for all team members on a specific day
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading || !teamAttendance || teamAttendance.length === 0}
          variant="outline"
          className="w-full md:w-auto shrink-0"
        >
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </span>
          <span className="sm:hidden">
            {isDownloading ? 'Generating...' : 'Download'}
          </span>
        </Button>
      </div>

      {/* Date Picker */}
      <TeamAttendanceDatePicker
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Summary Cards */}
      <TeamAttendanceSummaryCards stats={stats} />

      {/* Team Attendance - Desktop Table / Mobile Cards */}
      <div className="hidden md:block">
        <TeamAttendanceTable
          teamAttendance={teamAttendance || []}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />
      </div>
      <div className="md:hidden">
        <MobileTeamAttendanceCard
          teamAttendance={teamAttendance || []}
          selectedDate={selectedDate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
