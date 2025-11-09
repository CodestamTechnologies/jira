'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { DottedSeparator } from '@/components/dotted-separator';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const ProjectsPageClient = () => {
  const workspaceId = useWorkspaceId();

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({
    workspaceId,
  });

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    showAll: true, // Get all tasks to calculate accurate counts
  });

  const isLoading = isLoadingProjects || isLoadingTasks;

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

  const { open: createProject } = useCreateProjectModal();

  if (isLoading) return <PageLoader />;
  if (!projects) return <PageError message="Failed to load projects." />;

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">All Projects</h1>
            <p className="text-sm text-muted-foreground">
              {projects.total} {projects.total === 1 ? 'project' : 'projects'} found
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button title="Create Project" variant="primary" onClick={createProject}>
              <PlusIcon className="size-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <DottedSeparator className="my-6" />

        {projects.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No projects found.</p>
            <Button variant="outline" className="mt-4" onClick={createProject}>
              <PlusIcon className="size-4 mr-2" />
              Create your first project
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.documents.map((project) => {
              const counts = projectTaskCounts[project.$id] || { total: 0, backlog: 0, people: 0 };

              return (
                <li key={project.$id}>
                  <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
                    <Card className="rounded-lg shadow-none transition hover:opacity-75 h-full">
                      <CardContent className="flex flex-col gap-y-3 p-4">
                        <div className="flex items-center gap-x-2 w-full">
                          <ProjectAvatar
                            name={project.name}
                            image={project.imageUrl}
                            className="size-10 shrink-0"
                            fallbackClassName="text-sm"
                          />
                          <p className="line-clamp-2 text-sm font-medium flex-1">{project.name}</p>
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
        )}
      </div>
    </div>
  );
};
