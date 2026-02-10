import { useQuery } from '@tanstack/react-query';
import { SpecialDay } from '../types';

interface UseGetSpecialDaysProps {
  workspaceId: string;
  startDate?: string;
  endDate?: string;
}

export const useGetSpecialDays = ({ workspaceId, startDate, endDate }: UseGetSpecialDaysProps) => {
  return useQuery({
    queryKey: ['special-days', workspaceId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/attendance/special-days?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch special days');
      }

      const data = await response.json();
      return data.documents as SpecialDay[];
    },
    enabled: !!workspaceId,
  });
};
