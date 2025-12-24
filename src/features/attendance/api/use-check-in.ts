import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CreateAttendanceRequest } from '../types';

export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAttendanceRequest) => {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Successfully checked in!');
      // Invalidate all attendance-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check in');
    },
  });
};
