'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowDownUp, CalendarIcon, Folder, ListChecks, PlusIcon, SettingsIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Analytics } from '@/components/analytics';
import { DatePicker } from '@/components/date-picker';
import { DottedSeparator } from '@/components/dotted-separator';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { TodayAttendanceStats } from '@/components/today-attendance-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import type { Member } from '@/features/members/types';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal';
import type { Project } from '@/features/projects/types';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { TaskStatus } from '@/features/tasks/types';
import type { Task } from '@/features/tasks/types';
import { useGetWorkspaceAnalytics } from '@/features/workspaces/api/use-get-workspace-analytics';
import { useWorkspaceFilters, type ProjectSortBy, type TaskSortBy } from '@/features/workspaces/hooks/use-workspace-filters';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus();

  const { data: workspaceAnalytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers || isAdminLoading;

  const [
    { taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy, projectSearch, projectSortBy },
    setFilters,
  ] = useWorkspaceFilters();

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; backlog: number; people: number }> = {};

    if (!projects?.documents || !tasks?.documents) return counts;

    projects.documents.forEach((project) => {
      counts[project.$id] = { total: 0, backlog: 0, people: 0 };
    });

    const projectAssignees: Record<string, Set<string>> = {};

    tasks.documents.forEach((task) => {
      if (counts[task.projectId]) {
        counts[task.projectId].total += 1;
        if (task.status === TaskStatus.BACKLOG) {
          counts[task.projectId].backlog += 1;
        }

        // Track unique assignees for each project
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          if (!projectAssignees[task.projectId]) {
            projectAssignees[task.projectId] = new Set();
          }
          task.assigneeIds.forEach((assigneeId) => {
            projectAssignees[task.projectId].add(assigneeId);
          });
        }
      }
    });

    // Set people count for each project
    Object.keys(projectAssignees).forEach((projectId) => {
      counts[projectId].people = projectAssignees[projectId].size;
    });

    return counts;
  }, [tasks?.documents, projects?.documents]);

  // Apply filters and sorting to tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks?.documents) return [];

    let filtered = [...tasks.documents];

    // Apply filters
    if (taskStatus) {
      filtered = filtered.filter((task) => task.status === taskStatus);
    }
    if (taskProjectId) {
      filtered = filtered.filter((task) => task.projectId === taskProjectId);
    }
    if (taskAssigneeId) {
      filtered = filtered.filter((task) => task.assigneeIds?.includes(taskAssigneeId));
    }
    if (taskDueDate) {
      const dueDateStr = new Date(taskDueDate).toISOString().split('T')[0];
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        const taskDueDateStr = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDueDateStr === dueDateStr;
      });
    }

    // Apply sorting
    const sortBy = taskSortBy || 'created-desc';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created-desc':
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        case 'created-asc':
          return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
        case 'due-desc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'due-asc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'project':
          return (a.project?.name || '').localeCompare(b.project?.name || '');
        default:
          return 0;
      }
    });

    return filtered.slice(0, 12);
  }, [tasks?.documents, taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy]);

  // Apply filters and sorting to projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!projects?.documents) return [];

    let filtered = [...projects.documents];

    // Apply search filter
    if (projectSearch) {
      const searchLower = projectSearch.toLowerCase();
      filtered = filtered.filter((project) => project.name.toLowerCase().includes(searchLower));
    }

    // Apply sorting
    const sortBy = projectSortBy || 'created-desc';
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc':
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        case 'created-asc':
          return new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
        case 'tasks-desc':
          return (projectTaskCounts[b.$id]?.total || 0) - (projectTaskCounts[a.$id]?.total || 0);
        case 'tasks-asc':
          return (projectTaskCounts[a.$id]?.total || 0) - (projectTaskCounts[b.$id]?.total || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects?.documents, projectSearch, projectSortBy, projectTaskCounts]);

  if (isLoading) return <PageLoader />;
  // Analytics is only required for admins
  if ((isAdmin && !workspaceAnalytics) || !tasks || !projects || !members || isAdmin === undefined) return <PageError message="Failed to load workspace data." />;

  // Backend already filters tasks and projects based on role:
  // - Admins see all tasks/projects
  // - Members only see tasks they're assigned to and projects where they have tasks
  // So we just use the data as-is and adjust UI labels/visibility

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Analytics - Only show full analytics to admins */}
      {isAdmin && workspaceAnalytics ? <Analytics data={workspaceAnalytics} /> : null}
      {isAdmin && <TodayAttendanceStats />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-6">
        <div className="flex flex-col gap-6">
          <TaskList
            data={filteredAndSortedTasks}
            total={tasks.total}
            isAdmin={isAdmin}
            projects={projects?.documents || []}
            members={(members?.documents || []) as Member[]}
            filters={{ taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy }}
            onFiltersChange={setFilters}
          />
          {/* Members list - Only show to admins */}
          {isAdmin && <MemberList data={members.documents as Member[]} total={members.total} />}
        </div>
        <ProjectList
          data={filteredAndSortedProjects}
          total={projects.total}
          projectTaskCounts={projectTaskCounts}
          isAdmin={isAdmin}
          filters={{ projectSearch, projectSortBy }}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
};

interface TaskListProps {
  data: Task[];
  total: number;
  isAdmin: boolean;
  projects: Project[];
  members: Member[];
  filters: {
    taskStatus: TaskStatus | null;
    taskProjectId: string | null;
    taskAssigneeId: string | null;
    taskDueDate: string | null;
    taskSortBy: TaskSortBy | null;
  };
  onFiltersChange: (filters: Partial<{
    taskStatus: TaskStatus | null;
    taskProjectId: string | null;
    taskAssigneeId: string | null;
    taskDueDate: string | null;
    taskSortBy: TaskSortBy | null;
  }>) => void;
}

export const TaskList = ({ data, total, isAdmin, projects, members, filters, onFiltersChange }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();

  const projectOptions = projects.map((project) => ({
    value: project.$id,
    label: project.name,
  }));

  const memberOptions = members
    .filter((member) => member.isActive !== false)
    .map((member) => ({
      value: member.$id,
      label: member.name,
    }));

  const handleStatusChange = (value: string) => {
    onFiltersChange({ taskStatus: value === 'all' ? null : (value as TaskStatus) });
  };

  const handleProjectChange = (value: string) => {
    onFiltersChange({ taskProjectId: value === 'all' ? null : value });
  };

  const handleAssigneeChange = (value: string) => {
    onFiltersChange({ taskAssigneeId: value === 'all' ? null : value });
  };

  const handleDueDateChange = (date: Date | null) => {
    onFiltersChange({ taskDueDate: date ? date.toISOString() : null });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ taskSortBy: value as TaskSortBy });
  };

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">
            {isAdmin ? 'All Tasks' : 'My Tasks'} ({total})
          </p>

          <Button title="Create Task" variant="secondary" size="icon" onClick={() => createTask(TaskStatus.TODO)}>
            <PlusIcon className="size-4 text-muted-foreground" />
          </Button>
        </div>

        <DottedSeparator className="my-4" />

        {/* Filters and Sort */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Select value={filters.taskStatus || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-full sm:w-[140px]">
                <div className="flex items-center pr-2">
                  <ListChecks className="mr-2 size-3" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectSeparator />
                <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.taskProjectId || 'all'} onValueChange={handleProjectChange}>
              <SelectTrigger className="h-8 w-full sm:w-[140px]">
                <div className="flex items-center pr-2">
                  <Folder className="mr-2 size-3" />
                  <SelectValue placeholder="Project" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                <SelectSeparator />
                {projectOptions.map((project) => (
                  <SelectItem key={project.value} value={project.value}>
                    {project.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.taskAssigneeId || 'all'} onValueChange={handleAssigneeChange}>
              <SelectTrigger className="h-8 w-full sm:w-[140px]">
                <div className="flex items-center pr-2">
                  <UserIcon className="mr-2 size-3" />
                  <SelectValue placeholder="Assignee" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                <SelectSeparator />
                {memberOptions.map((member) => (
                  <SelectItem key={member.value} value={member.value}>
                    {member.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker
              placeholder="Due date"
              className="h-8 w-full sm:w-[140px]"
              value={filters.taskDueDate ? new Date(filters.taskDueDate) : undefined}
              onChange={handleDueDateChange}
              showReset
            />

            <Select value={filters.taskSortBy || 'created-desc'} onValueChange={handleSortChange}>
              <SelectTrigger className="h-8 w-full sm:w-[140px]">
                <div className="flex items-center pr-2">
                  <ArrowDownUp className="mr-2 size-3" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">Newest first</SelectItem>
                <SelectItem value="created-asc">Oldest first</SelectItem>
                <SelectItem value="due-asc">Due soonest</SelectItem>
                <SelectItem value="due-desc">Due latest</SelectItem>
                <SelectItem value="status">By status</SelectItem>
                <SelectItem value="project">By project</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DottedSeparator className="my-4" />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {data.length === 0 && (
            <li className="col-span-full text-center text-sm text-muted-foreground">No tasks found.</li>
          )}
          {data.map((task) => (
            <li key={task.$id}>
              <Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                <Card className="rounded-lg shadow-none transition hover:opacity-75">
                  <CardContent className="flex flex-col gap-y-2 p-4 items-start">
                    <p className="line-clamp-1 text-sm font-medium">{task.name}</p>
                    <div className="flex items-center gap-x-2 text-xs text-muted-foreground min-w-0">
                      <span className="line-clamp-2 block min-w-0 flex-1">{task.project?.name}</span>
                      <div aria-hidden className="size-1 rounded-full bg-muted shrink-0" />
                      <CalendarIcon className="size-3 shrink-0" />
                      <span className="truncate shrink-0">{formatDistanceToNow(new Date(task.dueDate))}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/tasks`}>Show All</Link>
        </Button>
      </div>
    </div>
  );
};

interface ProjectListProps {
  data: Project[];
  total: number;
  projectTaskCounts: Record<string, { total: number; backlog: number; people: number }>;
  isAdmin: boolean;
  filters: {
    projectSearch: string | null;
    projectSortBy: ProjectSortBy | null;
  };
  onFiltersChange: (filters: Partial<{
    projectSearch: string | null;
    projectSortBy: ProjectSortBy | null;
  }>) => void;
}

export const ProjectList = ({ data, total, projectTaskCounts, isAdmin, filters, onFiltersChange }: ProjectListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ projectSearch: e.target.value || null });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ projectSortBy: value as ProjectSortBy });
  };

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">
            {isAdmin ? 'All Projects' : 'My Projects'} ({total})
          </p>

          {isAdmin && (
            <Button title="Create Project" variant="secondary" size="icon" onClick={createProject}>
              <PlusIcon className="size-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        <DottedSeparator className="my-4" />

        {/* Filters and Sort */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search projects..."
              value={filters.projectSearch || ''}
              onChange={handleSearchChange}
              className="h-8 flex-1 min-w-[150px]"
            />

            <Select value={filters.projectSortBy || 'created-desc'} onValueChange={handleSortChange}>
              <SelectTrigger className="h-8 w-full sm:w-[160px]">
                <div className="flex items-center pr-2">
                  <ArrowDownUp className="mr-2 size-3" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="created-desc">Newest first</SelectItem>
                <SelectItem value="created-asc">Oldest first</SelectItem>
                <SelectItem value="tasks-desc">Most tasks</SelectItem>
                <SelectItem value="tasks-asc">Fewest tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DottedSeparator className="my-4" />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {data.length === 0 && (
            <li className="col-span-full text-center text-sm text-muted-foreground">No projects found.</li>
          )}
          {data.map((project) => {
            const counts = projectTaskCounts[project.$id] || { total: 0, backlog: 0, people: 0 };

            return (
              <li key={project.$id}>
                <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
                  <Card className="rounded-lg shadow-none transition hover:opacity-75">
                    <CardContent className="flex flex-col gap-y-2 p-4 items-start">
                      <div className="flex items-center gap-x-2 w-full">
                        <ProjectAvatar name={project.name} image={project.imageUrl} className="size-8 shrink-0" fallbackClassName="text-xs" />
                        <p className="line-clamp-1 text-sm font-medium flex-1">{project.name}</p>
                      </div>
                      <div className="flex items-center gap-x-3 text-xs text-muted-foreground w-full flex-wrap">
                        <span className="line-clamp-1">{counts.total} tasks</span>
                        <div aria-hidden className="size-1 rounded-full bg-muted shrink-0" />
                        <span className="line-clamp-1">{counts.backlog} backlog</span>
                        <div aria-hidden className="size-1 rounded-full bg-muted shrink-0" />
                        <span className="line-clamp-1">{counts.people} people</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>

        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/projects`}>Show All</Link>
        </Button>
      </div>
    </div>
  );
};

interface MemberListProps {
  data: Member[];
  total: number;
}

export const MemberList = ({ data, total }: MemberListProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Members ({total})</p>

          <Button title="Manage Members" variant="secondary" size="icon" asChild>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <SettingsIcon className="size-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>

        <DottedSeparator className="my-4" />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {data.length === 0 && (
            <li className="col-span-full text-center text-sm text-muted-foreground">No members found.</li>
          )}
          {data.map((member) => (
            <li key={member.$id}>
              <Card className="rounded-lg shadow-none transition hover:opacity-75">
                <CardContent className="flex flex-col gap-y-2 p-4 items-start">
                  <p className="line-clamp-1 text-sm font-medium">{member.name}</p>
                  <div className="flex items-center gap-x-2 text-xs text-muted-foreground min-w-0">
                    <MemberAvatar name={member.name} className="size-4 shrink-0" fallbackClassName="text-[8px]" />
                    <span className="line-clamp-2 block min-w-0 flex-1">{member.email}</span>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/members`}>Show All</Link>
        </Button>
      </div>
    </div>
  );
};
