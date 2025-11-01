import { useQuery } from '@tanstack/react-query';

export const useGetTodayAttendanceStats = (workspaceId: string) => {
  return useQuery({
    queryKey: ['today-attendance-stats', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/today/stats?workspaceId=${workspaceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch today\'s attendance stats');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!workspaceId,
  });
};
