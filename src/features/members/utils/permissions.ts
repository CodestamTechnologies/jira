/**
 * Permission System Utilities
 * 
 * Scalable permission system for feature access control.
 * Designed to be easily extended for future features (invoices, reports, etc.)
 * 
 * @module features/members/utils/permissions
 */

import { type Databases, Query } from 'node-appwrite'
import { DATABASE_ID, MEMBERS_ID, LEADS_ID } from '@/config/db'
import { type Member, MemberRole } from '@/features/members/types'
import { getMember } from '../utils'
import { isMemberAssigned } from '@/features/leads/utils/parse-assignee-ids'

/**
 * Feature permission keys
 * Add new features here as the system grows
 */
export enum FeaturePermission {
  LEADS = 'hasLeadsAccess',
  INVOICES = 'hasInvoicesAccess',
  EXPENSES = 'hasExpensesAccess',
  ACTIVITY_LOGS = 'hasActivityLogsAccess',
  // Future features can be added here:
  // REPORTS = 'hasReportsAccess',
  // etc.
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasAccess: boolean
  reason?: 'admin' | 'permission' | 'assigned' | 'none'
}

/**
 * Options for checking feature access
 */
interface CheckFeatureAccessOptions {
  /** Member document (optional, will be fetched if not provided) */
  member?: Member | null
  /** Whether to check for assigned items (e.g., leads assigned to user) */
  checkAssigned?: boolean
  /** Collection ID to check for assigned items (required if checkAssigned is true) */
  assignedCollectionId?: string
  /** Function to check if item is assigned to member */
  isItemAssigned?: (item: any, memberId: string) => boolean
}

/**
 * Check if a member has access to a specific feature
 * 
 * Access is granted if:
 * 1. Member is an admin (always has access), OR
 * 2. Member has explicit permission (hasLeadsAccess: true), OR
 * 3. Member has assigned items (if checkAssigned is enabled)
 * 
 * @param databases - Appwrite databases instance
 * @param workspaceId - Workspace ID
 * @param userId - User ID
 * @param permission - Feature permission to check
 * @param options - Additional options for access checking
 * @returns Promise resolving to permission check result
 * 
 * @example
 * ```typescript
 * // Check leads access
 * const result = await checkFeatureAccess(
 *   databases,
 *   workspaceId,
 *   userId,
 *   FeaturePermission.LEADS,
 *   {
 *     checkAssigned: true,
 *     assignedCollectionId: LEADS_ID,
 *     isItemAssigned: (lead, memberId) => 
 *       lead.assigneeIds?.includes(memberId)
 *   }
 * );
 * ```
 */
export async function checkFeatureAccess(
  databases: Databases,
  workspaceId: string,
  userId: string,
  permission: FeaturePermission,
  options: CheckFeatureAccessOptions = {}
): Promise<PermissionCheckResult> {
  const {
    member: providedMember,
    checkAssigned = false,
    assignedCollectionId,
    isItemAssigned,
  } = options

  try {
    // Get member if not provided
    let member = providedMember
    if (!member) {
      member = await getMember({
        databases,
        workspaceId,
        userId,
      })
    }

    if (!member) {
      return { hasAccess: false, reason: 'none' }
    }

    // Admins always have access
    if (member.role === MemberRole.ADMIN) {
      return { hasAccess: true, reason: 'admin' }
    }

    // Check explicit permission
    const hasPermission = member[permission] === true
    if (hasPermission) {
      return { hasAccess: true, reason: 'permission' }
    }

    // Check for assigned items if enabled
    if (checkAssigned && assignedCollectionId && isItemAssigned) {
      const items = await databases.listDocuments(
        DATABASE_ID,
        assignedCollectionId,
        [Query.equal('workspaceId', workspaceId)]
      )

      const hasAssigned = items.documents.some((item) =>
        isItemAssigned(item, member!.$id)
      )

      if (hasAssigned) {
        return { hasAccess: true, reason: 'assigned' }
      }
    }

    return { hasAccess: false, reason: 'none' }
  } catch (error) {
    console.error(`[PERMISSIONS] Error checking ${permission}:`, error)
    return { hasAccess: false, reason: 'none' }
  }
}

/**
 * Check leads access specifically
 * Convenience wrapper for checkFeatureAccess with leads-specific logic
 * 
 * @param databases - Appwrite databases instance
 * @param workspaceId - Workspace ID
 * @param userId - User ID
 * @param member - Optional member document (will be fetched if not provided)
 * @returns Promise resolving to permission check result
 */
export async function checkLeadsAccess(
  databases: Databases,
  workspaceId: string,
  userId: string,
  member?: Member | null
): Promise<PermissionCheckResult> {
  return checkFeatureAccess(
    databases,
    workspaceId,
    userId,
    FeaturePermission.LEADS,
    {
      member,
      checkAssigned: true,
      assignedCollectionId: LEADS_ID,
      // Use centralized utility for parsing assigneeIds (DRY principle)
      isItemAssigned: (lead: unknown, memberId: string) => {
        // Type guard for lead object
        if (typeof lead !== 'object' || lead === null) return false
        const leadObj = lead as { assigneeIds?: unknown }
        return isMemberAssigned(leadObj.assigneeIds, memberId)
      },
    }
  )
}
