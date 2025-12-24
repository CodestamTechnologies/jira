'use client';

import { useMemo } from 'react';
import { Download, Loader2, Users, CheckSquare2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { getTodayDateString } from '@/utils/date-helpers';
import { enhanceTasksWithProjectNames, filterTasksByStatus } from '@/utils/task-helpers';

/**
 * DownloadsButton Component
 * 
 * Provides a dropdown menu in the header for downloading PDF reports:
 * - Today's Team Attendance
 * - Tasks in Progress Today
 * 
 * Features:
 * - Admin-only access (only visible to workspace admins)
 * - Conditional data fetching (only when in workspace)
 * - Memoized project map for performance
 * - Proper error handling
 * - Loading states
 * - Type-safe task enhancement
 * 
 * @example
 * ```tsx
 * <DownloadsButton />
 * ```
 */
export const DownloadsButton = () => {
  const workspaceId = useWorkspaceId();
  const { data: isAdmin } = useAdminStatus();

  // Memoize today's date to avoid recreating on every render
  const today = useMemo(() => getTodayDateString(), []);

  // Fetch data only when in workspace context
  const isInWorkspace = !!workspaceId;

  // Fetch today's team attendance
  const { data: teamAttendanceData, isLoading: isLoadingAttendance } = useGetTeamAttendance({
    workspaceId,
    date: today,
    enabled: isInWorkspace,
  });

  // Fetch today's tasks in progress
  // Note: API already filters by status, but we keep the filter for type safety
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

  // Early return if not in workspace context or not an admin
  if (!isInWorkspace || !isAdmin) {
    return null;
  }

  const isAnyDownloading = isDownloadingAttendance || isDownloadingTasks;
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
