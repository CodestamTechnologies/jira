/**
 * React Query Constants
 * 
 * Centralized constants for React Query configuration.
 * Following DRY principle - single source of truth for cache times and retry logic.
 * 
 * @module lib/react-query/constants
 */

/**
 * Cache time constants (in milliseconds)
 * These define how long data is considered "fresh" and how long it's kept in cache
 */
export const CACHE_TIMES = {
  /** Very stable data that rarely changes (e.g., projects, workspace settings) */
  STABLE: 5 * 60 * 1000, // 5 minutes

  /** Moderately stable data (e.g., members, leads) */
  MODERATE: 3 * 60 * 1000, // 3 minutes

  /** Frequently changing data (e.g., tasks, comments) */
  FREQUENT: 60 * 1000, // 1 minute

  /** Time-sensitive data (e.g., notifications, pending tasks) */
  TIME_SENSITIVE: 30 * 1000, // 30 seconds

  /** Generated/summarized data that's expensive to compute */
  GENERATED: 5 * 60 * 1000, // 5 minutes
} as const;

/**
 * Refetch interval constants (in milliseconds)
 * How often to automatically refetch data
 */
export const REFETCH_INTERVALS = {
  /** Real-time feel for notifications */
  NOTIFICATIONS: 60 * 1000, // 60 seconds

  /** Dashboard data refresh */
  DASHBOARD: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /** Default number of retries for failed requests */
  DEFAULT: 1,

  /** No retries for mutations (fail fast) */
  MUTATIONS: 0,

  /** More retries for critical queries */
  CRITICAL: 3,
} as const;

/**
 * Query limits
 * Maximum number of items to fetch in a single query
 */
export const QUERY_LIMITS = {
  /** Default pagination size */
  DEFAULT: 10,

  /** Medium pagination size */
  MEDIUM: 50,

  /** Large pagination size (use sparingly) */
  LARGE: 100,

  /** Maximum safe limit (avoid going higher) */
  MAX_SAFE: 1000,
} as const;

