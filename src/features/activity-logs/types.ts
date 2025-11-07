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
  environment?: string; // 'development' or 'production' - used to differentiate dev/prod logs
  changes: string | ActivityChanges; // Stored as JSON string in Appwrite, parsed to ActivityChanges when reading
  metadata?: string | ActivityMetadata; // Stored as JSON string in Appwrite, parsed to ActivityMetadata when reading
};
