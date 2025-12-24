/**
 * Utility functions for parsing assigneeIds
 * 
 * Centralized logic to handle assigneeIds which can be stored as either:
 * - JSON string (legacy format)
 * - Array (current format)
 * 
 * Following DRY principle - single source of truth for assigneeIds parsing
 * 
 * @module features/leads/utils/parse-assignee-ids
 */

/**
 * Parses assigneeIds from various formats to a consistent array format
 * 
 * Handles:
 * - String (JSON): Parses JSON string to array
 * - Array: Returns as-is
 * - null/undefined: Returns empty array
 * 
 * @param assigneeIds - AssigneeIds in any format (string, array, null, undefined)
 * @returns Array of assignee IDs, always returns an array (never null/undefined)
 * 
 * @example
 * ```typescript
 * parseAssigneeIds('["id1", "id2"]') // ['id1', 'id2']
 * parseAssigneeIds(['id1', 'id2']) // ['id1', 'id2']
 * parseAssigneeIds(null) // []
 * ```
 */
export function parseAssigneeIds(assigneeIds: unknown): string[] {
  if (!assigneeIds) {
    return []
  }

  if (Array.isArray(assigneeIds)) {
    return assigneeIds
  }

  if (typeof assigneeIds === 'string') {
    try {
      const parsed = JSON.parse(assigneeIds)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // If JSON parsing fails, return empty array
      return []
    }
  }

  return []
}

/**
 * Checks if a member ID is in the assigneeIds array
 * 
 * @param assigneeIds - AssigneeIds in any format
 * @param memberId - Member ID to check
 * @returns True if member ID is in assigneeIds
 */
export function isMemberAssigned(assigneeIds: unknown, memberId: string): boolean {
  const parsed = parseAssigneeIds(assigneeIds)
  return parsed.includes(memberId)
}
