# Activity Log / Audit Trail Implementation Plan

## Overview
Implement a comprehensive activity logging system to track all changes (create, update, delete) across tasks, projects, workspaces, members, and other entities for accountability and audit purposes.

---

## Phase 1: Database Schema & Configuration

### 1.1 Appwrite Collection Setup
**Collection ID:** `ACTIVITY_LOGS_ID` (add to `src/config/db.ts`)

**Collection Attributes:**
- `action` (string, required) - Action type: `CREATE`, `UPDATE`, `DELETE`
- `entityType` (string, required) - Entity type: `TASK`, `PROJECT`, `WORKSPACE`, `MEMBER`, `COMMENT`, `INVOICE`, `ATTENDANCE`
- `entityId` (string, required) - ID of the affected entity
- `workspaceId` (string, required) - Workspace context
- `projectId` (string, optional) - Project context (if applicable)
- `userId` (string, required) - User who performed the action
- `username` (string, required) - Username for quick display
- `userEmail` (string, required) - User email
- `changes` (string, required) - JSON stringified field changes (Appwrite stores as string)
  - For CREATE: `JSON.stringify({ "new": { ...entityData } })`
  - For UPDATE: `JSON.stringify({ "old": { ...oldData }, "new": { ...newData } })`
  - For DELETE: `JSON.stringify({ "old": { ...entityData } })`
- `metadata` (string, optional) - JSON stringified additional context (Appwrite stores as string)
  - Example: `JSON.stringify({ "ipAddress": "...", "userAgent": "...", "reason": "..." })`
- `createdAt` (datetime, auto) - Timestamp of the action

**Indexes:**
- `workspaceId` (for filtering by workspace)
- `entityType` (for filtering by entity type)
- `userId` (for filtering by user)
- `createdAt` (for date range queries)
- `entityId` (for entity-specific logs)
- Composite: `workspaceId` + `createdAt` (for workspace activity feed)

---

## Phase 2: Core Logging Infrastructure

### 2.1 Activity Log Types & Schema
**File:** `src/features/activity-logs/types.ts`
```typescript
import { type Models } from 'node-appwrite';

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum ActivityEntityType {
  TASK = 'TASK',
  PROJECT = 'PROJECT',
  WORKSPACE = 'WORKSPACE',
  MEMBER = 'MEMBER',
  COMMENT = 'COMMENT',
  INVOICE = 'INVOICE',
  ATTENDANCE = 'ATTENDANCE',
}

export type ActivityChanges = {
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
};

export type ActivityMetadata = {
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  [key: string]: unknown;
};

export type ActivityLog = Models.Document & {
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  workspaceId: string;
  projectId?: string;
  userId: string;
  username: string;
  userEmail: string;
  changes: string | ActivityChanges; // Stored as JSON string in Appwrite, parsed to ActivityChanges when reading
  metadata?: string | ActivityMetadata; // Stored as JSON string in Appwrite, parsed to ActivityMetadata when reading
};
```

### 2.2 Activity Log Schema (Zod)
**File:** `src/features/activity-logs/schema.ts`
```typescript
import { z } from 'zod';
import { ActivityAction, ActivityEntityType } from './types';

export const activityLogFiltersSchema = z.object({
  workspaceId: z.string(),
  entityType: z.nativeEnum(ActivityEntityType).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  action: z.nativeEnum(ActivityAction).optional(),
  projectId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
```

### 2.3 Activity Logging Utility
**File:** `src/features/activity-logs/utils/log-activity.ts`
```typescript
'use server';

import { ID, type Databases } from 'node-appwrite';
import { DATABASE_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType, type ActivityChanges, type ActivityMetadata } from '../types';
import type { Models } from 'node-appwrite';

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
    const ACTIVITY_LOGS_ID = process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID;
    
    if (!ACTIVITY_LOGS_ID) {
      console.warn('Activity logging disabled: ACTIVITY_LOGS_ID not configured');
      return;
    }

    // Store as JSON string (Appwrite doesn't support JSON type directly)
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
        changes: JSON.stringify(changes), // Store as JSON string
        metadata: metadata ? JSON.stringify(metadata) : undefined, // Store as JSON string
        createdAt: new Date().toISOString(),
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
 */
export function getChangedFields<T extends Record<string, unknown>>(
  oldData: T | null,
  newData: T
): Partial<T> {
  if (!oldData) return newData;

  const changes: Partial<T> = {};
  
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = newData[key];
    }
  }

  return changes;
}
```

---

## Phase 3: Integration with Existing Mutations

### 3.1 Task Mutations Integration
**Files to modify:**
- `src/features/tasks/server/route.ts`

**Changes:**
1. **POST `/` (Create Task):**
   - After task creation, log activity with `CREATE` action
   - Include full task data in `changes.new`

2. **PATCH `/:taskId` (Update Task):**
   - Before update, fetch current task data
   - After update, compare old vs new data
   - Log activity with `UPDATE` action
   - Include only changed fields in `changes`

3. **DELETE `/:taskId` (Delete Task):**
   - Before deletion, fetch task data
   - Log activity with `DELETE` action
   - Include task data in `changes.old`

### 3.2 Project Mutations Integration
**Files to modify:**
- `src/features/projects/server/route.ts`

**Changes:**
1. **POST `/` (Create Project):** Log CREATE
2. **PATCH `/:projectId` (Update Project):** Log UPDATE with field changes
3. **DELETE `/:projectId` (Delete Project):** Log DELETE

### 3.3 Workspace Mutations Integration
**Files to modify:**
- `src/features/workspaces/server/route.ts`

**Changes:**
1. **POST `/` (Create Workspace):** Log CREATE
2. **PATCH `/:workspaceId` (Update Workspace):** Log UPDATE
3. **DELETE `/:workspaceId` (Delete Workspace):** Log DELETE

### 3.4 Member Mutations Integration
**Files to modify:**
- `src/features/members/server/route.ts`

**Changes:**
1. **POST `/` (Add Member):** Log CREATE
2. **PATCH `/:memberId` (Update Member):** Log UPDATE
3. **PATCH `/:memberId/status` (Update Status):** Log UPDATE with status change
4. **DELETE `/:memberId` (Remove Member):** Log DELETE (if exists)

### 3.5 Comment Mutations Integration
**Files to modify:**
- `src/features/tasks/server/comments.ts`

**Changes:**
1. **POST `/` (Create Comment):** Log CREATE
2. **DELETE `/:commentId` (Delete Comment):** Log DELETE (if implemented)

### 3.6 Invoice Mutations Integration
**Files to modify:**
- `src/features/invoices/server/route.ts`

**Changes:**
1. **POST `/` (Create Invoice):** Log CREATE
2. **PATCH `/:invoiceId` (Update Invoice):** Log UPDATE
3. **DELETE `/:invoiceId` (Delete Invoice):** Log DELETE (if exists)

### 3.7 Attendance Mutations Integration
**Files to modify:**
- `src/features/attendance/server/route.ts`

**Changes:**
1. **POST `/check-in` (Check In):** Log CREATE
2. **POST `/check-out` (Check Out):** Log UPDATE
3. **PATCH `/:attendanceId` (Update Attendance):** Log UPDATE

---

## Phase 4: API Routes for Activity Logs

### 4.1 Activity Logs Server Route
**File:** `src/features/activity-logs/server/route.ts`
```typescript
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Query } from 'node-appwrite';

import { DATABASE_ID } from '@/config/db';
import { getMember } from '@/features/members/utils';
import { activityLogFiltersSchema } from '../schema';
import type { ActivityLog } from '../types';
import { parseActivityChanges, parseActivityMetadata } from '../utils/log-activity';
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

      // Verify user has access to workspace
      const member = await getMember({
        databases,
        workspaceId,
        userId: user.$id,
      });

      if (!member) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      const ACTIVITY_LOGS_ID = process.env.NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID;
      
      if (!ACTIVITY_LOGS_ID) {
        return ctx.json({ error: 'Activity logs not configured.' }, 500);
      }

      const queries = [
        Query.equal('workspaceId', workspaceId),
        Query.orderDesc('createdAt'),
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
        queries.push(Query.greaterThanEqual('createdAt', startDate));
      }

      if (endDate) {
        queries.push(Query.lessThanEqual('createdAt', endDate));
      }

      // Fetch logs (changes and metadata stored as JSON strings in Appwrite)
      const logs = await databases.listDocuments<ActivityLog & { changes: string; metadata?: string }>(
        DATABASE_ID,
        ACTIVITY_LOGS_ID,
        queries
      );

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
    zValidator('query', activityLogFiltersSchema),
    async (ctx) => {
      // Similar to GET / but without pagination for full export
      // Returns all matching logs for CSV/PDF export
      // Implementation similar to above but with higher limit
    }
  );

export default app;
```

### 4.2 Register Route in Main API
**File:** `src/app/api/[[...route]]/route.ts`
```typescript
// Add import
import activityLogs from '@/features/activity-logs/server/route';

// Add route
const routes = app
  // ... existing routes
  .route('/activity-logs', activityLogs);
```

---

## Phase 5: Client-Side API Hooks

### 5.1 Get Activity Logs Hook
**File:** `src/features/activity-logs/api/use-get-activity-logs.ts`
```typescript
import { useQuery } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';
import { ActivityEntityType, ActivityAction } from '../types';

interface UseGetActivityLogsProps {
  workspaceId: string;
  entityType?: ActivityEntityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  action?: ActivityAction;
  projectId?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

type ResponseType = InferResponseType<(typeof client.api.activityLogs)['$get'], 200>;
type RequestType = InferRequestType<(typeof client.api.activityLogs)['$get']>;

export const useGetActivityLogs = ({
  workspaceId,
  entityType,
  userId,
  startDate,
  endDate,
  action,
  projectId,
  limit = 50,
  offset = 0,
  enabled = true,
}: UseGetActivityLogsProps) => {
  return useQuery<ResponseType, Error>({
    queryKey: [
      'activity-logs',
      workspaceId,
      entityType,
      userId,
      startDate,
      endDate,
      action,
      projectId,
      limit,
      offset,
    ],
    queryFn: async () => {
      const response = await client.api.activityLogs.$get({
        query: {
          workspaceId,
          entityType,
          userId,
          startDate,
          endDate,
          action,
          projectId,
          limit: limit.toString(),
          offset: offset.toString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs.');
      }

      return await response.json();
    },
    enabled: enabled && !!workspaceId,
  });
};
```

### 5.2 Export Activity Logs Hook
**File:** `src/features/activity-logs/api/use-export-activity-logs.ts`
```typescript
// Similar structure for export functionality
// Returns data formatted for CSV/PDF export
```

---

## Phase 6: UI Components

### 6.1 Activity Feed Component
**File:** `src/features/activity-logs/components/activity-feed.tsx`
- Display chronological list of activities
- Show user avatar, action icon, entity type, and timestamp
- Format changes in readable way
- Support infinite scroll or pagination
- Real-time updates (optional: using polling or WebSocket)

### 6.2 Activity Log Item Component
**File:** `src/features/activity-logs/components/activity-log-item.tsx`
- Individual activity log entry
- Shows: user, action, entity, changes, timestamp
- Expandable to show full change details
- Color-coded by action type (CREATE=green, UPDATE=blue, DELETE=red)

### 6.3 Activity Log Filters Component
**File:** `src/features/activity-logs/components/activity-log-filters.tsx`
- Filter by:
  - Entity type (dropdown)
  - User (user selector)
  - Date range (date picker)
  - Action type (radio/checkbox)
  - Project (if applicable)
- Reset filters button

### 6.4 Activity Log Export Component
**File:** `src/features/activity-logs/components/activity-log-export.tsx`
- Export button
- Format selection (CSV, PDF)
- Date range selection for export
- Loading state during export

### 6.5 Activity Log Page/View
**File:** `src/app/(dashboard)/workspaces/[workspaceId]/activity/page.tsx`
- Full-page activity log view
- Combines filters, feed, and export components
- Accessible from workspace settings or sidebar

---

## Phase 7: Integration Points

### 7.1 Add Activity Log Link to Navigation
- Add "Activity Log" to workspace sidebar/navigation
- Accessible to all workspace members (or only admins - configurable)

### 7.2 Activity Log Badge/Indicator
- Show recent activity count in workspace header
- Optional: notification for important changes

### 7.3 Entity-Specific Activity Logs
- Show activity log tab in:
  - Task detail view
  - Project detail view
  - Member detail view
- Filtered to show only relevant entity activities

---

## Phase 8: Export Functionality

### 8.1 CSV Export
**File:** `src/features/activity-logs/utils/export-csv.ts`
- Convert activity logs to CSV format
- Include all fields: timestamp, user, action, entity, changes
- Download as `.csv` file

### 8.2 PDF Export
**File:** `src/features/activity-logs/utils/export-pdf.ts`
- Use existing PDF utilities (`@react-pdf/renderer`)
- Format as report with headers, filters applied, and formatted data
- Download as `.pdf` file

---

## Phase 9: Performance & Optimization

### 9.1 Pagination
- Implement cursor-based pagination for large datasets
- Limit default page size (50-100 items)
- Load more / infinite scroll

### 9.2 Caching Strategy
- Cache activity logs with appropriate TTL
- Invalidate cache on new activity
- Use React Query for client-side caching

### 9.3 Indexing
- Ensure all filter fields are indexed in Appwrite
- Composite indexes for common filter combinations

### 9.4 Data Retention
- Optional: Implement data retention policy
- Archive old logs (>1 year) to separate collection
- Or implement cleanup job for very old logs

---

## Phase 10: Testing & Validation

### 10.1 Test Activity Logging
- Verify all mutations log activities correctly
- Test with different user roles
- Verify change detection works correctly

### 10.2 Test Filtering
- Test all filter combinations
- Verify date range filtering
- Test pagination

### 10.3 Test Export
- Verify CSV export format
- Verify PDF export format
- Test with large datasets

---

## Implementation Order

1. **Phase 1**: Database schema & configuration
2. **Phase 2**: Core logging infrastructure (types, schema, utils)
3. **Phase 4**: API routes (before UI, to test logging)
4. **Phase 3**: Integration with mutations (start with tasks, then projects, etc.)
5. **Phase 5**: Client-side hooks
6. **Phase 6**: UI components (start with feed, then filters, then export)
7. **Phase 7**: Integration points
8. **Phase 8**: Export functionality
9. **Phase 9**: Performance optimization
10. **Phase 10**: Testing

---

## Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ACTIVITY_LOGS_ID=your_collection_id
```

---

## Notes

- **JSON Storage**: Appwrite doesn't support JSON type directly. Store `changes` and `metadata` as JSON strings using `JSON.stringify()` and parse them with `JSON.parse()` when reading. Use the helper functions `parseActivityChanges()` and `parseActivityMetadata()` for consistent parsing.
- Activity logging should be **non-blocking** - errors in logging should not break main operations
- Consider **privacy** - only log necessary data, avoid sensitive information
- **Performance** - logging should be fast, consider async/background processing for heavy operations
- **Scalability** - plan for high-volume workspaces, consider archiving old logs
- **User Experience** - activity feed should be fast and responsive, use loading states appropriately

---

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live activity feed
2. **Activity Notifications**: Notify users of important changes
3. **Activity Insights**: Analytics on activity patterns
4. **Activity Templates**: Customizable activity descriptions
5. **Bulk Operations Logging**: Track batch operations
6. **Activity Replay**: Ability to see entity state at any point in time
7. **Activity Search**: Full-text search across activity logs
8. **Activity Webhooks**: External integrations for activity events
