import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SpecialDaysInput } from '../schema';

export const useCreateSpecialDay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: SpecialDaysInput) => {
      const response = await fetch('/api/attendance/special-days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save special day');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['special-days', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] }); // Re-fetch attendance stats
    },
  });
};

