import { Pencil, XIcon } from 'lucide-react';
import { useState, useOptimistic, startTransition } from 'react';

import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTask } from '@/features/tasks/api/use-update-task';
import type { Task } from '@/features/tasks/types';

interface TaskDescriptionProps {
  task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description);

  const { mutate: editTask, isPending } = useUpdateTask();

  // Optimistic task state
  const [optimisticTask, updateOptimisticTask] = useOptimistic(
    task,
    (state: Task, updatedDescription: string | undefined) => ({
      ...state,
      description: updatedDescription,
    })
  );

  const handleSave = () => {
    // Apply optimistic update immediately
    startTransition(() => {
      updateOptimisticTask(value || undefined);
    });

    // Exit edit mode immediately
    setIsEditing(false);

    editTask(
      {
        json: {
          description: value,
        },
        param: {
          taskId: task.$id,
        },
      },
      {
        onSuccess: () => {
          // Task will be replaced by server response via query invalidation
        },
        onError: () => {
          // Optimistic update will be automatically reverted by useOptimistic
        },
      },
    );
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Overview</p>

        <Button
          onClick={() => {
            setValue(optimisticTask.description);
            setIsEditing((prevIsEditing) => !prevIsEditing);
          }}
          size="sm"
          variant="secondary"
        >
          {isEditing ? <XIcon className="mr-2 size-4" /> : <Pencil className="mr-2 size-4" />}
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <DottedSeparator className="my-4" />

      {isEditing ? (
        <div className="flex flex-col gap-y-4">
          <Textarea
            autoFocus
            placeholder="Add a description..."
            value={value}
            rows={4}
            onChange={(e) => setValue(e.target.value)}
            disabled={isPending}
            className='text-sm'
          />

          <Button size="sm" className="ml-auto w-fit" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      ) : (
        <div className='text-sm'>{optimisticTask.description || <span className="italic text-muted-foreground">No description set...</span>}</div>
      )}
    </div>
  );
};
