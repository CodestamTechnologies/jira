'use client';

import { Loader2, PlusIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrent } from '@/features/auth/api/use-current';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useBulkUpdateTasks } from '@/features/tasks/api/use-bulk-update-tasks';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { useTaskFilters } from '@/features/tasks/hooks/use-task-filters';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

import { columns } from './columns';
import { DataCalendar } from './data-calendar';
import { DataFilters } from './data-filters';
import { DataKanban } from './data-kanban';
import { DataSearch } from './data-search';
import { DataTable } from './data-table';

interface TaskViewSwitcherProps {
  projectId?: string;
  hideProjectFilter?: boolean;
}

export const TaskViewSwitcher = ({ projectId, hideProjectFilter }: TaskViewSwitcherProps) => {
  const [view, setView] = useQueryState('task-view', {
    defaultValue: 'table',
  });
  const [{ status, assigneeId, projectId: filteredProjectId, dueDate, search }] = useTaskFilters();

  // Store page in URL so it persists on refresh
  const [page, setPage] = useQueryState('page', {
    defaultValue: '1',
  });
  const pageNumber = useMemo(() => {
    const num = parseInt(page || '1', 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }, [page]);
  const pageSize = 10;

  // Helper to update page in URL
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage.toString());
  }, [setPage]);

  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: isAdmin } = useAdminStatus();
  const { data: members } = useGetMembers({ workspaceId });

  // Get current member
  const currentMember = useMemo(() => {
    if (!user || !members?.documents) return null;
    return members.documents.find((m) => m.userId === user.$id) || null;
  }, [user, members?.documents]);

  // By default, show only current user's tasks for everyone
  // Users can change the filter to "All assignees" to see all tasks
  const effectiveAssigneeId = useMemo(() => {
    if (assigneeId === 'all') return null; // "all" means show all tasks
    if (assigneeId) return assigneeId; // Use filter if explicitly set to a member ID
    if (currentMember) return currentMember.$id; // Default to current user's tasks
    return null; // Fallback if no current member
  }, [assigneeId, currentMember]);

  const { open } = useCreateTaskModal();

  // Function to open task creation with current project context
  const openCreateTask = () => {
    open(TaskStatus.TODO, projectId);
  };

  // Fetch filtered tasks for display with pagination
  // Use showAll: true to show all tasks including old done ones (needed for proper pagination)
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    status,
    assigneeId: effectiveAssigneeId,
    projectId: projectId ?? filteredProjectId,
    dueDate,
    search,
    page: pageNumber,
    limit: pageSize,
    showAll: true, // Show all tasks including old done ones for proper pagination
  });

  // Reset to page 1 when filters change (but not when page changes)
  const prevFiltersRef = useRef({ status, assigneeId, projectId: projectId ?? filteredProjectId, dueDate, search });

  useEffect(() => {
    const currentFilters = { status, assigneeId, projectId: projectId ?? filteredProjectId, dueDate, search };
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters);
    if (filtersChanged && pageNumber !== 1) {
      handlePageChange(1);
    }
    prevFiltersRef.current = currentFilters;
  }, [status, assigneeId, projectId, filteredProjectId, dueDate, search, pageNumber, handlePageChange]);

  // Fetch ALL tasks (without filters) for accurate statistics
  // Use a large limit to get all tasks for accurate status breakdowns
  const { data: allTasksForStats } = useGetTasks({
    workspaceId,
    assigneeId: effectiveAssigneeId,
    showAll: true, // Get all tasks including old done ones
    page: 1,
    limit: 10000, // Large limit to fetch all tasks for statistics
  });

  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();

  // Calculate task statistics from ALL tasks (not filtered)
  const taskStats = useMemo(() => {
    // Use allTasksForStats for stats calculation (all tasks without filters)
    const tasksForStats = allTasksForStats?.documents || [];

    // Use the total from API response, which should be accurate after pagination
    const total = allTasksForStats?.total || 0;

    if (tasksForStats.length === 0 && total === 0) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        done: 0,
        backlog: 0,
        pending: 0,
      };
    }

    const stats = {
      total: total, // Use API total which includes all paginated tasks
      todo: 0,
      inProgress: 0,
      inReview: 0,
      done: 0,
      backlog: 0,
      pending: 0,
    };

    // Calculate breakdown from fetched tasks
    // Note: If pagination worked correctly, tasksForStats should contain all tasks
    tasksForStats.forEach((task) => {
      switch (task.status) {
        case TaskStatus.TODO:
          stats.todo += 1;
          stats.pending += 1;
          break;
        case TaskStatus.IN_PROGRESS:
          stats.inProgress += 1;
          stats.pending += 1;
          break;
        case TaskStatus.IN_REVIEW:
          stats.inReview += 1;
          stats.pending += 1;
          break;
        case TaskStatus.DONE:
          stats.done += 1;
          break;
        case TaskStatus.BACKLOG:
          stats.backlog += 1;
          stats.pending += 1;
          break;
      }
    });

    return stats;
  }, [allTasksForStats?.documents, allTasksForStats?.total]);

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdateTasks({
        json: { tasks },
      });
    },
    [bulkUpdateTasks],
  );

  return (
    <Tabs defaultValue={view} onValueChange={setView} className="w-full flex-1 rounded-lg border">
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex flex-col items-center justify-between gap-y-2 lg:flex-row">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button onClick={openCreateTask} size="sm" className="w-full lg:w-auto">
            <PlusIcon className="size-4" />
            New
          </Button>
        </div>
        <Separator className="my-4" />

        {/* Task Statistics */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Total:</span>
                <Badge variant="secondary" className="text-sm font-semibold">
                  {taskStats.total}
                </Badge>
              </div>
              {taskStats.pending > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Pending:</span>
                  <Badge className="bg-orange-100 text-orange-800 text-sm font-semibold">
                    {taskStats.pending}
                  </Badge>
                </div>
              )}
              {taskStats.done > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Done:</span>
                  <Badge className="bg-green-100 text-green-800 text-sm font-semibold">
                    {taskStats.done}
                  </Badge>
                </div>
              )}
              {taskStats.todo > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Todo:</span>
                  <Badge className="bg-blue-100 text-blue-800 text-sm font-semibold">
                    {taskStats.todo}
                  </Badge>
                </div>
              )}
              {taskStats.inProgress > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">In Progress:</span>
                  <Badge className="bg-purple-100 text-purple-800 text-sm font-semibold">
                    {taskStats.inProgress}
                  </Badge>
                </div>
              )}
              {taskStats.inReview > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">In Review:</span>
                  <Badge className="bg-orange-100 text-orange-800 text-sm font-semibold">
                    {taskStats.inReview}
                  </Badge>
                </div>
              )}
              {taskStats.backlog > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Backlog:</span>
                  <Badge className="bg-gray-100 text-gray-800 text-sm font-semibold">
                    {taskStats.backlog}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-between gap-2 xl:flex-row xl:items-center">
          <DataFilters hideProjectFilter={hideProjectFilter} />

          <DataSearch />
        </div>

        <Separator className="my-4" />
        {isLoadingTasks ? (
          <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-lg border">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable
                columns={columns}
                data={tasks?.documents ?? []}
                total={tasks?.total || 0}
                page={pageNumber}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                isLoading={isLoadingTasks}
              />
            </TabsContent>

            <TabsContent value="kanban" className="mt-0">
              <DataKanban data={tasks?.documents ?? []} onChange={onKanbanChange} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks?.documents ?? []} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};
