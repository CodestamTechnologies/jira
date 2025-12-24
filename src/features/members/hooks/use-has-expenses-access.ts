/**
 * Hook to check if user has expenses access
 * Convenience wrapper for useFeatureAccess with expenses-specific logic
 * 
 * @returns Query result with boolean indicating if user has expenses access
 */
import { useFeatureAccess } from './use-feature-access'
import { FeaturePermission } from '../utils/permissions'

export function useHasExpensesAccess() {
  return useFeatureAccess(FeaturePermission.EXPENSES)
}
