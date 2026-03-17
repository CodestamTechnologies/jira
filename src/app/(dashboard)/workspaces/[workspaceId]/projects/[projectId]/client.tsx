'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Analytics } from '@/components/analytics';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetProject } from '@/features/projects/api/use-get-project';
import { useGetProjectAnalytics } from '@/features/projects/api/use-get-project-analytics';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { getProjectStatusLabel } from '@/features/projects/utils';
import { useProjectId } from '@/features/projects/hooks/use-project-id';
import { TaskViewSwitcher } from '@/features/tasks/components/task-view-switcher';

const settingsHref = (workspaceId: string, projectId: string) =>
  `/workspaces/${workspaceId}/projects/${projectId}/settings`;

export const ProjectIdClient = () => {
  const projectId = useProjectId();

  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
  const { data: projectAnalytics, isLoading: isLoadingProjectAnalytics } = useGetProjectAnalytics({ projectId });

  const isLoading = isLoadingProject || isLoadingProjectAnalytics;

  if (isLoading) return <PageLoader />;

  if (!project) return <PageError message="Project not found." />;

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center gap-x-2">
        <ProjectAvatar name={project.name} image={project.imageUrl} className="size-8" />
        <p className="text-lg font-semibold">{project.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={settingsHref(project.workspaceId, project.$id)} className="gap-x-1">
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.projectId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Project ID</p>
                <p className="text-sm font-mono">{project.projectId}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Badge variant={project.isClosed ? 'secondary' : 'default'} className="mt-0.5">
                {getProjectStatusLabel(project)}
              </Badge>
            </div>
            {project.link && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Link</p>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {project.link}
                </a>
              </div>
            )}
            {project.clientEmail && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Client</p>
                <a href={`mailto:${project.clientEmail}`} className="text-sm text-primary hover:underline">
                  {project.clientEmail}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Overview</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={settingsHref(project.workspaceId, project.$id)} className="gap-x-1">
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {project.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description added.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {projectAnalytics && <Analytics data={projectAnalytics} />}

      <TaskViewSwitcher projectId={projectId} hideProjectFilter />
    </div>
  );
};
