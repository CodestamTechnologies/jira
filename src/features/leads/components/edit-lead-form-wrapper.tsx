import { Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetLead } from '@/features/leads/api/use-get-lead';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

import { EditLeadForm } from './edit-lead-form';

interface EditLeadFormWrapperProps {
  id: string;
  onCancel: () => void;
}

export const EditLeadFormWrapper = ({ id, onCancel }: EditLeadFormWrapperProps) => {
  const workspaceId = useWorkspaceId();

  const { data: initialValues, isLoading: isLoadingLead } = useGetLead({
    leadId: id,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

  // Filter out inactive members for lead assignment, but include currently assigned members even if inactive
  const currentAssigneeIds = initialValues?.assigneeIds || [];
  const memberOptions = members?.documents
    .filter((member) => {
      // Include active members or members who are currently assigned to this lead
      return member.isActive !== false || currentAssigneeIds.includes(member.$id);
    })
    .map((member) => ({
      label: member.name,
      value: member.$id,
    })) || [];

  const isLoading = isLoadingLead || isLoadingMembers;

  if (isLoading) {
    return (
      <Card className="h-[714px] w-full border-none shadow-none">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!initialValues) return null;

  return (
    <EditLeadForm
      onCancel={onCancel}
      memberOptions={memberOptions ?? []}
      initialValues={initialValues}
    />
  );
};
