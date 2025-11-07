import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Query } from 'node-appwrite';

import { DATABASE_ID, ACTIVITY_LOGS_ID } from '@/config/db';
import { getMember } from '@/features/members/utils';
import { MemberRole } from '@/features/members/types';
import { activityLogFiltersSchema } from '../schema';
import type { ActivityLog } from '../types';
import { parseActivityChanges, parseActivityMetadata } from '../utils/log-activity';
import { getCurrentEnvironment } from '../utils/get-environment';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', activityLogFiltersSchema),
    async (ctx) => {
      const databases = ctx.get('databases');
      const user = ctx.get('user');
      const {
        workspaceId,
        entityType,
        userId,
        startDate,
        endDate,
        action,
        projectId,
        limit,
        offset,
      } = ctx.req.valid('query');

      // Verify user has access to workspace and is admin
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Only admins can access activity logs
      if (member.role !== MemberRole.ADMIN) {
        return ctx.json({ error: 'Forbidden: Only admins can access activity logs.' }, 403);
      }

      if (!ACTIVITY_LOGS_ID) {
        return ctx.json({ error: 'Activity logs not configured.' }, 500);
      }

      const currentEnv = getCurrentEnvironment();
      const queries = [
        Query.equal('workspaceId', workspaceId),
        Query.equal('environment', currentEnv), // Filter by current environment
        Query.orderDesc('$createdAt'), // Use $createdAt (Appwrite auto field)
        Query.limit(limit),
        Query.offset(offset),
      ];

      if (entityType) {
        queries.push(Query.equal('entityType', entityType));
      }

      if (userId) {
        queries.push(Query.equal('userId', userId));
      }

      if (action) {
        queries.push(Query.equal('action', action));
      }

      if (projectId) {
        queries.push(Query.equal('projectId', projectId));
      }

      if (startDate) {
        queries.push(Query.greaterThanEqual('$createdAt', startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual('$createdAt', endDate));
      }

      // Fetch logs (changes and metadata stored as JSON strings in Appwrite)
      const logsResponse = await databases.listDocuments<ActivityLog & { changes: string; metadata?: string }>(
        DATABASE_ID,
        ACTIVITY_LOGS_ID,
        queries
      );

      // Additional client-side filtering by environment (in case some logs don't have environment field)
      const logs = {
        ...logsResponse,
        documents: logsResponse.documents.filter((log) => {
          const logEnv = log.environment || 'production'; // Default to production for backward compatibility
          return logEnv === currentEnv;
        }),
      };

      // Parse JSON strings to objects for response (using helper functions)
      const parsedLogs = logs.documents.map((log) => ({
        ...log,
        changes: parseActivityChanges(log.changes),
        metadata: parseActivityMetadata(log.metadata),
      }));

      return ctx.json({
        data: {
          ...logs,
          documents: parsedLogs,
        },
      });
    }
  )
  .get(
    '/export',
    sessionMiddleware,
    zValidator('query', activityLogFiltersSchema.omit({ limit: true, offset: true })),
    async (ctx) => {
      const databases = ctx.get('databases');
      const user = ctx.get('user');
      const {
        workspaceId,
        entityType,
        userId,
        startDate,
        endDate,
        action,
        projectId,
      } = ctx.req.valid('query');

      // Verify user has access to workspace and is admin
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      // Only admins can export activity logs
      if (member.role !== MemberRole.ADMIN) {
        return ctx.json({ error: 'Forbidden: Only admins can export activity logs.' }, 403);
      }

      if (!ACTIVITY_LOGS_ID) {
        return ctx.json({ error: 'Activity logs not configured.' }, 500);
      }

      const currentEnv = getCurrentEnvironment();
      const queries = [
        Query.equal('workspaceId', workspaceId),
        Query.equal('environment', currentEnv), // Filter by current environment
        Query.orderDesc('$createdAt'), // Use $createdAt (Appwrite auto field)
        Query.limit(10000), // High limit for export
      ];

      if (entityType) {
        queries.push(Query.equal('entityType', entityType));
      }

      if (userId) {
        queries.push(Query.equal('userId', userId));
      }

      if (action) {
        queries.push(Query.equal('action', action));
      }

      if (projectId) {
        queries.push(Query.equal('projectId', projectId));
      }

      if (startDate) {
        queries.push(Query.greaterThanEqual('$createdAt', startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual('$createdAt', endDate));
      }

      // Fetch logs for export
      const logsResponse = await databases.listDocuments<ActivityLog & { changes: string; metadata?: string }>(
        DATABASE_ID,
        ACTIVITY_LOGS_ID,
        queries
      );

      // Additional client-side filtering by environment
      const logs = {
        ...logsResponse,
        documents: logsResponse.documents.filter((log) => {
          const logEnv = log.environment || 'production'; // Default to production for backward compatibility
          return logEnv === currentEnv;
        }),
      };

      // Parse JSON strings to objects for response
      const parsedLogs = logs.documents.map((log) => ({
        ...log,
        changes: parseActivityChanges(log.changes),
        metadata: parseActivityMetadata(log.metadata),
      }));

      return ctx.json({
        data: parsedLogs,
      });
    }
  );

export default app;
