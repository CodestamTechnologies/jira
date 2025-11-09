'use client';

import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, PlusIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Analytics } from '@/components/analytics';
import { DottedSeparator } from '@/components/dotted-separator';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { TodayAttendanceStats } from '@/components/today-attendance-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();

  const { data: workspaceAnalytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers;

  const limitedTasks = useMemo(() => {
    if (!tasks?.documents) return [];
    const sorted = [...tasks.documents].sort((a, b) => {
      const dateA = new Date(a.$createdAt).getTime();
      const dateB = new Date(b.$createdAt).getTime();
      return dateB - dateA; // Most recent first
    });
    return sorted.slice(0, 12);
  }, [tasks?.documents]);

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

  if (isLoading) return <PageLoader />;
  if (!workspaceAnalytics || !tasks || !projects || !members) return <PageError message="Failed to load workspace data." />;

  return (
    <div className="flex h-full flex-col space-y-6">
      <Analytics data={workspaceAnalytics} />
      <TodayAttendanceStats />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:gap-x-6 xl:gap-y-6">
        <div className="flex flex-col gap-6">
          <TaskList data={limitedTasks} total={tasks.total} />
          <MemberList data={members.documents as Member[]} total={members.total} />
        </div>
        <ProjectList data={projects.documents} total={projects.total} projectTaskCounts={projectTaskCounts} />
      </div>
    </div>
  );
};

interface TaskListProps {
  data: Task[];
  total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Tasks ({total})</p>

          <Button title="Create Task" variant="secondary" size="icon" onClick={() => createTask(TaskStatus.TODO)}>
            <PlusIcon className="size-4 text-muted-foreground" />
          </Button>
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
}

export const ProjectList = ({ data, total, projectTaskCounts }: ProjectListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Projects ({total})</p>

          <Button title="Create Project" variant="secondary" size="icon" onClick={createProject}>
            <PlusIcon className="size-4 text-muted-foreground" />
          </Button>
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
