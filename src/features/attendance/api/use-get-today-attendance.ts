import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UseGetTodayAttendanceOptions {
  enabled?: boolean;
}

export const useGetTodayAttendance = (
  workspaceId: string,
  userId?: string,
  options?: UseGetTodayAttendanceOptions
) => {
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
    enabled: options?.enabled !== undefined ? options.enabled : !!workspaceId,
  });
};
