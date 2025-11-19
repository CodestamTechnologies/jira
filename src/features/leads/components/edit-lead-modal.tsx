'use client';

import { ResponsiveModal } from '@/components/responsive-modal';
import { useEditLeadModal } from '@/features/leads/hooks/use-edit-lead-modal';

import { EditLeadFormWrapper } from './edit-lead-form-wrapper';

export const EditLeadModal = () => {
  const { leadId, close } = useEditLeadModal();

  return (
    <ResponsiveModal title="Edit Lead" description="Make changes to your existing lead." open={!!leadId} onOpenChange={close}>
      {leadId && <EditLeadFormWrapper id={leadId} onCancel={close} />}
    </ResponsiveModal>
  );
};
