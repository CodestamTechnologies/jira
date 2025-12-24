import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'

interface UseGetLeadsProps {
  workspaceId: string
}

export const useGetLeads = ({ workspaceId }: UseGetLeadsProps) => {
  const query = useQuery({
    queryKey: ['leads', workspaceId],
    queryFn: async () => {
      const response = await client.api.leads.$get({
        query: {
          workspaceId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch leads.')

      const { data } = await response.json()

      return data
    },
    enabled: !!workspaceId,
    // Leads change moderately - cache for 2 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Don't refetch on window focus - leads are updated via mutations which invalidate cache
    refetchOnWindowFocus: false,
  })

  return query
}
