import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { UpdateAttendanceRequest } from '../types';

export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAttendanceRequest) => {
      const response = await fetch('/api/attendance/check-out', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        throw new Error(error.message || 'Failed to check out');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Successfully checked out!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check out');
    },
  });
};
