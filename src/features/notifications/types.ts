import { type Models } from 'node-appwrite';

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  TASK_MENTIONED = 'TASK_MENTIONED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  PROJECT_CREATED = 'PROJECT_CREATED',
  MEMBER_ADDED = 'MEMBER_ADDED',
}

export type NotificationMetadata = {
  taskId?: string;
  projectId?: string;
  workspaceId?: string;
  commentId?: string;
  memberId?: string;
  [key: string]: unknown;
};

export type Notification = Models.Document & {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: string | NotificationMetadata; // Stored as JSON string in Appwrite, parsed when reading
};

