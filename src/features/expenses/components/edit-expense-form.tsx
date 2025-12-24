'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
import { useUpdateExpense } from '../api/use-update-expense';
import { updateExpenseSchema } from '../schema';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { ExpenseCategory, ExpenseStatus, type Expense } from '../types';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useGetExpense } from '../api/use-get-expense';
import { validateBillFile, getFileTypeDescription } from '@/utils/file-validation';
import { formatCategoryForDisplay } from '../utils/expense-helpers';

interface EditExpenseFormProps {
  expenseId: string;
  onCancel?: () => void;
}

/**
 * Edit expense form component
 * Handles expense updates with optional bill file replacement
 */
export const EditExpenseForm = ({ expenseId, onCancel }: EditExpenseFormProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customCategory, setCustomCategory] = useState('');

  const { data: expense, isLoading: isLoadingExpense } = useGetExpense(expenseId);
  const { data: projectsData, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { mutate: updateExpense, isPending } = useUpdateExpense();

  // Memoize project options to prevent unnecessary re-renders
  const projectOptions = useMemo(() => {
    return projectsData?.documents || [];
  }, [projectsData?.documents]);

  const editExpenseForm = useForm<z.infer<typeof updateExpenseSchema>>({
    resolver: zodResolver(updateExpenseSchema),
    defaultValues: {
      workspaceId,
    },
  });

  // Populate form when expense data loads
  useEffect(() => {
    if (expense) {
      editExpenseForm.reset({
        amount: expense.amount,
        date: new Date(expense.date),
        description: expense.description,
        category: expense.category as ExpenseCategory,
        customCategory: expense.customCategory,
        projectId: expense.projectId,
        workspaceId: expense.workspaceId,
        notes: expense.notes,
        status: expense.status,
      });
      if (expense.customCategory) {
        setCustomCategory(expense.customCategory);
      }
    }
  }, [expense, editExpenseForm]);

  // Watch category to show/hide custom category field
  const selectedCategory = editExpenseForm.watch('category');

  /**
   * Handles form submission for expense updates
   * 
   * Key differences from create form:
   * - Supports partial updates (only changed fields sent)
   * - Uses same plain object pattern for consistency (DRY principle)
   * - Zod validation happens automatically via resolver
   * 
   * Pattern: Only include fields that have values (undefined fields are omitted)
   */
  const onSubmit = useCallback(
    async (values: z.infer<typeof updateExpenseSchema>) => {
      /**
       * Workspace ID validation
       * Critical for authorization - must be present for all operations
       */
      if (!workspaceId) {
        toast.error('Workspace ID is missing. Please refresh the page.');
        return;
      }

      const finalWorkspaceId = (values.workspaceId || workspaceId || '').trim();
      if (!finalWorkspaceId) {
        toast.error('Workspace ID is missing. Please refresh the page.');
        return;
      }

      /**
       * Build form data payload for partial update
       * Only include fields that have values (undefined = no change)
       * Uses same pattern as create form for consistency
       */
      const finalValues: Record<string, unknown> = {
        workspaceId: finalWorkspaceId, // Always required for authorization
      };

      // Amount: only update if provided and valid
      if (values.amount !== undefined && values.amount !== null) {
        const amount = typeof values.amount === 'number' && !isNaN(values.amount) && values.amount > 0 ? values.amount : null;
        if (amount) {
          finalValues.amount = String(amount); // Convert to string for FormData
        }
      }

      // Date: only update if provided and valid
      if (values.date) {
        const date = values.date instanceof Date && !isNaN(values.date.getTime()) ? values.date : null;
        if (date) {
          finalValues.date = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        }
      }

      // Description: only update if provided
      if (values.description?.trim()) {
        finalValues.description = values.description.trim();
      }

      // Category: only update if provided
      if (values.category) {
        finalValues.category = values.category;
        // Handle custom category (only if category is CUSTOM)
        if (values.category === ExpenseCategory.CUSTOM && (values.customCategory?.trim() || customCategory.trim())) {
          finalValues.customCategory = values.customCategory?.trim() || customCategory.trim();
        }
      }

      // Project ID: can be set to empty string to remove project association
      if (values.projectId !== undefined) {
        finalValues.projectId = values.projectId && values.projectId !== 'none' ? values.projectId : '';
      }

      // Notes: only update if provided
      if (values.notes?.trim()) {
        finalValues.notes = values.notes.trim();
      }

      // Status: only update if provided
      if (values.status) {
        finalValues.status = values.status;
      }

      // File handling: File instance or empty string (Hono client handles conversion)
      finalValues.billFile = selectedFile instanceof File ? selectedFile : '';

      updateExpense(
        {
          param: { expenseId },
          form: finalValues as any, // Type assertion needed - Hono client handles FormData conversion
        },
        {
          onSuccess: () => {
            editExpenseForm.reset();
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
    [workspaceId, customCategory, selectedFile, updateExpense, expenseId, editExpenseForm, onCancel, router],
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

  if (isLoadingExpense) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading expense...</div>
        </CardContent>
      </Card>
    );
  }

  if (!expense) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Expense not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Edit Expense</CardTitle>
      </CardHeader>

      <div className="px-7">
        <Separator />
      </div>

      <CardContent className="p-7">
        <Form {...editExpenseForm}>
          <form onSubmit={editExpenseForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                disabled={isPending}
                control={editExpenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={field.value === 0 || !field.value ? '' : field.value?.toString() || ''}
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
                control={editExpenseForm.control}
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
                          // Add time component to avoid timezone issues (consistent with create form)
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
              control={editExpenseForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter expense description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                disabled={isPending}
                control={editExpenseForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  control={editExpenseForm.control}
                  name="customCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Category Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter custom category"
                          {...field}
                          value={field.value || customCategory || ''}
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
                control={editExpenseForm.control}
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
              control={editExpenseForm.control}
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
                  id="bill-file-edit"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {expense.billFileId ? 'Replace Bill' : 'Upload Bill'}
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile} disabled={isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {expense.billFileId && !selectedFile && (
                  <span className="text-sm text-muted-foreground">Bill already uploaded</span>
                )}
              </div>
              <FormDescription>
                Upload {getFileTypeDescription()}. Replacing will delete the old file.
              </FormDescription>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update Expense'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
