import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { ID, Query } from 'node-appwrite';

import { COMMENTS_ID, DATABASE_ID, IMAGES_BUCKET_ID, TASKS_ID, MEMBERS_ID, WORKSPACES_ID, PROJECTS_ID } from '@/config/db';
import { ActivityAction, ActivityEntityType } from '@/features/activity-logs/types';
import { getUserInfoForLogging } from '@/features/activity-logs/utils/get-user-info';
import { logActivityBackground } from '@/lib/activity-logs/utils/log-activity-background';
import { getRequestMetadata } from '@/features/activity-logs/utils/get-request-metadata';
import { createCommentSchema, updateCommentSchema } from '@/features/tasks/schema';
import { type Comment, type Task, stringifyAttachments, parseAttachments } from '@/features/tasks/types';
import { sessionMiddleware } from '@/lib/session-middleware';
import z from 'zod';
import { NotificationService } from '@/lib/email/services/notification-service';
import type { Workspace } from '@/features/workspaces/types';
import type { Project } from '@/features/projects/types';

const app = new Hono()
  // Upload file for comment
  .post('/upload', sessionMiddleware, async (ctx) => {
    const storage = ctx.get('storage');

    try {
      const formData = await ctx.req.formData();
      const file = formData.get('file') as File;

      if (!file || !(file instanceof File)) {
        console.error('[UPLOAD_COMMENT_FILE]: No file in formData. Keys:', Array.from(formData.keys()));
        return ctx.json({ error: 'No file provided.' }, 400);
      }

      // Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        return ctx.json({ error: 'File size cannot exceed 10MB.' }, 400);
      }

      const fileExt = file.name.split('.').at(-1) ?? 'bin';
      const fileName = `${ID.unique()}.${fileExt}`;
      const renamedFile = new File([file], fileName, { type: file.type });
      const uploadedFile = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), renamedFile);

      return ctx.json({
        data: {
          fileId: uploadedFile.$id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      });
    } catch (error) {
      console.error('[UPLOAD_COMMENT_FILE]: Error:', error);
      return ctx.json({ error: 'Failed to upload file.' }, 500);
    }
  })
  // List comments for a task
  .get('/', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');
    const taskId = ctx.req.param('taskId') ?? '';

    // Only members can view comments (optional: check membership)
    const commentDocs = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
      Query.equal('taskId', taskId),
      Query.orderAsc('$createdAt'),
    ]);

    // Parse attachments from JSON strings and add image URLs
    const comments = await Promise.all(
      commentDocs.documents.map(async (comment) => {
        const parsedAttachments = parseAttachments(comment.attachments);

        // Add image URLs for image attachments
        const attachmentsWithUrls = parsedAttachments
          ? await Promise.all(
            parsedAttachments.map(async (attachment) => {
              if (attachment.fileType.startsWith('image/')) {
                try {
                  const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, attachment.fileId);
                  const base64 = Buffer.from(arrayBuffer).toString('base64');
                  return {
                    ...attachment,
                    fileUrl: `data:${attachment.fileType};base64,${base64}`,
                  };
                } catch (error) {
                  console.error(`[GET_COMMENT_IMAGE]: Failed to load image ${attachment.fileId}:`, error);
                  return attachment;
                }
              }
              // For non-images, return the attachment as-is (will use download URL)
              return attachment;
            })
          )
          : undefined;

        return {
          ...comment,
          attachments: attachmentsWithUrls,
        };
      })
    );

    return ctx.json({ data: comments });
  })
  // Add a comment to a task
  .post('/', sessionMiddleware, zValidator('json', createCommentSchema.omit({ taskId: true }).extend({
    attachments: z.array(z.object({
      fileId: z.string(),
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
    })).optional(),
  })), async (ctx) => {
    const databases = ctx.get('databases');
    const user = ctx.get('user');
    const { content, authorId, username, parentId, mentions, attachments } = ctx.req.valid('json');
    const taskId = ctx.req.param('taskId') ?? '';

    // Get task to get workspaceId and projectId for logging
    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    // Extract mentions from content if not provided
    // Pattern: @username
    const mentionRegex = /@(\w+)/g
    const extractedMentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      extractedMentions.push(match[1])
    }
    const finalMentions = mentions && mentions.length > 0 ? mentions : (extractedMentions.length > 0 ? extractedMentions : undefined)

    const comment = await databases.createDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      ID.unique(),
      {
        taskId,
        content,
        authorId,
        username,
        parentId: parentId || undefined,
        mentions: finalMentions,
        attachments: stringifyAttachments(attachments),
        // $createdAt and $updatedAt are automatically set by Appwrite
      }
    );

    // Parse attachments and add image URLs for response (same as GET endpoint)
    const parsedAttachments = parseAttachments(comment.attachments);
    const attachmentsWithUrls = parsedAttachments
      ? await Promise.all(
        parsedAttachments.map(async (attachment) => {
          if (attachment.fileType.startsWith('image/')) {
            try {
              const storage = ctx.get('storage');
              const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, attachment.fileId);
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              return {
                ...attachment,
                fileUrl: `data:${attachment.fileType};base64,${base64}`,
              };
            } catch (error) {
              console.error(`[CREATE_COMMENT_IMAGE]: Failed to load image ${attachment.fileId}:`, error);
              return attachment;
            }
          }
          return attachment;
        })
      )
      : undefined;

    const commentWithParsedAttachments = {
      ...comment,
      attachments: attachmentsWithUrls,
    };

    // Send email notifications and log activity in background (non-blocking)
    const workspace = await databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, task.workspaceId);
    const project = task.projectId ? await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, task.projectId) : null;
    const notificationService = new NotificationService(databases);

    // Match mentions to members (by name or email) - exclude comment author
    if (finalMentions && finalMentions.length > 0) {
      const workspaceMembers = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal('workspaceId', task.workspaceId),
      ]);

      const { users } = await import('@/lib/appwrite').then(m => m.createAdminClient());
      const mentionedMemberIds = new Set<string>();
      for (const mention of finalMentions) {
        for (const member of workspaceMembers.documents) {
          // Skip if this is the comment author - they shouldn't get a mention notification
          if (member.userId === user.$id) {
            continue;
          }
          const memberUser = await users.get(member.userId);
          if (
            memberUser.name?.toLowerCase().includes(mention.toLowerCase()) ||
            memberUser.email?.toLowerCase().includes(mention.toLowerCase())
          ) {
            mentionedMemberIds.add(member.$id);
            break; // Found a match, move to next mention
          }
        }
      }

      if (mentionedMemberIds.size > 0) {
        notificationService.notifyCommentMentioned(
          task,
          workspace.name,
          project?.name || 'No Project',
          user.$id,
          content,
          Array.from(mentionedMemberIds)
        );
      }
    }

    // Send email notifications to task assignees (if they weren't mentioned and aren't the author)
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      notificationService.notifyCommentAdded(
        task,
        workspace.name,
        project?.name || 'No Project',
        user.$id,
        content,
        task.assigneeIds,
        user.$id // Exclude comment author
      );
    }

    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.CREATE,
      entityType: ActivityEntityType.COMMENT,
      entityId: comment.$id,
      workspaceId: task.workspaceId,
      projectId: task.projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { new: commentWithParsedAttachments },
      metadata,
    });

    return ctx.json({ data: commentWithParsedAttachments });
  })
  // Update a comment
  .patch('/:commentId', sessionMiddleware, zValidator('json', updateCommentSchema), async (ctx) => {
    const databases = ctx.get('databases');
    const user = ctx.get('user');
    const { content, mentions } = ctx.req.valid('json');
    const taskId = ctx.req.param('taskId') ?? '';
    const commentId = ctx.req.param('commentId') ?? '';

    // Get existing comment to verify ownership
    const existingComment = await databases.getDocument<Comment>(DATABASE_ID, COMMENTS_ID, commentId);

    if (existingComment.taskId !== taskId) {
      return ctx.json({ error: 'Comment does not belong to this task.' }, 400);
    }

    if (existingComment.authorId !== user.$id) {
      return ctx.json({ error: 'You can only edit your own comments.' }, 403);
    }

    // Get task for logging
    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    const updatedComment = await databases.updateDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      commentId,
      {
        content,
        mentions: mentions || existingComment.mentions,
        // $updatedAt is automatically updated by Appwrite
      }
    );

    // Parse attachments for response
    const existingCommentWithParsed = {
      ...existingComment,
      attachments: parseAttachments(existingComment.attachments),
    };
    const updatedCommentWithParsed = {
      ...updatedComment,
      attachments: parseAttachments(updatedComment.attachments),
    };

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.UPDATE,
      entityType: ActivityEntityType.COMMENT,
      entityId: updatedComment.$id,
      workspaceId: task.workspaceId,
      projectId: task.projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { old: existingCommentWithParsed, new: updatedCommentWithParsed },
      metadata,
    });

    return ctx.json({ data: updatedCommentWithParsed });
  })
  // Delete a comment
  .delete('/:commentId', sessionMiddleware, async (ctx) => {
    const databases = ctx.get('databases');
    const storage = ctx.get('storage');
    const user = ctx.get('user');
    const taskId = ctx.req.param('taskId') ?? '';
    const commentId = ctx.req.param('commentId') ?? '';

    // Get existing comment to verify ownership
    const existingComment = await databases.getDocument<Comment>(DATABASE_ID, COMMENTS_ID, commentId);

    if (existingComment.taskId !== taskId) {
      return ctx.json({ error: 'Comment does not belong to this task.' }, 400);
    }

    if (existingComment.authorId !== user.$id) {
      return ctx.json({ error: 'You can only delete your own comments.' }, 403);
    }

    // Delete associated files if they exist
    const parsedAttachments = parseAttachments(existingComment.attachments);
    if (parsedAttachments && parsedAttachments.length > 0) {
      await Promise.all(
        parsedAttachments.map(async (attachment) => {
          try {
            await storage.deleteFile(IMAGES_BUCKET_ID, attachment.fileId);
          } catch (error) {
            // Ignore errors if file doesn't exist
          }
        })
      );
    }

    // Get task for logging
    const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);

    await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, commentId);

    // Log activity
    const userInfo = getUserInfoForLogging(user);
    const metadata = getRequestMetadata(ctx);
    logActivityBackground({
      databases,
      action: ActivityAction.DELETE,
      entityType: ActivityEntityType.COMMENT,
      entityId: commentId,
      workspaceId: task.workspaceId,
      projectId: task.projectId || undefined,
      userId: userInfo.userId,
      username: userInfo.username,
      userEmail: userInfo.userEmail,
      changes: { old: existingComment },
      metadata,
    });

    return ctx.json({ data: { success: true } });
  });

export default app; 
