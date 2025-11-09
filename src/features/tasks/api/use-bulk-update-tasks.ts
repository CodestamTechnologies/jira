import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type ResponseType = InferResponseType<(typeof client.api.tasks)['bulk-update']['$post'], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)['bulk-update']['$post']>;

export const useBulkUpdateTasks = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.tasks['bulk-update']['$post']({ json });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        const errorMessage = errorData.error || 'Failed to update tasks.';
        throw new Error(errorMessage);
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success('Tasks updated.');

      queryClient.invalidateQueries({
        queryKey: ['workspace-analytics', data.workspaceId],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ['project-analytics'],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks', data.workspaceId],
        exact: false,
      });
    },
    onError: (error) => {
      console.error('[BULK_UPDATE_TASKS]: ', error);

      toast.error(error.message || 'Failed to update tasks.');
    },
  });

  return mutation;
};
