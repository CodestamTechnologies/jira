import { useQuery } from '@tanstack/react-query';

/**
 * Response type for summary generation API
 */
interface GenerateSummaryResponse {
  summary: string;
}

/**
 * Hook to generate daily summary from today's tasks and comments
 * 
 * @param workspaceId - Workspace ID to generate summary for
 * @param enabled - Whether the query should be enabled
 * @returns Query result with auto-generated summary
 * 
 * @remarks
 * - Summary is generated from IN_PROGRESS tasks and their comments from today
 * - Caches results for 5 minutes since summary doesn't change frequently
 * - Doesn't refetch on window focus to avoid unnecessary API calls
 * - Only enabled when workspaceId is provided and enabled flag is true
 */
export const useGenerateSummary = (
  workspaceId: string | undefined,
  enabled: boolean = true
) => {
  return useQuery<GenerateSummaryResponse>({
    queryKey: ['generate-summary', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const response = await fetch(`/api/attendance/generate-summary?workspaceId=${workspaceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate summary');
      }

      return response.json();
    },
    enabled: !!workspaceId && enabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
};
