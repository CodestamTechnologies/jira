import { useQuery } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { ActivityEntityType, ActivityAction } from '../types';

interface UseExportActivityLogsProps {
  workspaceId: string;
  entityType?: ActivityEntityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: ActivityAction;
  projectId?: string;
  enabled?: boolean;
}

type ResponseType = InferResponseType<(typeof client.api)['activity-logs']['export']['$get'], 200>;
type RequestType = InferRequestType<(typeof client.api)['activity-logs']['export']['$get']>;

export const useExportActivityLogs = ({
  workspaceId,
  entityType,
  userId,
  startDate,
  endDate,
  action,
  projectId,
  enabled = false,
}: UseExportActivityLogsProps) => {
  return useQuery<ResponseType, Error>({
    queryKey: [
      'activity-logs-export',
      workspaceId,
      entityType,
      userId,
      startDate,
      endDate,
      action,
      projectId,
    ],
    queryFn: async () => {
      const response = await client.api['activity-logs'].export.$get({
        query: {
          workspaceId,
          entityType,
          userId,
          startDate,
          endDate,
          action,
          projectId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export activity logs.');
      }

      return await response.json();
    },
    enabled: enabled && !!workspaceId,
  });
};
