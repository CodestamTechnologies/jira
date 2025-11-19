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
  })

  return query
}

