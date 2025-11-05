import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useAdminStatus } from './use-admin-status';

export const useAdminRedirect = (redirectPath: string) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push(redirectPath);
    }
  }, [isAdmin, isAdminLoading, router, redirectPath]);

  return { isAdmin, isAdminLoading };
};
