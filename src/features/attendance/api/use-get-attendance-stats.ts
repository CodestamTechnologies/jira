import { useQuery } from '@tanstack/react-query';

export const useGetAttendanceStats = (workspaceId: string, userId?: string) => {
  return useQuery({
    queryKey: ['attendance-stats', workspaceId, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/attendance/stats?workspaceId=${workspaceId}&${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch attendance stats');
      }

      return response.json();
    },
    enabled: !!workspaceId,
  });
};
