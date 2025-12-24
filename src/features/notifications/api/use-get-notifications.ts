import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
import type { NotificationType } from '../types';

interface UseGetNotificationsProps {
  userId: string;
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export const useGetNotifications = ({
  userId,
  read,
  type,
  limit = 20,
  offset = 0,
}: UseGetNotificationsProps) => {
  const query = useQuery({
    queryKey: ['notifications', userId, read, type, limit, offset],
    queryFn: async () => {
      const response = await client.api.notifications.$get({
        query: {
          userId,
          read: read !== undefined ? read.toString() : undefined,
          type: type ?? undefined,
          limit: limit.toString(),
          offset: offset.toString(),
        },
      });

      if (!response.ok) throw new Error('Failed to fetch notifications.');

      const { data } = await response.json();

      return data;
    },
    enabled: !!userId && userId.trim().length > 0, // Only fetch when userId is valid
  });

  return query;
};
