'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useDeleteProject } from '@/features/projects/api/use-delete-project';
import { useUpdateProject } from '@/features/projects/api/use-update-project';
import { updateProjectSchema } from '@/features/projects/schema';
import type { Project } from '@/features/projects/types';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';

interface EditProjectFormProps {
  onCancel?: () => void;
  initialValues: Project;
}

export const EditProjectForm = ({ onCancel, initialValues }: EditProjectFormProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [DeleteDialog, confirmDelete] = useConfirm('Delete project', 'This action cannot be undone.', 'destructive');

  const { mutate: updateProject, isPending: isUpdatingProject } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeletingProject } = useDeleteProject();

  const updateProjectForm = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? '',
      clientEmail: initialValues.clientEmail ?? '',
      clientAddress: initialValues.clientAddress ?? '',
      clientPhone: initialValues.clientPhone ?? '',
      isClosed: initialValues.isClosed ?? false,
    },
  });

  const onSubmit = (values: z.infer<typeof updateProjectSchema>) => {
    const finalValues: Record<string, unknown> = {
      ...values,
      image: values.image instanceof File ? values.image : '',
    };

    // Convert boolean to string for FormData compatibility
    if (values.isClosed !== undefined) {
      finalValues.isClosed = String(values.isClosed);
    }

    updateProject({
      form: finalValues as any,
      param: { projectId: initialValues.$id },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes;
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > MAX_FILE_SIZE) return toast.error('Image size cannot exceed 1 MB.');

      updateProjectForm.setValue('image', file);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();

    if (!ok) return;

    deleteProject(
      {
        param: { projectId: initialValues.$id },
      },
      {
        onSuccess: ({ data }) => {
          window.location.href = `/workspaces/${data.workspaceId}`;
        },
      },
    );
  };

  const isPending = isUpdatingProject || isDeletingProject;

  return (
    <div className="flex flex-col gap-y-4">
      <DeleteDialog />

      <Card className="size-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
          <Button
            size="sm"
            variant="secondary"
            onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}`)}
            className="gap-x-1"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <CardTitle className="text-xl font-bold">{initialValues.name}</CardTitle>
        </CardHeader>

        <div className="px-7">
          <Separator />
        </div>

        <CardContent className="p-7">
          <Form {...updateProjectForm}>
            <form onSubmit={updateProjectForm.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                <FormField
                  disabled={isPending}
                  control={updateProjectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>

                      <FormControl>
                        <Input {...field} type="text" placeholder="Enter project name" />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  disabled={isPending}
                  control={updateProjectForm.control}
                  name="image"
                  render={({ field }) => (
                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-5">
                        {field.value ? (
                          <div className="relative size-[72px] overflow-hidden rounded-md">
                            <Image
                              src={field.value instanceof File ? URL.createObjectURL(field.value) : field.value}
                              alt="Project Logo"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <Avatar className="size-[72px]">
                            <AvatarFallback>
                              <ImageIcon className="size-[36px] text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="flex flex-col">
                          <p className="text-sm">Project Icon</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, or JPEG, max 1MB</p>

                          <input
                            type="file"
                            className="hidden"
                            onChange={handleImageChange}
                            accept=".jpg, .png, .jpeg"
                            ref={inputRef}
                            disabled={isPending}
                          />

                          {field.value ? (
                            <Button
                              type="button"
                              disabled={isPending}
                              variant="destructive"
                              size="sm"
                              className="mt-2 w-fit"
                              onClick={() => {
                                field.onChange('');

                                if (inputRef.current) inputRef.current.value = '';
                              }}
                            >
                              Remove Image
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              disabled={isPending}
                              variant="outline"
                              size="sm"
                              className="mt-2 w-fit"
                              onClick={() => inputRef.current?.click()}
                            >
                              Upload Image
                            </Button>
                          )}
                        </div>
                      </div>

                      <FormMessage />
                    </div>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Client Information (for Invoicing)</h3>

                  <FormField
                    disabled={isPending}
                    control={updateProjectForm.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="client@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    disabled={isPending}
                    control={updateProjectForm.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+1234567890" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    disabled={isPending}
                    control={updateProjectForm.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="123 Main St, City, State, ZIP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Project Status</h3>

                  <FormField
                    disabled={isPending}
                    control={updateProjectForm.control}
                    name="isClosed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark project as closed</FormLabel>
                          <FormDescription>
                            Closed projects and their tasks will not be shown in the workspace. This action can be reversed.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="py-7" />

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

      <Card className="size-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold">Danger Zone</h3>

            <p className="text-sm text-muted-foreground">Deleting a project is irreversible and will remove all associated data.</p>

            <Separator className="py-7" />

            <Button
              size="sm"
              variant="destructive"
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="ml-auto mt-6 w-fit"
            >
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
