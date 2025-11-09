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
        const errorData = await response.json();
        console.log(errorData);
        const errorMessage = errorData.error || errorData.message || 'Failed to check out';
        const errorWithData = new Error(errorMessage);
        (errorWithData as any).uncommentedTasks = errorData.uncommentedTasks;
        throw errorWithData;
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Successfully checked out!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
    },
    onError: (error: Error) => {
      const errorWithData = error as any;
      if (errorWithData.uncommentedTasks && errorWithData.uncommentedTasks.length > 0) {
        // Don't show toast for uncommented tasks - dialog will show details
        return;
      }
      toast.error(error.message || 'Failed to check out');
    },
  });
};
