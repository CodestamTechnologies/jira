'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowDownUp, CalendarIcon, Folder, ListChecks, PlusIcon, SettingsIcon, UserIcon, Users, Briefcase, Clock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useGetLeads } from '@/features/leads/api/use-get-leads';
import { useGetTodayAttendance } from '@/features/attendance/api/use-get-today-attendance';
import { useGetTeamAttendance } from '@/features/attendance/api/use-get-team-attendance';
import { useCurrent } from '@/features/auth/api/use-current';
import type { TaskListProps, ProjectListProps, MemberListProps, Lead } from './types';
import { MyMemberDetails } from './components/my-member-details';

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const { data: user } = useCurrent();

  const { data: workspaceAnalytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });
  const { data: leads, isLoading: isLoadingLeads } = useGetLeads({ workspaceId });

  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers || isLoadingLeads || isAdminLoading;

  // Get today's date for team attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: teamAttendanceData } = useGetTeamAttendance({
    workspaceId,
    date: today,
    enabled: !!isAdmin && !!workspaceId,
  });

  // Get current logged-in member
  const currentMember = useMemo(() => {
    if (!user || !members?.documents) return null;
    const member = members.documents.find((m) => m.userId === user.$id) as Member | undefined;
    return member;
  }, [user, members?.documents]);

  // Get ALL tasks assigned to current user using assigneeId filter
  // This bypasses project filtering and gets all user's tasks
  // Use a large limit to fetch all tasks for dashboard stats (not paginated)
  const { data: myTasksData } = useGetTasks({
    workspaceId,
    assigneeId: currentMember?.$id || null,
    showAll: true, // Get all tasks including old done ones
    page: 1,
    limit: 10000, // Large limit to get all tasks for dashboard stats
  });

  // For stats calculation, prioritize myTasksData (which has all user's tasks)
  // Fallback to filtering from all tasks if myTasksData is not available
  const tasksForStats = useMemo(() => {
    if (!currentMember) {
      return [];
    }

    // First try to use myTasksData (filtered by assigneeId from API)
    if (myTasksData?.documents && myTasksData.documents.length > 0) {
      return myTasksData.documents;
    }

    // Fallback: filter from all tasks
    if (tasks?.documents && tasks.documents.length > 0) {
      const filtered = tasks.documents.filter((task) => {
        if (!task.assigneeIds) {
          return false;
        }
        if (!Array.isArray(task.assigneeIds)) {
          return false;
        }
        return task.assigneeIds.includes(currentMember.$id);
      });
      return filtered;
    }

    return [];
  }, [myTasksData?.documents, tasks?.documents, currentMember]);

  // Get current member's today attendance
  const { data: currentMemberAttendance } = useGetTodayAttendance(workspaceId, user?.$id);

  const [
    { taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy, projectSearch, projectSortBy },
    setFilters,
  ] = useWorkspaceFilters();

  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; backlog: number; people: number }> = {};

    // For non-admin users, use myTasksData which has all their tasks (bypasses project filtering)
    // For admins, use the regular tasks query
    const tasksToUse = !isAdmin && currentMember && myTasksData?.documents
      ? myTasksData.documents
      : tasks?.documents;

    if (!projects?.documents || !tasksToUse) return counts;

    projects.documents.forEach((project) => {
      counts[project.$id] = { total: 0, backlog: 0, people: 0 };
    });

    const projectAssignees: Record<string, Set<string>> = {};

    tasksToUse.forEach((task) => {
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
  }, [tasks?.documents, myTasksData?.documents, projects?.documents, isAdmin, currentMember]);

  // Apply filters and sorting to tasks
  // For non-admin users, use myTasksData (which bypasses project filtering)
  // For admins, use the regular tasks query
  const filteredAndSortedTasks = useMemo(() => {
    // For non-admin users, use myTasksData which has all their tasks (bypasses project filtering)
    const tasksToUse = !isAdmin && currentMember && myTasksData?.documents
      ? myTasksData.documents
      : tasks?.documents;

    if (!tasksToUse || tasksToUse.length === 0) {
      return [];
    }

    let filtered = [...tasksToUse];

    // For non-admin users, tasks are already filtered by assigneeId in myTasksData
    // But if using regular tasks query, filter by assignee
    if (isAdmin && !taskAssigneeId) {
      // Admins see all tasks when no assignee filter is set
    } else if (!isAdmin && currentMember && !taskAssigneeId) {
      // If using regular tasks (fallback), filter to show only their assigned tasks
      filtered = filtered.filter((task) => task.assigneeIds?.includes(currentMember.$id));
    }

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
  }, [tasks?.documents, myTasksData?.documents, taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy, isAdmin, currentMember]);

  // Apply filters and sorting to projects
  const filteredAndSortedProjects = useMemo(() => {
    if (!projects?.documents) {
      return [];
    }

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

      {/* My Details - Show for all logged-in members */}
      {currentMember && (
        <MyMemberDetails
          member={currentMember}
          tasks={myTasksData?.documents || tasksForStats}
          leads={leads?.documents || []}
          projects={projects?.documents || []}
          attendance={currentMemberAttendance}
          workspaceId={workspaceId}
          totalTasks={myTasksData?.total}
        />
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-6">
        <div className="flex flex-col gap-6">
          <TaskList
            data={filteredAndSortedTasks}
            total={!isAdmin && currentMember && myTasksData?.total
              ? myTasksData.total
              : tasks.total}
            isAdmin={isAdmin}
            projects={projects?.documents || []}
            members={(members?.documents || []) as Member[]}
            filters={{ taskStatus, taskProjectId, taskAssigneeId, taskDueDate, taskSortBy }}
            onFiltersChange={setFilters}
          />
          {/* Members list - Only show to admins */}
          {isAdmin && (
            <MemberList
              data={members.documents as Member[]}
              total={members.total}
              tasks={tasks?.documents || []}
              leads={leads?.documents || []}
              projects={projects?.documents || []}
              teamAttendance={teamAttendanceData || []}
            />
          )}
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



export const MemberList = ({ data, total, tasks, leads, projects, teamAttendance }: MemberListProps) => {
  const workspaceId = useWorkspaceId();

  // Calculate member statistics
  const memberStats = useMemo(() => {
    const stats: Record<string, {
      tasks: { total: number; todo: number; inProgress: number; done: number; backlog: number };
      leads: number;
      projects: number;
      attendance: { status?: string; checkInTime?: string; checkOutTime?: string; totalHours?: number } | null;
    }> = {};

    // Initialize stats for all members
    data.forEach((member) => {
      stats[member.$id] = {
        tasks: { total: 0, todo: 0, inProgress: 0, done: 0, backlog: 0 },
        leads: 0,
        projects: 0,
        attendance: null,
      };
    });

    // Calculate task counts per member
    tasks.forEach((task) => {
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        task.assigneeIds.forEach((assigneeId) => {
          if (stats[assigneeId]) {
            stats[assigneeId].tasks.total += 1;
            switch (task.status) {
              case TaskStatus.TODO:
                stats[assigneeId].tasks.todo += 1;
                break;
              case TaskStatus.IN_PROGRESS:
                stats[assigneeId].tasks.inProgress += 1;
                break;
              case TaskStatus.DONE:
                stats[assigneeId].tasks.done += 1;
                break;
              case TaskStatus.BACKLOG:
                stats[assigneeId].tasks.backlog += 1;
                break;
            }
          }
        });
      }
    });

    // Calculate lead counts per member
    leads.forEach((lead) => {
      if (lead.assigneeIds && lead.assigneeIds.length > 0) {
        lead.assigneeIds.forEach((assigneeId: string) => {
          if (stats[assigneeId]) {
            stats[assigneeId].leads += 1;
          }
        });
      }
    });

    // Calculate project counts per member (projects where member has tasks)
    const memberProjects = new Map<string, Set<string>>();
    tasks.forEach((task) => {
      if (task.assigneeIds && task.assigneeIds.length > 0) {
        task.assigneeIds.forEach((assigneeId) => {
          if (!memberProjects.has(assigneeId)) {
            memberProjects.set(assigneeId, new Set());
          }
          memberProjects.get(assigneeId)?.add(task.projectId);
        });
      }
    });
    memberProjects.forEach((projectIds, memberId) => {
      if (stats[memberId]) {
        stats[memberId].projects = projectIds.size;
      }
    });

    // Map team attendance to member stats
    teamAttendance.forEach((item) => {
      const member = data.find((m) => m.userId === item.member?.userId);
      if (member && stats[member.$id]) {
        stats[member.$id].attendance = item.attendance ? {
          status: item.attendance.status,
          checkInTime: item.attendance.checkInTime,
          checkOutTime: item.attendance.checkOutTime,
          totalHours: item.attendance.totalHours,
        } : null;
      }
    });

    return stats;
  }, [data, tasks, leads, projects, teamAttendance]);

  const getAttendanceStatusBadge = (attendance: { status?: string } | null) => {
    if (!attendance || !attendance.status) {
      return <Badge variant="secondary" className="text-xs">Not checked in</Badge>;
    }

    const status = attendance.status.toLowerCase();
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 text-xs">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 text-xs">Absent</Badge>;
      case 'half-day':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Half Day</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{attendance.status}</Badge>;
    }
  };

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

        <ul className="grid grid-cols-1 gap-4">
          {data.length === 0 && (
            <li className="col-span-full text-center text-sm text-muted-foreground">No members found.</li>
          )}
          {data.map((member) => {
            const stats = memberStats[member.$id] || {
              tasks: { total: 0, todo: 0, inProgress: 0, done: 0, backlog: 0 },
              leads: 0,
              projects: 0,
              attendance: null,
            };

            return (
              <li key={member.$id}>
                <Link href={`/workspaces/${workspaceId}/members/${member.userId}`}>
                  <Card className="rounded-lg shadow-none transition hover:opacity-75 hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <MemberAvatar name={member.name} className="size-10 shrink-0" fallbackClassName="text-xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                            {getAttendanceStatusBadge(stats.attendance)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-3">{member.email}</p>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Tasks */}
                            <div className="flex items-center gap-1.5">
                              <ListChecks className="size-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Tasks:</span>
                              <span className="font-medium">{stats.tasks.total}</span>
                              {stats.tasks.inProgress > 0 && (
                                <span className="text-blue-600">({stats.tasks.inProgress} active)</span>
                              )}
                            </div>

                            {/* Leads */}
                            <div className="flex items-center gap-1.5">
                              <Users className="size-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Leads:</span>
                              <span className="font-medium">{stats.leads}</span>
                            </div>

                            {/* Projects */}
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="size-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Projects:</span>
                              <span className="font-medium">{stats.projects}</span>
                            </div>

                            {/* Attendance Time */}
                            {stats.attendance?.checkInTime && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {stats.attendance.checkOutTime ? 'Checked out' : 'Checked in'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Task Status Breakdown */}
                          {(stats.tasks.todo > 0 || stats.tasks.inProgress > 0 || stats.tasks.done > 0) && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                              {stats.tasks.todo > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  <span className="font-medium text-blue-600">{stats.tasks.todo}</span> todo
                                </span>
                              )}
                              {stats.tasks.inProgress > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  <span className="font-medium text-purple-600">{stats.tasks.inProgress}</span> in progress
                                </span>
                              )}
                              {stats.tasks.done > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  <span className="font-medium text-green-600">{stats.tasks.done}</span> done
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>

        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href={`/workspaces/${workspaceId}/members`}>Show All</Link>
        </Button>
      </div>
    </div>
  );
};
