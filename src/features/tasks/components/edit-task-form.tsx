'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, Info } from 'lucide-react';

import { DatePicker } from '@/components/date-picker';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useUpdateTask } from '@/features/tasks/api/use-update-task';
import { useGetComments } from '@/features/tasks/api/use-get-comments';
import { createTaskSchema } from '@/features/tasks/schema';
import { type Task, TaskStatus } from '@/features/tasks/types';
import { useCurrent } from '@/features/auth/api/use-current';
import { cn } from '@/lib/utils';

interface EditTaskFormProps {
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl?: string }[];
  memberOptions: { id: string; name: string }[];
  initialValues: Task;
}

export const EditTaskForm = ({ onCancel, memberOptions, projectOptions, initialValues }: EditTaskFormProps) => {
  const { mutate: createTask, isPending } = useUpdateTask();
  const { data: user } = useCurrent();
  const { data: comments = [] } = useGetComments({ taskId: initialValues.$id });

  const editTaskForm = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema.omit({ workspaceId: true, description: true })),
    defaultValues: {
      ...initialValues,
      assigneeIds: initialValues.assigneeIds || [],
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : undefined,
    },
  });

  const selectedStatus = editTaskForm.watch('status');
  const hasUserCommented = comments.some((comment: { authorId: string }) => comment.authorId === user?.$id);
  const isMovingToRestrictedStatus =
    (selectedStatus === TaskStatus.IN_REVIEW && initialValues.status !== TaskStatus.IN_REVIEW) ||
    (selectedStatus === TaskStatus.DONE && initialValues.status !== TaskStatus.DONE);

  const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
    createTask(
      {
        json: values,
        param: { taskId: initialValues.$id },
      },
      {
        onSuccess: () => {
          onCancel?.();
        },
        onError: (error: any) => {
          // Error is handled by toast, but we can also set form error if needed
          if (error?.message?.includes('comment')) {
            editTaskForm.setError('status', {
              type: 'manual',
              message: error.message,
            });
          }
        },
      },
    );
  };

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Edit a task</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        <Form {...editTaskForm}>
          <form onSubmit={editTaskForm.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                disabled={isPending}
                control={editTaskForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>

                    <FormControl>
                      <Input {...field} type="text" placeholder="Enter task name" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={editTaskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>

                    <FormControl>
                      <DatePicker {...field} disabled={isPending} placeholder="Select due date" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={editTaskForm.control}
                name="assigneeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignees</FormLabel>

                    <FormControl>
                      <MultiSelect
                        disabled={isPending}
                        options={memberOptions.map((member) => ({
                          label: member.name,
                          value: member.id,
                          avatar: <MemberAvatar className="size-4" name={member.name} />,
                        }))}
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select assignees"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={editTaskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>

                    <Select disabled={isPending} defaultValue={field.value} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>{field.value ? <SelectValue placeholder="Select status" /> : 'Select status'}</SelectTrigger>
                      </FormControl>

                      <FormMessage />

                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>
                          <div className="flex items-center gap-2">
                            <span>In Review</span>
                            {!hasUserCommented && <Info className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>
                          <div className="flex items-center gap-2">
                            <span>Done</span>
                            {!hasUserCommented && <Info className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {isMovingToRestrictedStatus && !hasUserCommented && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-semibold">Comment required</p>
                            <p className="text-sm">
                              You need to add a comment before moving this task to{' '}
                              {selectedStatus === TaskStatus.IN_REVIEW ? 'In Review' : 'Done'}.
                              Please add a comment below first.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {isMovingToRestrictedStatus && hasUserCommented && (
                      <Alert className="mt-2 border-green-200 bg-green-50">
                        <Info className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <p className="text-sm">You have commented on this task. Status change is allowed.</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormDescription className="text-xs text-muted-foreground">
                      {selectedStatus === TaskStatus.IN_REVIEW || selectedStatus === TaskStatus.DONE
                        ? 'A comment is required to move to this status'
                        : ''}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={editTaskForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>

                    <Select disabled={isPending} defaultValue={field.value} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>{field.value ? <SelectValue placeholder="Select project" /> : 'Select project'}</SelectTrigger>
                      </FormControl>

                      <FormMessage />

                      <SelectContent>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar className="size-6" name={project.name} image={project.imageUrl} />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <Separator className="py-7" />

            <FormMessage />

            <div className="flex items-center justify-between">
              <Button
                disabled={isPending}
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                className={cn(!onCancel && 'invisible')}
              >
                Cancel
              </Button>

              <Button disabled={isPending} type="submit" size="lg">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
