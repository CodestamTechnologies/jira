import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateNotificationQueries } from '@/lib/react-query/cache-utils';

/**
 * Hook to delete a notification
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates notification queries and count for cache consistency.
 * 
 * @example
 * ```tsx
 * const deleteNotification = useDeleteNotification();
 * deleteNotification.mutate('notification-123');
 * ```
 */
export const useDeleteNotification = createMutation<unknown, Error, string>({
  mutationFn: async (notificationId: string) => {
    const response = await client.api.notifications[':notificationId'].$delete({
      param: { notificationId },
    });

    if (!response.ok) throw new Error('Failed to delete notification.');

    const { data } = await response.json();

    return data;
  },
  successMessage: 'Notification deleted.',
  logPrefix: '[DELETE_NOTIFICATION]',
  showSuccessToast: false, // Don't show toast for deleting notifications (too noisy)
  onSuccessInvalidate: (queryClient) => {
    // Use centralized cache invalidation utility
    invalidateNotificationQueries(queryClient);
  },
});
