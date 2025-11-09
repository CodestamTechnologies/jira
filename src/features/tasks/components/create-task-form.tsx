'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateTask } from '@/features/tasks/api/use-create-task';
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
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

  const { mutate: createTask, isPending } = useCreateTask();

  // Set default due date to 2 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 2);

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

  const onSubmit = (values: z.infer<typeof createTaskSchema>) => {
    createTask(
      {
        json: values,
      },
      {
        onSuccess: ({ data }) => {
          createTaskForm.reset();
          router.push(`/workspaces/${data.workspaceId}/tasks/${data.$id}`);
        },
      },
    );
  };

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
                disabled={isPending}
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
                    <p className="text-xs text-muted-foreground">
                      Be specific and descriptive. Include what needs to be done and why.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={createTaskForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>

                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide detailed context about the task. What needs to be done? What are the requirements? What is the expected outcome?"
                        rows={5}
                        maxLength={2000}
                        disabled={isPending}
                      />
                    </FormControl>

                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Add clear details about the task requirements, acceptance criteria, and expected outcomes.
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={createTaskForm.control}
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
                control={createTaskForm.control}
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
                control={createTaskForm.control}
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
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={createTaskForm.control}
                name="projectId"
                render={({ field }) => {
                  const selectedProject = projectOptions.find((p) => p.id === field.value);

                  return (
                    <FormItem>
                      <FormLabel>Project</FormLabel>

                      <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isPending}
                              className={cn('w-full justify-between', !field.value && 'text-muted-foreground')}
                            >
                              {selectedProject ? (
                                <div className="flex items-center gap-x-2">
                                  <ProjectAvatar className="size-4" name={selectedProject.name} image={selectedProject.imageUrl} />
                                  <span>{selectedProject.name}</span>
                                </div>
                              ) : (
                                <span>Select project</span>
                              )}
                              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search projects..." />
                            <CommandList>
                              <CommandEmpty>No project found.</CommandEmpty>
                              <CommandGroup>
                                {projectOptions.map((project) => (
                                  <CommandItem
                                    key={project.id}
                                    value={project.name}
                                    onSelect={() => {
                                      field.onChange(project.id);
                                      setProjectPopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-x-2">
                                      <ProjectAvatar className="size-4" name={project.name} image={project.imageUrl} />
                                      <span>{project.name}</span>
                                    </div>
                                    <Check className={cn('ml-auto size-4', field.value === project.id ? 'opacity-100' : 'opacity-0')} />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DottedSeparator className="py-7" />

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
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
