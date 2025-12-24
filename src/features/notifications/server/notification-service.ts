import type { Databases } from 'node-appwrite';
import { ID, Query } from 'node-appwrite';
import { DATABASE_ID, NOTIFICATIONS_ID } from '@/config/db';
import { NotificationType, type Notification, type NotificationMetadata } from '../types';
import { parseNotificationMetadata } from '../utils/parse-notification-metadata';

/**
 * Service for creating and managing in-app notifications
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Handles only in-app notification operations
 * - Dependency Injection: Receives databases as constructor parameter
 * 
 * Uses non-blocking operations for better scalability
 */
export class InAppNotificationService {
  constructor(private databases: Databases) {}

  /**
   * Create a notification for a user
   * 
   * @param userId - The user ID (from Appwrite Users, not Member ID)
   * @param type - Notification type enum
   * @param title - Notification title (max 200 chars)
   * @param message - Notification message (max 1000 chars)
   * @param link - Optional deep link to relevant page
   * @param metadata - Optional metadata object (stored as JSON string)
   * @returns Created notification document
   * @throws Error if notifications collection is not configured
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: NotificationMetadata
  ): Promise<Notification> {
    if (!NOTIFICATIONS_ID) {
      console.warn('NOTIFICATIONS_ID not configured, skipping notification creation');
      throw new Error('Notifications collection not configured');
    }

    const notification = await this.databases.createDocument<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      ID.unique(),
      {
        userId,
        type,
        title,
        message,
        link: link || undefined,
        read: false,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      }
    );

    return notification;
  }

  /**
   * Create notifications for multiple users in parallel
   * 
   * Optimized for scalability: uses Promise.all for parallel execution
   * Errors for individual notifications are caught and logged, not thrown
   * 
   * @param userIds - Array of user IDs to notify
   * @param type - Notification type enum
   * @param title - Notification title
   * @param message - Notification message
   * @param link - Optional deep link
   * @param metadata - Optional metadata
   */
  async createNotificationsForUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    metadata?: NotificationMetadata
  ): Promise<void> {
    if (userIds.length === 0) return;

    // Create notifications in parallel
    await Promise.all(
      userIds.map((userId) =>
        this.createNotification(userId, type, title, message, link, metadata).catch((error) => {
          console.error(`Failed to create notification for user ${userId}:`, error);
        })
      )
    );
  }

  /**
   * Get notifications for a user with filtering and pagination
   * 
   * Uses Appwrite queries for efficient server-side filtering
   * Automatically parses metadata from JSON strings
   * 
   * @param userId - User ID to fetch notifications for
   * @param options - Filtering and pagination options
   * @returns Paginated list of notifications with total count
   */
  async getNotifications(
    userId: string,
    options: {
      read?: boolean;
      type?: NotificationType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ documents: Notification[]; total: number }> {
    if (!NOTIFICATIONS_ID) {
      return { documents: [], total: 0 };
    }

    const { read, type, limit = 20, offset = 0 } = options;

    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];

    if (read !== undefined) {
      queries.push(Query.equal('read', read));
    }

    if (type !== undefined) {
      queries.push(Query.equal('type', type));
    }

    const result = await this.databases.listDocuments<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      queries
    );

    // Parse metadata from JSON strings using centralized utility
    const documents = result.documents.map((doc) => ({
      ...doc,
      metadata: parseNotificationMetadata(doc.metadata),
    }));

    return { documents, total: result.total };
  }

  /**
   * Get unread notification count for a user
   * 
   * Optimized: Uses limit(1) to only fetch count, not documents
   * Appwrite returns total count even with limit(1)
   * 
   * @param userId - User ID to count unread notifications for
   * @returns Number of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!NOTIFICATIONS_ID) {
      return 0;
    }

    // Use limit(1) for efficiency - we only need the total count
    const result = await this.databases.listDocuments<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      [Query.equal('userId', userId), Query.equal('read', false), Query.limit(1)]
    );

    return result.total;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    if (!NOTIFICATIONS_ID) {
      throw new Error('Notifications collection not configured');
    }

    return await this.databases.updateDocument<Notification>(
      DATABASE_ID,
      NOTIFICATIONS_ID,
      notificationId,
      { read: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   * Optimized: Uses batch update pattern to avoid fetching all notifications
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (!NOTIFICATIONS_ID) {
      return;
    }

    // Use Appwrite's update capability with query to mark all as read in one operation
    // Note: Appwrite doesn't support bulk update directly, so we fetch in batches and update
    const BATCH_SIZE = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.databases.listDocuments<Notification>(
        DATABASE_ID,
        NOTIFICATIONS_ID,
        [
          Query.equal('userId', userId),
          Query.equal('read', false),
          Query.limit(BATCH_SIZE),
          Query.offset(offset),
        ]
      );

      if (batch.documents.length === 0) {
        hasMore = false;
        break;
      }

      // Update batch in parallel
      await Promise.all(
        batch.documents.map((notification) =>
          this.markAsRead(notification.$id).catch((error) => {
            console.error(`Failed to mark notification ${notification.$id} as read:`, error);
          })
        )
      );

      offset += BATCH_SIZE;
      hasMore = batch.documents.length === BATCH_SIZE;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!NOTIFICATIONS_ID) {
      throw new Error('Notifications collection not configured');
    }

    await this.databases.deleteDocument(DATABASE_ID, NOTIFICATIONS_ID, notificationId);
  }
}
