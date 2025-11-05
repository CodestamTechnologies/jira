import { useQuery } from '@tanstack/react-query';

export const useGetTeamAttendance = (workspaceId: string, date: string) => {
  return useQuery({
    queryKey: ['team-attendance', workspaceId, date],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      params.append('date', date);

      const response = await fetch(`/api/attendance/team?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch team attendance');
      }

      return response.json();
    },
    enabled: !!workspaceId && !!date,
  });
};

