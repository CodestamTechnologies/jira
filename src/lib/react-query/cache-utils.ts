/**
 * React Query Cache Utilities
 * 
 * Centralized cache invalidation functions following DRY principle.
 * These utilities ensure consistent cache management across all mutations.
 * 
 * @module lib/react-query/cache-utils
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates queries related to a workspace
 * Use this when workspace-level data changes (tasks, projects, members, etc.)
 * 
 * @param queryClient - React Query client instance
 * @param workspaceId - Workspace ID to invalidate queries for
 * @param options - Additional invalidation options
 */
export function invalidateWorkspaceQueries(
  queryClient: QueryClient,
  workspaceId: string,
  options?: {
    includeAnalytics?: boolean;
    includeTasks?: boolean;
    includeProjects?: boolean;
    includeMembers?: boolean;
  }
) {
  const {
    includeAnalytics = true,
    includeTasks = true,
    includeProjects = true,
    includeMembers = true,
  } = options || {};

  if (includeAnalytics) {
    queryClient.invalidateQueries({
      queryKey: ['workspace-analytics', workspaceId],
      exact: true,
    });
  }

  if (includeTasks) {
    queryClient.invalidateQueries({
      queryKey: ['tasks', workspaceId],
      exact: false, // Invalidate all task queries for this workspace
    });
  }

  if (includeProjects) {
    queryClient.invalidateQueries({
      queryKey: ['projects', workspaceId],
      exact: true,
    });
  }

  if (includeMembers) {
    queryClient.invalidateQueries({
      queryKey: ['members', workspaceId],
      exact: true,
    });
  }
}

/**
 * Invalidates queries related to a project
 * Use this when project-level data changes
 * 
 * @param queryClient - React Query client instance
 * @param projectId - Project ID to invalidate queries for
 * @param workspaceId - Optional workspace ID for workspace-level invalidation
 */
export function invalidateProjectQueries(
  queryClient: QueryClient,
  projectId: string,
  workspaceId?: string
) {
  // Invalidate project-specific queries
  queryClient.invalidateQueries({
    queryKey: ['project-analytics', projectId],
    exact: true,
  });

  queryClient.invalidateQueries({
    queryKey: ['project', projectId],
    exact: true,
  });

  // If workspaceId provided, also invalidate workspace-level queries
  if (workspaceId) {
    invalidateWorkspaceQueries(queryClient, workspaceId, {
      includeTasks: true,
      includeProjects: true,
      includeAnalytics: true,
      includeMembers: false,
    });
  }
}

/**
 * Invalidates queries related to a task
 * Use this when task data changes
 * 
 * @param queryClient - React Query client instance
 * @param taskId - Task ID to invalidate queries for
 * @param workspaceId - Workspace ID for workspace-level invalidation
 * @param projectId - Optional project ID for project-level invalidation
 */
export function invalidateTaskQueries(
  queryClient: QueryClient,
  taskId: string,
  workspaceId: string,
  projectId?: string
) {
  // Invalidate task-specific query
  queryClient.invalidateQueries({
    queryKey: ['task', taskId],
    exact: true,
  });

  // Invalidate workspace-level task queries
  queryClient.invalidateQueries({
    queryKey: ['tasks', workspaceId],
    exact: false,
  });

  // Invalidate workspace analytics
  queryClient.invalidateQueries({
    queryKey: ['workspace-analytics', workspaceId],
    exact: true,
  });

  // Invalidate project analytics if projectId provided
  if (projectId) {
    queryClient.invalidateQueries({
      queryKey: ['project-analytics', projectId],
      exact: true,
    });
  }
}

/**
 * Invalidates queries related to attendance
 * Use this when attendance data changes
 * 
 * @param queryClient - React Query client instance
 * @param workspaceId - Optional workspace ID for workspace-level invalidation
 */
export function invalidateAttendanceQueries(
  queryClient: QueryClient,
  workspaceId?: string
) {
  queryClient.invalidateQueries({ queryKey: ['attendance'] });
  queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
  queryClient.invalidateQueries({ queryKey: ['team-attendance'] });
  queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });

  if (workspaceId) {
    queryClient.invalidateQueries({
      queryKey: ['attendance', workspaceId],
      exact: false,
    });
  }
}


/**
 * Invalidates queries related to leads
 * Use this when lead data changes
 * 
 * @param queryClient - React Query client instance
 * @param workspaceId - Workspace ID to invalidate queries for
 * @param leadId - Optional lead ID to invalidate specific lead query
 */
export function invalidateLeadQueries(
  queryClient: QueryClient,
  workspaceId: string,
  leadId?: string
) {
  queryClient.invalidateQueries({
    queryKey: ['leads', workspaceId],
    exact: false,
  });

  // Invalidate specific lead query if leadId provided
  if (leadId) {
    queryClient.invalidateQueries({
      queryKey: ['lead', leadId],
      exact: true,
    });
  }
}

/**
 * Invalidates queries related to a member
 * Use this when member data changes
 * 
 * @param queryClient - React Query client instance
 * @param memberId - Member ID to invalidate queries for
 * @param workspaceId - Workspace ID for workspace-level invalidation
 */
export function invalidateMemberQueries(
  queryClient: QueryClient,
  memberId: string,
  workspaceId: string
) {
  // Invalidate member-specific queries
  queryClient.invalidateQueries({
    queryKey: ['member-detail', memberId],
    exact: true,
  });

  queryClient.invalidateQueries({
    queryKey: ['member', memberId],
    exact: true,
  });

  // Invalidate workspace-level member queries
  queryClient.invalidateQueries({
    queryKey: ['members', workspaceId],
    exact: true,
  });

  // Invalidate all feature access queries (permissions)
  // Note: Feature access hooks compute access from member data, so invalidating members
  // automatically refreshes access. However, we invalidate these patterns for completeness
  // and future-proofing in case direct queries are added.
  const featureAccessPatterns = [
    'has-leads-access',
    'has-invoices-access',
    'has-expenses-access',
    'has-activity-logs-access',
  ]
  
  featureAccessPatterns.forEach((pattern) => {
    queryClient.invalidateQueries({
      queryKey: [pattern],
      exact: false,
    })
  })
}

/**
 * Invalidates queries related to task comments
 * Use this when comment data changes (create, update, delete)
 * 
 * @param queryClient - React Query client instance
 * @param taskId - Task ID to invalidate comments for
 */
export function invalidateCommentQueries(
  queryClient: QueryClient,
  taskId: string
) {
  queryClient.invalidateQueries({
    queryKey: ['comments', taskId],
    exact: false, // Invalidate all comment queries for this task
  });
}
