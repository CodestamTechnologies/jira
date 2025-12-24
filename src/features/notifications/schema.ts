import { z } from 'zod';
import { NotificationType } from './types';

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required.'),
  type: z.nativeEnum(NotificationType, {
    message: 'Notification type is required.',
  }),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title must be less than 200 characters.'),
  message: z.string().trim().min(1, 'Message is required.').max(1000, 'Message must be less than 1000 characters.'),
  link: z.string().trim().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

export const getNotificationsSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required.'),
  read: z.coerce.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
