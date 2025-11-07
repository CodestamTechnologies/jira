import { ID, type Databases } from 'node-appwrite';
import { DATABASE_ID, ACTIVITY_LOGS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType, type ActivityChanges, type ActivityMetadata } from '../types';
import { getCurrentEnvironment } from './get-environment';

interface LogActivityParams {
  databases: Databases;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  workspaceId: string;
  projectId?: string;
  userId: string;
  username: string;
  userEmail: string;
  changes: ActivityChanges;
  metadata?: ActivityMetadata;
}

export async function logActivity({
  databases,
  action,
  entityType,
  entityId,
  workspaceId,
  projectId,
  userId,
  username,
  userEmail,
  changes,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    if (!ACTIVITY_LOGS_ID) {
      console.warn('Activity logging disabled: ACTIVITY_LOGS_ID not configured');
      return;
    }

    // Store as JSON string (Appwrite doesn't support JSON type directly)
    // Note: $createdAt is automatically provided by Appwrite, don't set it manually
    const currentEnv = getCurrentEnvironment();
    await databases.createDocument(
      DATABASE_ID,
      ACTIVITY_LOGS_ID,
      ID.unique(),
      {
        action,
        entityType,
        entityId,
        workspaceId,
        projectId: projectId || undefined,
        userId,
        username,
        userEmail,
        environment: currentEnv, // Store environment for filtering
        changes: JSON.stringify(changes), // Store as JSON string
        metadata: metadata ? JSON.stringify(metadata) : undefined, // Store as JSON string
      }
    );
  } catch (error) {
    // Log error but don't throw - activity logging should not break main operations
    console.error('[ACTIVITY_LOG_ERROR]:', error);
  }
}

/**
 * Parse activity log changes from JSON string
 */
export function parseActivityChanges(changes: string | ActivityChanges): ActivityChanges {
  if (typeof changes === 'string') {
    return JSON.parse(changes) as ActivityChanges;
  }
  return changes;
}

/**
 * Parse activity log metadata from JSON string
 */
export function parseActivityMetadata(metadata?: string | ActivityMetadata): ActivityMetadata | undefined {
  if (!metadata) return undefined;
  if (typeof metadata === 'string') {
    return JSON.parse(metadata) as ActivityMetadata;
  }
  return metadata;
}

/**
 * Helper to extract changed fields between old and new objects
 * Filters out Appwrite system fields (starting with $)
 */
export function getChangedFields<T extends Record<string, unknown>>(
  oldData: T | null,
  newData: T
): Partial<T> {
  if (!oldData) {
    // Filter out $ fields from new data
    const filtered: Partial<T> = {};
    for (const key in newData) {
      if (!key.startsWith('$')) {
        filtered[key] = newData[key];
      }
    }
    return filtered;
  }

  const changes: Partial<T> = {};

  for (const key in newData) {
    // Skip Appwrite system fields
    if (key.startsWith('$')) continue;

    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = newData[key];
    }
  }

  return changes;
}

/**
 * Filter out Appwrite system fields from an object
 */
export function filterSystemFields<T extends Record<string, unknown>>(data: T): Partial<T> {
  const filtered: Partial<T> = {};
  for (const key in data) {
    if (!key.startsWith('$')) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}
