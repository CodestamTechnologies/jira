import { type Models } from 'node-appwrite';

export type Project = Models.Document & {
  name: string;
  imageId?: string;
  imageUrl?: string;
  workspaceId: string;
  clientEmail?: string;
  clientAddress?: string;
  clientPhone?: string;
  isClosed?: boolean;
};
