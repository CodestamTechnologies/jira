import type { Models } from 'node-appwrite';

/**
 * Extract user information for activity logging
 * Follows DRY principle - single source for user info extraction
 */
export function getUserInfoForLogging(user: Models.User<Models.Preferences>): {
  userId: string;
  username: string;
  userEmail: string;
} {
  return {
    userId: user.$id,
    username: user.name || user.email || 'Unknown User',
    userEmail: user.email || '',
  };
}
