'use client';

import { format, isAfter, isBefore, isToday, isTomorrow, startOfToday, subDays } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock, Loader2, PlusIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { useBulkUpdateTasks } from '@/features/tasks/api/use-bulk-update-tasks';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { columns } from './columns';
import { DataFilters } from './data-filters';
import { DataKanban } from './data-kanban';
import { DataTable } from './data-table';
import { DataSearch } from './data-search';

type FilterType = 'all' | 'assigned_to_me' | 'due_today' | 'due_this_week' | 'overdue';

export const MyTasksView = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();
  const { data: members } = useGetMembers({ workspaceId });
  const { open: openCreateTaskModal } = useCreateTaskModal();
  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();

  const [view, setView] = useQueryState('view', {
    defaultValue: 'table',
  });
  const [filter, setFilter] = useQueryState('filter', {
    defaultValue: 'assigned_to_me',
  });
  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
  });
  const [status, setStatus] = useQueryState('status', {
    defaultValue: '',
  });
  const [page, setPage] = useQueryState('page', {
    defaultValue: '1',
  });

  const pageNumber = useMemo(() => {
    const num = parseInt(page || '1', 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }, [page]);

  const pageSize = 10;

  // Find current user's member ID
  const currentMember = useMemo(() => {
    if (!user || !members) return null;
    return members.documents?.find((m) => m.userId === user.$id);
  }, [user, members]);

  // Calculate date filters
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Get tasks based on filter
  const { data: tasksData, isLoading } = useGetTasks({
    workspaceId,
    assigneeId: currentMember?.$id || null,
    status: status ? (status as TaskStatus) : null,
    search: search || null,
    page: pageNumber,
    limit: pageSize,
  });

  const tasks = tasksData?.documents || [];
  const total = tasksData?.total || 0;

  // Note: Date filtering is done client-side for now
  // For better scalability, consider moving to server-side filtering
  // This works well for small datasets but may need optimization for large task lists
  const filteredTasks = useMemo(() => {
    if (!tasks || filter === 'all' || filter === 'assigned_to_me') {
      return tasks;
    }

    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);

      switch (filter) {
        case 'due_today':
          return isToday(dueDate);
        case 'due_this_week':
          return isBefore(dueDate, nextWeek) && !isBefore(dueDate, today);
        case 'overdue':
          return isBefore(dueDate, today) && task.status !== TaskStatus.DONE;
        default:
          return true;
      }
    });
  }, [tasks, filter, today, nextWeek]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!tasks) return { total: 0, overdue: 0, dueToday: 0, dueThisWeek: 0, byStatus: {} };

    const now = new Date();
    let overdue = 0;
    let dueToday = 0;
    let dueThisWeek = 0;
    const byStatus: Record<string, number> = {};

    tasks.forEach((task) => {
      // Count by status
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (isBefore(dueDate, now) && task.status !== TaskStatus.DONE) {
          overdue++;
        }
        if (isToday(dueDate)) {
          dueToday++;
        }
        if (isBefore(dueDate, nextWeek) && !isBefore(dueDate, today)) {
          dueThisWeek++;
        }
      }
    });

    return {
      total: tasks.length,
      overdue,
      dueToday,
      dueThisWeek,
      byStatus,
    };
  }, [tasks, today, nextWeek]);

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdateTasks({
        json: { tasks },
      });
    },
    [bulkUpdateTasks],
  );

  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  if (!currentMember) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">View and manage all tasks assigned to you</p>
        </div>
        <Button onClick={() => openCreateTaskModal()}>
          <PlusIcon className="mr-2 size-4" />
          Create Task
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="assigned_to_me">Assigned to Me</TabsTrigger>
              <TabsTrigger value="due_today">Due Today</TabsTrigger>
              <TabsTrigger value="due_this_week">Due This Week</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <DataSearch />
          <DataFilters hideProjectFilter />
        </div>
      </div>

      {/* Task Views */}
      {view === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredTasks}
          total={total}
          page={pageNumber}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      ) : (
        <DataKanban data={filteredTasks} onChange={onKanbanChange} />
      )}
    </div>
  );
};
