import { type Models } from 'node-appwrite';

export const PROJECT_STATUSES = ['active', 'paused', 'closed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = Models.Document & {
  projectId?: string;
  name: string;
  description?: string;
  link?: string;
  imageId?: string;
  imageUrl?: string;
  workspaceId: string;
  clientEmail?: string;
  clientAddress?: string;
  clientPhone?: string;
  isClosed?: boolean;
  status?: ProjectStatus;
};
