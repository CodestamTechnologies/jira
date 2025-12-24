import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Query } from 'node-appwrite';

import { DATABASE_ID, NOTIFICATIONS_ID } from '@/config/db';
import { getNotificationsSchema, updateNotificationSchema } from '../schema';
import { sessionMiddleware } from '@/lib/session-middleware';
import { InAppNotificationService } from './notification-service';
import { NotificationType } from '../types';

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', getNotificationsSchema),
    async (ctx) => {
      const user = ctx.get('user');
      const databases = ctx.get('databases');

      const { userId, read, type, limit, offset } = ctx.req.valid('query');

      // Verify user can only access their own notifications
      if (userId !== user.$id) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      const notificationService = new InAppNotificationService(databases);
      const result = await notificationService.getNotifications(userId, {
        read,
        type,
        limit,
        offset,
      });

      return ctx.json({ data: result });
    }
  )
  .get('/count', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');

    const notificationService = new InAppNotificationService(databases);
    const count = await notificationService.getUnreadCount(user.$id);

    return ctx.json({ data: { count } });
  })
  .patch(
    '/:notificationId',
    sessionMiddleware,
    zValidator('json', updateNotificationSchema),
    async (ctx) => {
      const user = ctx.get('user');
      const databases = ctx.get('databases');
      const { notificationId } = ctx.req.param();
      const { read } = ctx.req.valid('json');

      if (!NOTIFICATIONS_ID) {
        return ctx.json({ error: 'Notifications not configured.' }, 500);
      }

      // Verify user owns this notification
      const notification = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId);
      if (notification.userId !== user.$id) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      const notificationService = new InAppNotificationService(databases);

      if (read !== undefined) {
        if (read) {
          await notificationService.markAsRead(notificationId);
        } else {
          // Mark as unread
          await databases.updateDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId, { read: false });
        }
      }

      const updated = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId);
      return ctx.json({ data: updated });
    }
  )
  .post('/:notificationId/read', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');
    const { notificationId } = ctx.req.param();

      if (!NOTIFICATIONS_ID) {
        return ctx.json({ error: 'Notifications not configured.' }, 500);
      }

      // Verify user owns this notification
      const notification = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId);
      if (notification.userId !== user.$id) {
        return ctx.json({ error: 'Unauthorized.' }, 401);
      }

      const notificationService = new InAppNotificationService(databases);
      const updated = await notificationService.markAsRead(notificationId);

      return ctx.json({ data: updated });
    }
  )
  .post('/mark-all-read', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');

    const notificationService = new InAppNotificationService(databases);
    await notificationService.markAllAsRead(user.$id);

    return ctx.json({ data: { success: true } });
  })
  .delete('/:notificationId', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const databases = ctx.get('databases');
    const { notificationId } = ctx.req.param();

    if (!NOTIFICATIONS_ID) {
      return ctx.json({ error: 'Notifications not configured.' }, 500);
    }

    // Verify user owns this notification
    const notification = await databases.getDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId);
    if (notification.userId !== user.$id) {
      return ctx.json({ error: 'Unauthorized.' }, 401);
    }

    const notificationService = new InAppNotificationService(databases);
    await notificationService.deleteNotification(notificationId);

    return ctx.json({ data: { success: true } });
  });

export default app;

