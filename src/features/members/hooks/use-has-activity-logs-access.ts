/**
 * Hook to check if user has activity logs access
 * Convenience wrapper for useFeatureAccess with activity logs-specific logic
 * 
 * @returns Query result with boolean indicating if user has activity logs access
 */
import { useFeatureAccess } from './use-feature-access'
import { FeaturePermission } from '../utils/permissions'

export function useHasActivityLogsAccess() {
  return useFeatureAccess(FeaturePermission.ACTIVITY_LOGS)
}
