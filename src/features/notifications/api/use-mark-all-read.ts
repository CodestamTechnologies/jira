import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/hono';

/**
 * Hook to mark all notifications as read for the current user
 * Automatically invalidates notification queries and count for cache consistency
 */
export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.notifications['mark-all-read'].$post();

      if (!response.ok) throw new Error('Failed to mark all notifications as read.');

      const { data } = await response.json();

      return data;
    },
    onSuccess: () => {
      // Invalidate all notification-related queries for cache consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
