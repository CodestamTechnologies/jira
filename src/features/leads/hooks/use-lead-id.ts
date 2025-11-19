import { useParams } from 'next/navigation';

export const useLeadId = () => {
  const params = useParams();

  return params.leadId as string;
};

