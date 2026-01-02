/**
 * Closed Projects Cache
 * 
 * Caches closed project IDs per workspace to avoid fetching them
 * on every task query. This significantly reduces database reads.
 * 
 * @module lib/cache/closed-projects-cache
 */

/**
 * Cache configuration
 */
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes - closed projects change rarely

interface CachedClosedProjects {
  projectIds: Set<string>;
  timestamp: number;
}

/**
 * In-memory cache for closed project IDs by workspace
 * Key: workspaceId, Value: { projectIds: Set<string>, timestamp: number }
 */
const closedProjectsCache = new Map<string, CachedClosedProjects>();

/**
 * Get cached closed project IDs for a workspace
 * 
 * @param workspaceId - Workspace ID
 * @returns Set of closed project IDs or null if not cached
 */
export function getCachedClosedProjects(workspaceId: string): Set<string> | null {
  const cached = closedProjectsCache.get(workspaceId);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp >= CACHE_TTL) {
    // Cache expired
    closedProjectsCache.delete(workspaceId);
    return null;
  }

  return cached.projectIds;
}

/**
 * Set cached closed project IDs for a workspace
 * 
 * @param workspaceId - Workspace ID
 * @param projectIds - Set of closed project IDs
 */
export function setCachedClosedProjects(workspaceId: string, projectIds: Set<string>): void {
  closedProjectsCache.set(workspaceId, {
    projectIds: new Set(projectIds), // Create a new Set to avoid reference issues
    timestamp: Date.now(),
  });
}

/**
 * Invalidate cache for a workspace
 * Call this when a project's isClosed status changes
 * 
 * @param workspaceId - Workspace ID
 */
export function invalidateClosedProjectsCache(workspaceId: string): void {
  closedProjectsCache.delete(workspaceId);
}

/**
 * Clear all cache entries
 */
export function clearClosedProjectsCache(): void {
  closedProjectsCache.clear();
}

/**
 * Clear expired cache entries
 */
export function clearExpiredClosedProjectsCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  closedProjectsCache.forEach((cached, workspaceId) => {
    if (now - cached.timestamp >= CACHE_TTL) {
      keysToDelete.push(workspaceId);
    }
  });
  keysToDelete.forEach((key) => closedProjectsCache.delete(key));
}
