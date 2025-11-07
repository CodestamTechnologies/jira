import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { toast } from 'sonner';

type ResponseType = InferResponseType<(typeof client.api.members)[':memberId']['status']['$patch'], 200>;
type RequestType = InferRequestType<(typeof client.api.members)[':memberId']['status']['$patch']>;

export const useUpdateMemberStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.members[':memberId'].status.$patch({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error('Failed to update member status.');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', variables.param.memberId] });

      const status = variables.json.isActive ? 'active' : 'inactive';
      toast.success(`Member marked as ${status}`);
    },
    onError: () => {
      toast.error('Failed to update member status. Please try again.');
    },
  });
};
