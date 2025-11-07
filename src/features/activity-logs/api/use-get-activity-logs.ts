import { useQuery } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { ActivityEntityType, ActivityAction } from '../types';

interface UseGetActivityLogsProps {
  workspaceId: string;
  entityType?: ActivityEntityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: ActivityAction;
  projectId?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

type ResponseType = InferResponseType<(typeof client.api)['activity-logs']['$get'], 200>;
type RequestType = InferRequestType<(typeof client.api)['activity-logs']['$get']>;

export const useGetActivityLogs = ({
  workspaceId,
  entityType,
  userId,
  startDate,
  endDate,
  action,
  projectId,
  limit = 50,
  offset = 0,
  enabled = true,
}: UseGetActivityLogsProps) => {
  return useQuery<ResponseType, Error>({
    queryKey: [
      'activity-logs',
      workspaceId,
      entityType,
      userId,
      startDate,
      endDate,
      action,
      projectId,
      limit,
      offset,
    ],
    queryFn: async () => {
      const response = await client.api['activity-logs'].$get({
        query: {
          workspaceId,
          entityType,
          userId,
          startDate,
          endDate,
          action,
          projectId,
          limit: limit.toString(),
          offset: offset.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs.');
      }

      return await response.json();
    },
    enabled: enabled && !!workspaceId,
  });
};
