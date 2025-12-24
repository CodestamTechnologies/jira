import { type Models } from 'node-appwrite';

export enum ActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  DOWNLOAD = 'DOWNLOAD',
  SEND_EMAIL = 'SEND_EMAIL',
}

export enum ActivityEntityType {
  TASK = 'TASK',
  PROJECT = 'PROJECT',
  WORKSPACE = 'WORKSPACE',
  MEMBER = 'MEMBER',
  COMMENT = 'COMMENT',
  INVOICE = 'INVOICE',
  EXPENSE = 'EXPENSE',
  ATTENDANCE = 'ATTENDANCE',
  DOCUMENT_NDA = 'DOCUMENT_NDA',
  DOCUMENT_JOINING_LETTER = 'DOCUMENT_JOINING_LETTER',
  DOCUMENT_SALARY_SLIP = 'DOCUMENT_SALARY_SLIP',
  DOCUMENT_INVOICE = 'DOCUMENT_INVOICE',
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
