import { useQuery } from '@tanstack/react-query';

export const useGetTodayAttendance = (workspaceId: string, userId?: string) => {
  return useQuery({
    queryKey: ['today-attendance', workspaceId, userId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await fetch(`/api/attendance/today?workspaceId=${workspaceId}&${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch today\'s attendance');
      }

      return response.json();
    },
    enabled: !!workspaceId,
  });
};
