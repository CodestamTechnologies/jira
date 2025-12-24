'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateLead } from '@/features/leads/api/use-update-lead';
import { createLeadSchema, LeadSource, LeadStatus, LeadPriority, Lead } from '../../../../data/lead-schema';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

interface EditLeadFormProps {
  onCancel?: () => void;
  memberOptions: { label: string; value: string }[];
  initialValues: Lead;
}

export const EditLeadForm = ({ onCancel, memberOptions, initialValues }: EditLeadFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate: updateLead, isPending } = useUpdateLead();

  const editLeadForm = useForm<z.infer<typeof createLeadSchema>>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: initialValues.name,
      email: initialValues.email,
      phone: initialValues.phone || '',
      company: initialValues.company || '',
      website: initialValues.website || '',
      source: initialValues.source,
      status: initialValues.status,
      priority: initialValues.priority,
      description: initialValues.description || '',
      notes: initialValues.notes || '',
      assigneeIds: initialValues.assigneeIds || [],
    },
  });

  const onSubmit = (values: z.infer<typeof createLeadSchema>) => {
    updateLead(
      {
        leadId: initialValues.id,
        updateData: values,
        workspaceId,
      },
      {
        onSuccess: () => {
          onCancel?.();
        },
      }
    );
  };

  return (
    <Card className="w-full h-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Edit a lead</CardTitle>
      </CardHeader>
      <div className="px-7">
        <Separator />
      </div>
      <CardContent className="p-7">
        <Form {...editLeadForm}>
          <form onSubmit={editLeadForm.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={editLeadForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={editLeadForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={editLeadForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company */}
              <FormField
                control={editLeadForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Website */}
              <FormField
                control={editLeadForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source */}
              <FormField
                control={editLeadForm.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadSource.WEBSITE}>Website</SelectItem>
                        <SelectItem value={LeadSource.REFERRAL}>Referral</SelectItem>
                        <SelectItem value={LeadSource.SOCIAL_MEDIA}>Social Media</SelectItem>
                        <SelectItem value={LeadSource.EMAIL}>Email</SelectItem>
                        <SelectItem value={LeadSource.PHONE}>Phone</SelectItem>
                        <SelectItem value={LeadSource.OTHER}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={editLeadForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadStatus.NEW}>New</SelectItem>
                        <SelectItem value={LeadStatus.CONTACTED}>Contacted</SelectItem>
                        <SelectItem value={LeadStatus.QUALIFIED}>Qualified</SelectItem>
                        <SelectItem value={LeadStatus.PROPOSAL}>Proposal</SelectItem>
                        <SelectItem value={LeadStatus.NEGOTIATION}>Negotiation</SelectItem>
                        <SelectItem value={LeadStatus.CLOSED_WON}>Closed Won</SelectItem>
                        <SelectItem value={LeadStatus.CLOSED_LOST}>Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={editLeadForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadPriority.LOW}>Low</SelectItem>
                        <SelectItem value={LeadPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={LeadPriority.HIGH}>High</SelectItem>
                        <SelectItem value={LeadPriority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={editLeadForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the lead..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={editLeadForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignees */}
            <FormField
              control={editLeadForm.control}
              name="assigneeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={memberOptions}
                      selected={field.value}
                      onChange={field.onChange}
                      placeholder="Select assignees"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex items-center justify-between">
              <Button type="button" size="lg" variant="secondary" onClick={onCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
