/**
 * Feature Access Hooks
 * 
 * React hooks for checking feature access permissions.
 * Uses React Query for caching and consistency with the rest of the codebase.
 * 
 * @module features/members/hooks/use-feature-access
 */

import { useMemo, useCallback } from 'react'

import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id'
import { useCurrent } from '@/features/auth/api/use-current'
import { useAdminStatus } from '@/features/attendance/hooks/use-admin-status'
import { useGetMembers } from '@/features/members/api/use-get-members'
import { FeaturePermission, type PermissionCheckResult } from '../utils/permissions'
import { useGetLeads } from '@/features/leads/api/use-get-leads'
import { isMemberAssigned } from '@/features/leads/utils/parse-assignee-ids'

/**
 * Options for feature access checking
 */
interface UseFeatureAccessOptions {
  /** Whether to check for assigned items */
  checkAssigned?: boolean
  /** Query key for assigned items (e.g., 'leads') */
  assignedItemsKey?: string
  /** Function to check if item is assigned to member */
  isItemAssigned?: (item: unknown, memberId: string) => boolean
}

/**
 * Generic hook to check feature access
 * 
 * Access is granted if:
 * 1. User is an admin, OR
 * 2. User has explicit permission, OR
 * 3. User has assigned items (if checkAssigned is enabled)
 * 
 * @param permission - Feature permission to check
 * @param options - Additional options for access checking
 * @returns Query result with access information
 */
export function useFeatureAccess(
  permission: FeaturePermission,
  options?: UseFeatureAccessOptions
) {
  const workspaceId = useWorkspaceId()
  const { data: user } = useCurrent()
  const { data: isAdmin, isLoading: isAdminLoading } = useAdminStatus()
  const { data: membersData, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

  // Get assigned items if checkAssigned is enabled
  // For leads, use the existing useGetLeads hook for consistency and caching
  const leadsQuery = options?.checkAssigned && options?.assignedItemsKey === 'leads'
    ? useGetLeads({ workspaceId })
    : null

  // Optimize: Compute current member once (combines both member and memberId lookups)
  const currentMemberData = useMemo(() => {
    if (!user?.$id || !membersData?.documents) {
      return { member: null, memberId: null }
    }
    
    const member = membersData.documents.find((m) => m.userId === user.$id)
    return {
      member: member || null,
      memberId: member?.$id || null,
    }
  }, [user?.$id, membersData?.documents])

  // Memoize the item assignment checker to prevent unnecessary re-renders
  const checkItemAssigned = useCallback(
    (item: unknown, memberId: string): boolean => {
      if (!options?.isItemAssigned) return false
      return options.isItemAssigned(item, memberId)
    },
    [options?.isItemAssigned]
  )

  // Calculate access with optimized dependencies
  const result = useMemo((): PermissionCheckResult => {
    // Admins always have access
    if (isAdmin === true) {
      return { hasAccess: true, reason: 'admin' }
    }

    // Check explicit permission
    if (currentMemberData.member && currentMemberData.member[permission] === true) {
      return { hasAccess: true, reason: 'permission' }
    }

    // Check for assigned items if enabled
    if (
      options?.checkAssigned &&
      currentMemberData.memberId &&
      leadsQuery?.data?.documents &&
      checkItemAssigned
    ) {
      const hasAssigned = leadsQuery.data.documents.some((item) =>
        checkItemAssigned(item, currentMemberData.memberId!)
      )
      if (hasAssigned) {
        return { hasAccess: true, reason: 'assigned' }
      }
    }

    return { hasAccess: false, reason: 'none' }
  }, [
    isAdmin,
    currentMemberData.member,
    currentMemberData.memberId,
    permission,
    leadsQuery?.data?.documents,
    options?.checkAssigned,
    checkItemAssigned,
  ])

  const isLoading =
    isAdminLoading ||
    isLoadingMembers ||
    (options?.checkAssigned && leadsQuery?.isLoading)

  return {
    data: result.hasAccess,
    isLoading,
    isError: false,
    error: null,
    reason: result.reason,
  }
}

/**
 * Hook to check leads access
 * Convenience wrapper for useFeatureAccess with leads-specific logic
 * 
 * Uses centralized assigneeIds parsing utility for consistency
 * 
 * @returns Query result with boolean indicating if user has leads access
 */
export function useHasLeadsAccess() {
  return useFeatureAccess(FeaturePermission.LEADS, {
    checkAssigned: true,
    assignedItemsKey: 'leads',
    // Use centralized utility for parsing assigneeIds
    isItemAssigned: (lead: unknown, memberId: string) => {
      // Type guard for lead object
      if (typeof lead !== 'object' || lead === null) return false
      const leadObj = lead as { assigneeIds?: unknown }
      return isMemberAssigned(leadObj.assigneeIds, memberId)
    },
  })
}

// Re-export permission hooks for convenience
export { useHasInvoicesAccess } from './use-has-invoices-access'
export { useHasExpensesAccess } from './use-has-expenses-access'
export { useHasActivityLogsAccess } from './use-has-activity-logs-access'
