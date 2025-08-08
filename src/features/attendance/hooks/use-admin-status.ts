import { useQuery } from '@tanstack/react-query';

import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrent } from '@/features/auth/api/use-current';

export const useAdminStatus = () => {
  const workspaceId = useWorkspaceId();
  const { data: user } = useCurrent();

  return useQuery({
    queryKey: ['admin-status', workspaceId, user?.$id],
    queryFn: async () => {
      if (!workspaceId || !user?.$id) {
        return false;
      }

      const response = await fetch(`/api/members?workspaceId=${workspaceId}`);

      if (!response.ok) {
        return false;
      }

      const responseData = await response.json();
      const data = responseData.data?.documents || responseData.documents || [];
      const member = data.find((m: any) => m.userId === user.$id);


      return member?.role === 'ADMIN';
    },
    enabled: !!workspaceId && !!user?.$id,
  });
};
