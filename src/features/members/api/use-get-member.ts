import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { useGetMembers } from './use-get-members'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'

export const useGetMember = (userId: string) => {
  const workspaceId = useWorkspaceId()
  const { data: members } = useGetMembers({ workspaceId })

  const member = members?.documents?.find((m) => m.userId === userId)

  return {
    data: member,
    isLoading: !members,
  }
}
