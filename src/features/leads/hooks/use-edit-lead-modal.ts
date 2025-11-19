import { parseAsString, useQueryState } from 'nuqs';

export const useEditLeadModal = () => {
  const [leadId, setLeadId] = useQueryState('edit-lead', parseAsString);

  const open = (id: string) => setLeadId(id);
  const close = () => setLeadId(null);

  return {
    leadId,
    setLeadId,
    open,
    close,
  };
};
