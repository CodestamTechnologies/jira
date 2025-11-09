'use client';

import { DottedSeparator } from '@/components/dotted-separator';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { useGetTask } from '@/features/tasks/api/use-get-task';
import { TaskBreadcrumbs } from '@/features/tasks/components/task-breadcrumbs';
import { TaskDescription } from '@/features/tasks/components/task-description';
import { TaskOverview } from '@/features/tasks/components/task-overview';
import { useTaskId } from '@/features/tasks/hooks/use-task-id';
import { TaskComments } from '@/features/tasks/components/task-comments';
import { useCurrent } from '@/features/auth/api/use-current';

export const TaskIdClient = () => {
  const taskId = useTaskId();

  const { data: task, isLoading } = useGetTask({ taskId });
  const { data: currentUser } = useCurrent();

  if (isLoading) return <PageLoader />;

  if (!task) return <PageError message="Task not found." />;

  return (
    <div className="flex flex-col">
      <TaskBreadcrumbs project={task.project} task={task} />

      <DottedSeparator className="my-6" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TaskOverview task={task} />
        <TaskDescription task={task} />
      </div>
      {currentUser && (
        <TaskComments
          taskId={task.$id}
          workspaceId={task.workspaceId}
          currentUserId={currentUser.$id}
          currentUserName={currentUser.name || currentUser.email || currentUser.$id}
        />
      )}
    </div>
  );
};
