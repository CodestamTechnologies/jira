/**
 * User Cache Utility
 * 
 * In-memory cache for Appwrite user data to reduce API calls.
 * Users are cached by their user ID with a TTL.
 * 
 * This reduces Appwrite API calls when the same users are
 * requested multiple times within a short period.
 * 
 * @module lib/cache/user-cache
 */

import type { Users } from 'node-appwrite';

/**
 * Safe user data structure (only non-sensitive fields)
 */
export interface SafeUser {
  $id: string;
  name: string;
  email: string;
}

/**
 * Cached user entry structure
 */
interface CachedUser {
  user: SafeUser;
  timestamp: number;
}

/**
 * Cache configuration
 */
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const MAX_CACHE_SIZE = 500; // Maximum number of users to cache

/**
 * In-memory cache for users
 * Key: userId, Value: { user: {...}, timestamp: number }
 */
const userCache = new Map<string, CachedUser>();

/**
 * Get cached user or fetch and cache it
 * 
 * @param users - Appwrite users API instance
 * @param userId - User ID to fetch
 * @returns User object with safe fields or null if not found
 */
/**
 * Get cached user or fetch and cache it
 * 
 * @param users - Appwrite users API instance
 * @param userId - User ID to fetch
 * @returns User object with safe fields or null if not found
 */
export async function getCachedUser(
  users: Users,
  userId: string
): Promise<SafeUser | null> {
  if (!userId) return null;

  // Check cache first
  const cached = userCache.get(userId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.user;
  }

  // Cache miss or expired - fetch from Appwrite
  try {
    const user = await users.get(userId);
    
    // Only cache safe, non-sensitive fields
    const safeUser = {
      $id: user.$id,
      name: user.name,
      email: user.email,
    };

    // Cache the result
    setCachedUser(userId, safeUser);

    return safeUser;
  } catch (error) {
    console.error(`[UserCache] Failed to fetch user ${userId}:`, error);
    return null;
  }
}

/**
 * Batch fetch multiple users with caching
 * 
 * @param users - Appwrite users API instance
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId -> user object
 */
/**
 * Batch fetch multiple users with caching
 * 
 * This is more efficient than fetching users individually as it:
 * - Checks cache for all users first
 * - Only fetches uncached users
 * - Fetches uncached users in parallel
 * 
 * @param users - Appwrite users API instance
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId -> user object
 */
export async function getCachedUsersBatch(
  users: Users,
  userIds: string[]
): Promise<Map<string, SafeUser>> {
  const results = new Map<string, SafeUser>();
  const uncachedIds: string[] = [];

  // Check cache for all users
  const now = Date.now();
  for (const userId of userIds) {
    if (!userId) continue;

    const cached = userCache.get(userId);
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      results.set(userId, cached.user);
    } else {
      uncachedIds.push(userId);
    }
  }

  // Fetch uncached users in parallel
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(async (userId) => {
      try {
        const user = await users.get(userId);
        const safeUser = {
          $id: user.$id,
          name: user.name,
          email: user.email,
        };
        setCachedUser(userId, safeUser);
        return { userId, user: safeUser };
      } catch (error) {
        console.error(`[UserCache] Failed to fetch user ${userId}:`, error);
        return null;
      }
    });

    const fetched = await Promise.all(fetchPromises);
    for (const result of fetched) {
      if (result) {
        results.set(result.userId, result.user);
      }
    }
  }

  return results;
}

/**
 * Set cached user
 * 
 * @param userId - User ID
 * @param user - User object with safe fields
 */
/**
 * Set cached user (internal function)
 * 
 * @param userId - User ID
 * @param user - User object with safe fields
 */
function setCachedUser(userId: string, user: SafeUser): void {
  // Implement LRU eviction if cache is too large
  if (userCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple FIFO for now)
    const firstKey = userCache.keys().next().value;
    if (firstKey) {
      userCache.delete(firstKey);
    }
  }

  userCache.set(userId, {
    user,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cache for a user
 * Call this when user data changes
 * 
 * @param userId - User ID
 */
export function invalidateUserCache(userId: string): void {
  userCache.delete(userId);
}

/**
 * Clear expired cache entries
 */
export function clearExpiredUserCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  userCache.forEach((cached, userId) => {
    if (now - cached.timestamp >= CACHE_TTL) {
      keysToDelete.push(userId);
    }
  });
  keysToDelete.forEach((key) => userCache.delete(key));
}

/**
 * Clear all cache entries
 */
export function clearUserCache(): void {
  userCache.clear();
}
