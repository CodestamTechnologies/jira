'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
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
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { mutate: updateExpense, isPending } = useUpdateExpense();

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

  const selectedCategory = editExpenseForm.watch('category');

  const onSubmit = (values: z.infer<typeof updateExpenseSchema>) => {
    const formData = new FormData();
    formData.append('workspaceId', values.workspaceId);
    
    if (values.amount !== undefined) {
      formData.append('amount', values.amount.toString());
    }
    if (values.date) {
      formData.append('date', values.date.toISOString());
    }
    if (values.description) {
      formData.append('description', values.description);
    }
    if (values.category) {
      formData.append('category', values.category);
      if (values.category === ExpenseCategory.CUSTOM && customCategory) {
        formData.append('customCategory', customCategory);
      }
    }
    if (values.projectId !== undefined) {
      formData.append('projectId', values.projectId || '');
    }
    if (values.notes !== undefined) {
      formData.append('notes', values.notes || '');
    }
    if (values.status) {
      formData.append('status', values.status);
    }
    if (selectedFile) {
      formData.append('billFile', selectedFile);
    }

    updateExpense(
      {
        param: { expenseId },
        form: formData,
      },
      {
        onSuccess: () => {
          if (onCancel) {
            onCancel();
          } else {
            router.push(`/workspaces/${workspaceId}/expenses`);
          }
        },
      },
    );
  };

  /**
   * Handles file selection and validation
   * Uses centralized file validation utility
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const validation = validateBillFile(file);
      if (!validation.valid) {
        return toast.error(validation.error || 'Invalid file.');
      }

      setSelectedFile(file);
      setExistingBillFileId(undefined); // New file selected, clear existing
    } else {
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                        {...field}
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
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
                <FormItem>
                  <FormLabel>Custom Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>Enter a name for your custom category</FormDescription>
                </FormItem>
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
                        {projectsData?.documents.map((project) => (
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
