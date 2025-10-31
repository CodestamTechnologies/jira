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

export type Comment = Models.Document & {
  taskId: string;
  authorId: string; // references Member.userId
  username: string; // store the author's name at the time of comment
  content: string;
  createdAt: string;
};
