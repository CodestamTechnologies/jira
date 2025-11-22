import { useQuery } from '@tanstack/react-query';

import { AttendanceFilters } from '../types';

interface UseGetAttendanceProps {
  workspaceId: string;
  filters?: AttendanceFilters;
  page?: number;
  limit?: number;
}

export const useGetAttendance = ({ workspaceId, filters, page, limit }: UseGetAttendanceProps) => {
  return useQuery({
    queryKey: ['attendance', workspaceId, filters?.userId, filters, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.userId) params.append('userId', filters.userId);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/attendance?workspaceId=${workspaceId}&${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch attendance');
      }

      return response.json();
    },
    enabled: !!workspaceId,
  });
};
