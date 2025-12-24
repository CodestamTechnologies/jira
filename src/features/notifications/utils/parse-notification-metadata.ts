import type { NotificationMetadata } from '../types';

/**
 * Parse notification metadata from JSON string or object
 * Centralized utility to ensure consistent parsing across the codebase
 */
export const parseNotificationMetadata = (
  metadata?: string | NotificationMetadata
): NotificationMetadata | undefined => {
  if (!metadata) return undefined;
  
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as NotificationMetadata;
    } catch (error) {
      console.error('Failed to parse notification metadata:', error);
      return undefined;
    }
  }
  
  return metadata;
};

