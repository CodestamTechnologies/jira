import { client } from '@/lib/hono';
import { createMutation } from '@/lib/react-query/mutation-factory';
import { invalidateNotificationQueries } from '@/lib/react-query/cache-utils';

/**
 * Hook to mark a notification as read
 * 
 * Uses the mutation factory for consistent error handling and cache invalidation.
 * Automatically invalidates notification queries and count for cache consistency.
 * 
 * @example
 * ```tsx
 * const markRead = useMarkNotificationRead();
 * markRead.mutate('notification-123');
 * ```
 */
export const useMarkNotificationRead = createMutation<unknown, Error, string>({
  mutationFn: async (notificationId: string) => {
    const response = await client.api.notifications[':notificationId'].read.$post({
      param: { notificationId },
    });

    if (!response.ok) throw new Error('Failed to mark notification as read.');

    const { data } = await response.json();

    return data;
  },
  successMessage: 'Notification marked as read.',
  logPrefix: '[MARK_NOTIFICATION_READ]',
  showSuccessToast: false, // Don't show toast for marking as read (too noisy)
  onSuccessInvalidate: (queryClient) => {
    // Use centralized cache invalidation utility
    invalidateNotificationQueries(queryClient);
  },
});
