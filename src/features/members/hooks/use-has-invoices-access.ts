/**
 * Hook to check if user has invoices access
 * Convenience wrapper for useFeatureAccess with invoices-specific logic
 * 
 * @returns Query result with boolean indicating if user has invoices access
 */
import { useFeatureAccess } from './use-feature-access'
import { FeaturePermission } from '../utils/permissions'

export function useHasInvoicesAccess() {
  return useFeatureAccess(FeaturePermission.INVOICES)
}
