'use client';

import { useOptimistic } from 'react';
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
import type { Task } from '@/features/tasks/types';

export const TaskIdClient = () => {
  const taskId = useTaskId();

  const { data: task, isLoading } = useGetTask({ taskId });
  const { data: currentUser } = useCurrent();

  // Optimistic task state for task updates
  const [optimisticTask, updateOptimisticTask] = useOptimistic(
    task,
    (state: Task | undefined, updatedTask: Partial<Task>) => {
      if (!state) return state;
      return { ...state, ...updatedTask };
    }
  );

  if (isLoading) return <PageLoader />;

  if (!task) return <PageError message="Task not found." />;

  // Use optimistic task if available, otherwise fall back to server task
  const displayTask = optimisticTask || task;

  return (
    <div className="flex flex-col">
      <TaskBreadcrumbs project={displayTask.project} task={displayTask} />

      <DottedSeparator className="my-6" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TaskOverview task={displayTask} />
        <TaskDescription task={displayTask} />
      </div>
      {currentUser && (
        <TaskComments
          taskId={displayTask.$id}
          workspaceId={displayTask.workspaceId}
          currentUserId={currentUser.$id}
          currentUserName={currentUser.name || currentUser.email || currentUser.$id}
        />
      )}
    </div>
  );
};
