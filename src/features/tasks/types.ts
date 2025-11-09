import { Models } from 'node-appwrite';

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export type Task = Models.Document & {
  name: string;
  status: TaskStatus;
  assigneeIds: string[];
  projectId: string;
  workspaceId: string;
  position: number;
  dueDate: string;
  description?: string;
  assignees?: Array<{
    $id: string;
    name: string;
    email?: string;
  }>;
  assignee?: {
    $id: string;
    name: string;
    email?: string;
  };
};

export type Attachment = {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string; // Base64 data URL for images, or download URL for other files
};

export type Comment = Models.Document & {
  taskId: string;
  authorId: string; // references Member.userId
  username: string; // store the author's name at the time of comment
  content: string;
  // Uses Appwrite's default $createdAt and $updatedAt
  parentId?: string; // for nested replies
  mentions?: string[]; // array of userIds mentioned in the comment
  attachments?: string; // JSON string of Attachment[] (Appwrite doesn't support nested arrays)
};

// Helper to parse attachments from JSON string
export const parseAttachments = (attachments?: string): Attachment[] | undefined => {
  if (!attachments) return undefined;
  try {
    return JSON.parse(attachments) as Attachment[];
  } catch {
    return undefined;
  }
};

// Helper to stringify attachments to JSON string
export const stringifyAttachments = (attachments?: Attachment[]): string | undefined => {
  if (!attachments || attachments.length === 0) return undefined;
  return JSON.stringify(attachments);
};
