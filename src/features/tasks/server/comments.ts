import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';

import { COMMENTS_ID, DATABASE_ID, TASKS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { logActivity } from '@/features/activity-logs/utils/log-activity';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { createCommentSchema } from '@/features/tasks/schema';
import { type Comment, type Task } from '@/features/tasks/types';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  // List comments for a task
  .get('/', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases');
    const taskId = ctx.req.param('taskId') ?? '';

    // Only members can view comments (optional: check membership)
    const commentDocs = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
      Query.equal('taskId', taskId),
      Query.orderAsc('createdAt'),
    ]);

    return ctx.json({ data: commentDocs.documents });
  })
  // Add a comment to a task
  .post('/', sessionMiddleware, zValidator('json', createCommentSchema.omit({ taskId: true })), async (ctx) => {
    const databases = ctx.get('databases');
    const user = ctx.get('user');
    const { content, authorId, username } = ctx.req.valid('json');
    const taskId = ctx.req.param('taskId') ?? '';

    // Get task to get workspaceId and projectId for logging
    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const comment = await databases.createDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      ID.unique(),
      {
        taskId,
        content,
        authorId,
        username,
        createdAt: new Date().toISOString(),
      }
    );

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    await logActivity({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.COMMENT,
      entityId: comment.$id,
      workspaceId: task.workspaceId,
      projectId: task.projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: comment },
      metadata,
    });

    return ctx.json({ data: comment });
  });

export default app; 
