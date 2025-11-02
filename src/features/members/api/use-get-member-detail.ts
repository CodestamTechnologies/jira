import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { useGetMembers } from './use-get-members'

export const useGetMemberDetail = (userId: string) => {
  const workspaceId = useWorkspaceId()
  const { data: members } = useGetMembers({ workspaceId })

  const member = members?.documents?.find((m: any) => m.userId === userId)

  // Find memberId from the member document
  const memberId = member?.$id

  return useQuery({
    queryKey: ['member-detail', memberId],
    queryFn: async () => {
      if (!memberId) {
        // If no memberId found, return basic member info from list
        return member || null
      }

      try {
        const response = await client.api.members[':memberId'].$get({
          param: { memberId },
        })

        if (!response.ok) {
          // Fallback to basic member info if detail fetch fails
          return member || null
        }

        const { data } = await response.json()
        return data
      } catch (error) {
        // Fallback to basic member info on error
        return member || null
      }
    },
    enabled: !!workspaceId && !!userId,
  })
}
