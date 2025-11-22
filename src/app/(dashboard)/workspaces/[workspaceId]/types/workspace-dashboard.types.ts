import type { Member } from '@/features/members/types';
import type { Project } from '@/features/projects/types';
import type { Task, TaskStatus } from '@/features/tasks/types';
import type { ProjectSortBy, TaskSortBy } from '@/features/workspaces/hooks/use-workspace-filters';

// Lead type - using any for now to avoid import path issues
export type Lead = {
  $id?: string;
  id?: string;
  assigneeIds?: string[];
  [key: string]: any;
};

export interface MyMemberDetailsProps {
  member: Member;
  tasks: Task[];
  leads: any[];
  projects: Project[];
  attendance: any;
  workspaceId: string;
  totalTasks?: number; // Optional total count for display
}

export interface TaskListProps {
  data: Task[];
  total: number;
  isAdmin: boolean;
  projects: Project[];
  members: Member[];
  filters: {
    taskStatus: TaskStatus | null;
    taskProjectId: string | null;
    taskAssigneeId: string | null;
    taskDueDate: string | null;
    taskSortBy: TaskSortBy | null;
  };
  onFiltersChange: (filters: Partial<{
    taskStatus: TaskStatus | null;
    taskProjectId: string | null;
    taskAssigneeId: string | null;
    taskDueDate: string | null;
    taskSortBy: TaskSortBy | null;
  }>) => void;
}

export interface ProjectListProps {
  data: Project[];
  total: number;
  projectTaskCounts: Record<string, { total: number; backlog: number; people: number }>;
  isAdmin: boolean;
  filters: {
    projectSearch: string | null;
    projectSortBy: ProjectSortBy | null;
  };
  onFiltersChange: (filters: Partial<{
    projectSearch: string | null;
    projectSortBy: ProjectSortBy | null;
  }>) => void;
}

export interface MemberListProps {
  data: Member[];
  total: number;
  tasks: Task[];
  leads: any[];
  projects: Project[];
  teamAttendance: any[];
}

