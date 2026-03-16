import { type Models } from 'node-appwrite';

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
};
