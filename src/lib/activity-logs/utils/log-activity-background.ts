import type { Databases } from 'node-appwrite'
import { logActivity } from '@/features/activity-logs/utils/log-activity'
import type { ActivityAction, ActivityEntityType, ActivityChanges, ActivityMetadata } from '@/features/activity-logs/types'

export interface LogActivityParams {
  databases: Databases
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string
  workspaceId: string
  projectId?: string
  userId: string
  username: string
  userEmail: string
  changes: ActivityChanges
  metadata?: ActivityMetadata
}

/**
 * Log activity in background without blocking the request
 * Uses setImmediate to defer execution to next event loop tick
 */
export const logActivityBackground = async (
  params: LogActivityParams
): Promise<void> => {
  // Use setImmediate to defer to next event loop tick, making it non-blocking
  setImmediate(async () => {
    try {
      await logActivity(params)
    } catch (error) {
      console.error('Background activity logging failed:', error)
      // Don't throw - we don't want background errors to affect the main flow
    }
  })
}
