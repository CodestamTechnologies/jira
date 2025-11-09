import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { useGetMembers } from './use-get-members'
import type { Member } from '../types'

export const useGetMemberDetail = (userId: string) => {
  const workspaceId = useWorkspaceId()
  const { data: members } = useGetMembers({ workspaceId })

  const member = members?.documents?.find((m) => m.userId === userId) as Member | undefined

  // Find memberId from the member document
  const memberId = member?.$id

  return useQuery<Member | null>({
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
        return data as Member
      } catch (error) {
        // Fallback to basic member info on error
        return member || null
      }
    },
    enabled: !!workspaceId && !!userId,
  })
}
