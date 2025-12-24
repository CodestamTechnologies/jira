'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreateExpense } from '../api/use-create-expense';
import { createExpenseSchema } from '../schema';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { ExpenseCategory, ExpenseStatus } from '../types';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { validateBillFile, getFileTypeDescription } from '@/utils/file-validation';
// Removed createExpenseFormData import - using plain object like project form
import { formatCategoryForDisplay } from '../utils/expense-helpers';

interface CreateExpenseFormProps {
  onCancel?: () => void;
  projectId?: string;
}

/**
 * Create expense form component
 * Handles expense creation with optional bill file upload
 */
export const CreateExpenseForm = ({ onCancel, projectId }: CreateExpenseFormProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState('');

  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { mutate: createExpense, isPending } = useCreateExpense();

  // Memoize project options to prevent unnecessary re-renders
  const projectOptions = useMemo(() => {
    return projectsData?.documents || [];
  }, [projectsData?.documents]);

  const createExpenseForm = useForm<z.infer<typeof createExpenseSchema>>({
    resolver: zodResolver(createExpenseSchema),
    // Use default mode (onSubmit) for consistency with other forms
    defaultValues: {
      amount: 0,
      date: new Date(), // Date object as expected by schema
      description: '',
      category: ExpenseCategory.OTHER,
      customCategory: undefined,
      projectId: projectId || undefined,
      workspaceId: workspaceId || '', // Ensure workspaceId is always a string
      notes: undefined,
      status: ExpenseStatus.APPROVED,
    },
  });

  // Update workspaceId in form when it becomes available
  // Using useEffect to avoid side effects during render
  useEffect(() => {
    if (workspaceId && createExpenseForm.getValues('workspaceId') !== workspaceId) {
      createExpenseForm.setValue('workspaceId', workspaceId);
    }
  }, [workspaceId, createExpenseForm]);

  // Watch category to show/hide custom category field
  const selectedCategory = createExpenseForm.watch('category');

  /**
   * Handles form submission
   * Uses centralized FormData builder utility (DRY principle)
   * Zod validation happens automatically via resolver
   */
  const onSubmit = useCallback(
    async (values: z.infer<typeof createExpenseSchema>) => {
      // Zod already validates, but ensure workspaceId exists
      if (!workspaceId) {
        toast.error('Workspace ID is missing. Please refresh the page.');
        return;
      }

      /**
       * Additional validation beyond Zod schema
       * Zod handles type validation, but we add runtime checks for:
       * 1. Workspace ID availability (may be async)
       * 2. Business logic validation (amount > 0)
       * 3. Date validity checks
       * 
       * These are defensive checks that should rarely fail if Zod validation passed,
       * but provide better error messages and handle edge cases.
       */
      const description = values.description?.trim() || '';
      const category = values.category || ExpenseCategory.OTHER;
      const finalWorkspaceId = (values.workspaceId || workspaceId || '').trim();

      // Validate description (Zod already checks, but ensure non-empty after trim)
      if (!description) {
        toast.error('Description is required.');
        return;
      }

      // Validate amount (Zod checks type, we check business logic: must be > 0)
      const amount = typeof values.amount === 'number' && !isNaN(values.amount) && values.amount > 0 ? values.amount : null;
      if (!amount || amount <= 0) {
        toast.error('Amount must be greater than 0.');
        return;
      }

      // Validate workspaceId (critical for authorization and data integrity)
      if (!finalWorkspaceId) {
        toast.error('Workspace ID is missing. Please refresh the page.');
        return;
      }

      // Validate date (ensure it's a valid Date object)
      const date = values.date instanceof Date && !isNaN(values.date.getTime()) ? values.date : null;
      if (!date || isNaN(date.getTime())) {
        toast.error('Please select a valid date.');
        return;
      }

      // Validate category enum (defensive check for type safety)
      if (!Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
        toast.error('Please select a valid category.');
        return;
      }

      /**
       * Build form data payload
       * Uses plain object pattern (consistent with project forms)
       * Hono client automatically converts to FormData when File instances are present
       * 
       * Pattern: Convert all values to strings/Date strings, except File instances
       */
      const finalValues: Record<string, unknown> = {
        // Required fields
        amount: String(amount), // Convert to string for FormData compatibility
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format for server parsing
        description,
        category,
        workspaceId: finalWorkspaceId,
        status: values.status || ExpenseStatus.APPROVED,
        // File handling: File instance or empty string (Hono client handles conversion)
        billFile: selectedFile instanceof File ? selectedFile : '',
      };

      // Optional fields: only include if they have values (avoid sending undefined)
      if (values.category === ExpenseCategory.CUSTOM && (values.customCategory?.trim() || customCategory.trim())) {
        finalValues.customCategory = values.customCategory?.trim() || customCategory.trim();
      }
      if (values.projectId && values.projectId !== 'none') {
        finalValues.projectId = values.projectId;
      }
      if (values.notes?.trim()) {
        finalValues.notes = values.notes.trim();
      }

      createExpense(
        {
          // Type assertion needed - Hono client handles FormData conversion internally
          // The client expects a plain object and converts it to FormData when File instances are present
          form: finalValues as any,
        },
        {
          onSuccess: () => {
            createExpenseForm.reset();
            setSelectedFile(null);
            setCustomCategory('');
            if (onCancel) {
              onCancel();
            } else {
              router.push(`/workspaces/${workspaceId}/expenses`);
            }
          },
        },
      );
    },
    [workspaceId, customCategory, selectedFile, createExpense, createExpenseForm, onCancel, router],
  );

  /**
   * Handles file selection and validation
   * Uses centralized file validation utility (DRY principle)
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (file) {
        const validation = validateBillFile(file);
        if (!validation.valid) {
          return toast.error(validation.error || 'Invalid file.');
        }

        setSelectedFile(file);
      }
    },
    [],
  );

  /**
   * Removes selected file and resets file input
   */
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create New Expense</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        <Form {...createExpenseForm}>
          <form onSubmit={createExpenseForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                disabled={isPending}
                control={createExpenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={field.value === 0 ? '' : field.value?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty, numbers, and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            const numValue = value === '' ? 0 : parseFloat(value);
                            field.onChange(isNaN(numValue) ? 0 : numValue);
                          }
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                disabled={isPending}
                control={createExpenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split('T')[0]
                            : field.value
                              ? new Date(field.value).toISOString().split('T')[0]
                              : ''
                        }
                        onChange={(e) => {
                          // Convert date input string to Date object
                          // Add time component to avoid timezone issues
                          const dateString = e.target.value;
                          if (dateString) {
                            const dateValue = new Date(dateString + 'T00:00:00');
                            // Only update if valid date
                            if (!isNaN(dateValue.getTime())) {
                              field.onChange(dateValue);
                            }
                          } else {
                            // If empty, set to today's date
                            field.onChange(new Date());
                          }
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              disabled={isPending}
              control={createExpenseForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter expense description"
                      required
                      {...field}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                disabled={isPending}
                control={createExpenseForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={field.onChange}
                      value={field.value || ExpenseCategory.OTHER}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ExpenseCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatCategoryForDisplay(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCategory === ExpenseCategory.CUSTOM && (
                <FormField
                  disabled={isPending}
                  control={createExpenseForm.control}
                  name="customCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom category"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Sync with local state for fallback
                            setCustomCategory(value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>Enter a name for your custom category</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                disabled={isPending}
                control={createExpenseForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Workspace (No Project)</SelectItem>
                        {projectOptions.map((project) => (
                          <SelectItem key={project.$id} value={project.$id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              disabled={isPending}
              control={createExpenseForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Bill/Receipt (Optional)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bill-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Bill
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile} disabled={isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <FormDescription>Upload {getFileTypeDescription()}</FormDescription>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Expense'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
