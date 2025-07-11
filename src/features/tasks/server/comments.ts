import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';

import { COMMENTS_ID, DATABASE_ID } from '@/config/db';
import { createCommentSchema } from '@/features/tasks/schema';
import { type Comment } from '@/features/tasks/types';
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
    const { content, authorId, username } = ctx.req.valid('json');
    const taskId = ctx.req.param('taskId') ?? '';

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

    return ctx.json({ data: comment });
  });

export default app; 
