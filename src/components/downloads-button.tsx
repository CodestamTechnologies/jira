'use client';

import { useMemo, useState } from 'react';
import { Download, Loader2, Users, CheckSquare2, History } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetTeamAttendance } from '@/features/attendance/api/use-get-team-attendance';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { TaskStatus } from '@/features/tasks/types';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useDownloadTodayAttendance } from '@/features/attendance/hooks/use-download-today-attendance';
import { useDownloadTasksPDF } from '@/features/tasks/hooks/use-download-tasks-pdf';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { getTodayDateString, getYesterdayDateRange, getYesterdayDateString } from '@/utils/date-helpers';
import { enhanceTasksWithProjectNames, filterTasksByStatus } from '@/utils/task-helpers';
import { useExportActivityLogs } from '@/features/activity-logs/api/use-export-activity-logs';
import ActivityLogPDF from '@/features/activity-logs/components/activity-log-pdf';

/**
 * DownloadsButton Component
 * 
 * Provides a dropdown menu in the header for downloading PDF reports:
 * - Today's Team Attendance
 * - Tasks in Progress Today
 * - Yesterday's Activities (PDF) - ADMIN ONLY
 * 
 * Features:
 * - Admin-only access (only visible to workspace admins)
 *   - Frontend: Component returns null if user is not admin
 *   - Backend: API endpoint validates admin role (403 Forbidden if not admin)
 * - Conditional data fetching (only when in workspace)
 * - Memoized project map for performance
 * - Proper error handling
 * - Loading states
 * - Type-safe task enhancement
 * 
 * Security:
 * - All download options require admin privileges
 * - Activity logs export is restricted to admins on both frontend and backend
 * 
 * @example
 * ```tsx
 * <DownloadsButton />
 * ```
 */
export const DownloadsButton = () => {
  const workspaceId = useWorkspaceId();
  const { data: isAdmin } = useAdminStatus();
  const [isDownloadingYesterday, setIsDownloadingYesterday] = useState(false);

  // Memoize dates to avoid recreating on every render (performance optimization)
  // These values are stable and don't change during component lifecycle
  const today = useMemo(() => getTodayDateString(), []);
  const yesterdayRange = useMemo(() => getYesterdayDateRange(), []);
  const yesterdayDateString = useMemo(() => getYesterdayDateString(), []);

  // Fetch data only when in workspace context
  const isInWorkspace = !!workspaceId;
  
  // Hook for exporting yesterday's activity logs
  const { refetch: refetchYesterdayLogs } = useExportActivityLogs({
    workspaceId: workspaceId || '',
    startDate: yesterdayRange.startDate,
    endDate: yesterdayRange.endDate,
    enabled: false,
  });

  // Fetch today's team attendance
  const { data: teamAttendanceData, isLoading: isLoadingAttendance } = useGetTeamAttendance({
    workspaceId,
    date: today,
    enabled: isInWorkspace,
  });

  // Fetch today's tasks in progress
  // Note: API already filters by status, but we keep the filter for type safety
  // Large limit ensures we get all in-progress tasks for PDF generation
  // React Query caching (1min staleTime) prevents unnecessary refetches
  const { data: tasksData, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    status: TaskStatus.IN_PROGRESS,
    showAll: false,
    limit: 1000, // Large limit to get all in-progress tasks
    // enabled is handled by useGetTasks internally
  });

  // Fetch projects to get project names for PDF
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });

  // Memoized project map for O(1) lookup performance
  // This optimization reduces lookup time from O(n) to O(1) when enhancing tasks
  // Only recalculates when projectsData changes (React Query cache handles this)
  const projectMap = useMemo(() => {
    if (!projectsData?.documents) return new Map<string, string>();
    return new Map(
      projectsData.documents.map((project) => [project.$id, project.name])
    );
  }, [projectsData]);

  // PDF download hooks
  const { downloadTodayAttendance, isDownloading: isDownloadingAttendance } = useDownloadTodayAttendance();
  const { downloadTasksPDF, isDownloading: isDownloadingTasks } = useDownloadTasksPDF();

  /**
   * Handles downloading today's team attendance PDF
   */
  const handleDownloadAttendance = async () => {
    if (!workspaceId) {
      toast.error('Workspace ID not found');
      return;
    }

    if (!teamAttendanceData || teamAttendanceData.length === 0) {
      toast.error('No attendance data available for today');
      return;
    }

    try {
      await downloadTodayAttendance({
        teamAttendance: teamAttendanceData,
        selectedDate: today,
      });
      toast.success('Today\'s attendance PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading attendance PDF:', error);
      toast.error('Failed to download attendance PDF');
    }
  };

  /**
   * Handles downloading tasks in progress PDF
   */
  const handleDownloadTasks = async () => {
    if (!workspaceId) {
      toast.error('Workspace ID not found');
      return;
    }

    const tasks = tasksData?.documents || [];

    // Filter tasks (though API should already filter, this ensures type safety)
    const inProgressTasks = filterTasksByStatus(tasks, TaskStatus.IN_PROGRESS);

    if (inProgressTasks.length === 0) {
      toast.error('No tasks in progress found');
      return;
    }

    try {
      // Enhance tasks with project names using utility function
      const tasksWithProjectNames = enhanceTasksWithProjectNames(inProgressTasks, projectMap);

      await downloadTasksPDF({
        tasks: tasksWithProjectNames,
        selectedDate: today,
      });
      toast.success('Today\'s tasks in progress PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading tasks PDF:', error);
      toast.error('Failed to download tasks PDF');
    }
  };

  /**
   * Handles downloading yesterday's activities as PDF
   * 
   * SECURITY: This function is only accessible to admins.
   * - Frontend: Component returns null if user is not admin
   * - Backend: API endpoint validates admin role and returns 403 if not admin
   */
  const handleDownloadYesterdayActivities = async () => {
    if (!workspaceId) {
      toast.error('Workspace ID not found');
      return;
    }
    
    // Additional admin check (defense in depth)
    if (!isAdmin) {
      toast.error('Unauthorized: Admin access required');
      return;
    }

    setIsDownloadingYesterday(true);
    try {
      const { data } = await refetchYesterdayLogs();
      if (!data?.data) {
        toast.error('No activity data available for yesterday');
        return;
      }

      if (data.data.length === 0) {
        toast.error('No activity data available for yesterday');
        return;
      }

      // Generate PDF
      const pdfDoc = (
        <ActivityLogPDF
          logs={data.data}
          filters={{
            startDate: yesterdayRange.startDate,
            endDate: yesterdayRange.endDate,
          }}
        />
      );
      
      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `yesterday-activities-${yesterdayDateString}.pdf`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Yesterday\'s activities PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading yesterday\'s activities:', error);
      toast.error('Failed to download yesterday\'s activities');
    } finally {
      setIsDownloadingYesterday(false);
    }
  };

  // SECURITY: Early return if not in workspace context or not an admin
  // This ensures the entire DownloadsButton (including Yesterday's Activities) is admin-only
  // Backend API also validates admin role for additional security
  if (!isInWorkspace || !isAdmin) {
    return null;
  }

  const isAnyDownloading = isDownloadingAttendance || isDownloadingTasks || isDownloadingYesterday;
  const isLoading = isLoadingAttendance || isLoadingTasks || isLoadingProjects;
  const hasAttendanceData = teamAttendanceData && teamAttendanceData.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isAnyDownloading || isLoading}>
          {isAnyDownloading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span className="sr-only">Downloading...</span>
            </>
          ) : (
            <>
              <Download className="size-4" />
              <span className="sr-only">Downloads</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleDownloadAttendance}
          disabled={isDownloadingAttendance || isLoadingAttendance || !hasAttendanceData}
        >
          {isDownloadingAttendance ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Users className="mr-2 size-4" />
          )}
          Today's Team Attendance (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadTasks}
          disabled={isDownloadingTasks || isLoadingTasks || isLoadingProjects}
        >
          {isDownloadingTasks ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckSquare2 className="mr-2 size-4" />
          )}
          Tasks in Progress Today (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadYesterdayActivities}
          disabled={isDownloadingYesterday}
        >
          {isDownloadingYesterday ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <History className="mr-2 size-4" />
          )}
          Yesterday's Activities (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
