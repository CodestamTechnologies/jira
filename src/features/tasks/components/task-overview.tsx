import { Pencil } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import type { Task } from '@/features/tasks/types';
import { snakeCaseToTitleCase } from '@/lib/utils';
import { getStatusVariant } from './columns';

import { OverviewProperty } from './overview-property';
import { TaskDate } from './task-date';

interface TaskOverviewProps {
  task: Task;
}

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();

  return (
    <div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>

          <Button onClick={() => open(task.$id)} size="sm" variant="secondary">
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-y-4">
          <OverviewProperty label="Assignees">
            <div className="flex flex-wrap gap-2">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map((assignee) => (
                  <div key={assignee.$id} className="flex items-center gap-x-2">
                    <MemberAvatar name={assignee.name} className="size-6" />
                    <p className="text-sm font-medium">{assignee.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No assignees</p>
              )}
            </div>
          </OverviewProperty>

          <OverviewProperty label="Due Date">
            <TaskDate value={task.dueDate} className="text-sm font-medium" />
          </OverviewProperty>

          <OverviewProperty label="Status">
            <Badge variant={getStatusVariant(task.status)}>{snakeCaseToTitleCase(task.status)}</Badge>
          </OverviewProperty>
        </div>
      </div>
    </div>
  );
};
