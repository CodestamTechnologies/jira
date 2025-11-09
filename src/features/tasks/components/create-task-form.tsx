'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState, useMemo, useCallback } from 'react';
import { z } from 'zod';

import { DatePicker } from '@/components/date-picker';
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateTask } from '@/features/tasks/api/use-create-task';
import { useValidateTask } from '@/features/tasks/api/use-validate-task';
import { createTaskSchema } from '@/features/tasks/schema';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';

interface CreateTaskFormProps {
  initialStatus?: TaskStatus | null;
  initialProjectId?: string | null;
  onCancel?: () => void;
  projectOptions: { id: string; name: string; imageUrl?: string }[];
  memberOptions: { id: string; name: string }[];
}

export const CreateTaskForm = ({ initialStatus, initialProjectId, onCancel, memberOptions, projectOptions }: CreateTaskFormProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: createTask, isPending } = useCreateTask();
  const { mutate: validateTask, isPending: isValidating } = useValidateTask();

  const defaultDueDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date;
  }, []);

  const memberSelectOptions = useMemo(
    () =>
      memberOptions.map((member) => ({
        label: member.name,
        value: member.id,
        avatar: <MemberAvatar className="size-4" name={member.name} />,
      })),
    [memberOptions],
  );

  const createTaskForm = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      dueDate: defaultDueDate,
      assigneeIds: [],
      description: '',
      projectId: initialProjectId ?? undefined,
      status: initialStatus ?? TaskStatus.TODO,
      workspaceId,
    },
  });

  const handleCreateTask = useCallback(
    (values: z.infer<typeof createTaskSchema>) => {
      createTask(
        {
          json: values,
        },
        {
          onSuccess: ({ data }) => {
            createTaskForm.reset();
            setValidationError(null);
            router.push(`/workspaces/${data.workspaceId}/tasks/${data.$id}`);
          },
        },
      );
    },
    [createTask, createTaskForm, router],
  );

  const onSubmit = useCallback(
    (values: z.infer<typeof createTaskSchema>) => {
      setValidationError(null);

      validateTask(
        {
          json: {
            name: values.name,
            description: values.description,
          },
        },
        {
          onSuccess: ({ data }) => {
            if (data.error) {
              setValidationError(data.message);
            } else {
              handleCreateTask(values);
            }
          },
          onError: () => {
            handleCreateTask(values);
          },
        },
      );
    },
    [validateTask, handleCreateTask],
  );

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create a new task</CardTitle>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        <Form {...createTaskForm}>
          <form onSubmit={createTaskForm.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField
                disabled={isPending || isValidating}
                control={createTaskForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Name</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="e.g., Implement user authentication system"
                        maxLength={200}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending || isValidating}
                control={createTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>

                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add detailed context about the task..."
                        rows={4}
                        maxLength={2000}
                        disabled={isPending || isValidating}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending || isValidating}
                control={createTaskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>

                    <FormControl>
                      <DatePicker {...field} disabled={isPending || isValidating} placeholder="Select due date" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending || isValidating}
                control={createTaskForm.control}
                name="assigneeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignees</FormLabel>

                    <FormControl>
                      <MultiSelect
                        disabled={isPending || isValidating}
                        options={memberSelectOptions}
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
                disabled={isPending || isValidating}
                control={createTaskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>

                    <Select disabled={isPending || isValidating} defaultValue={field.value} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>{field.value ? <SelectValue placeholder="Select status" /> : 'Select status'}</SelectTrigger>
                      </FormControl>

                      <FormMessage />

                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={createTaskForm.control}
                name="projectId"
                render={({ field }) => {
                  const selectedProject = projectOptions.find((p) => p.id === field.value);

                  return (
                    <FormItem>
                      <FormLabel>Project</FormLabel>

                      <Select disabled={isPending || isValidating} value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            {selectedProject ? (
                              <div className="flex items-center gap-x-2">
                                <ProjectAvatar className="size-4" name={selectedProject.name} image={selectedProject.imageUrl} />
                                <SelectValue>{selectedProject.name}</SelectValue>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select project" />
                            )}
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {projectOptions.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center gap-x-2">
                                <ProjectAvatar className="size-4" name={project.name} image={project.imageUrl} />
                                <span>{project.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            {validationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="size-4" />
                <AlertTitle className="sr-only">Task needs improvement</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <DottedSeparator className="py-7" />

            <FormMessage />

            <div className="flex items-center justify-between">
              <Button
                disabled={isPending || isValidating}
                type="button"
                size="lg"
                variant="secondary"
                onClick={onCancel}
                className={cn(!onCancel && 'invisible')}
              >
                Cancel
              </Button>

              <Button disabled={isPending || isValidating} type="submit" size="lg">
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
