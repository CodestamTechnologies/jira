import type { Task } from '@/features/tasks/types';
import { TaskStatus } from '@/features/tasks/types';
import type { Project } from '@/features/projects/types';

/**
 * Task utility functions
 * Centralized task manipulation and transformation utilities
 */

/**
 * Extended Task type with project name for PDF generation
 */
export type TaskWithProjectName = Task & {
  projectName?: string;
  project?: Project;
};

/**
 * Enhances tasks with project names from a project map
 * Follows a fallback chain: projectName -> project.name -> projectMap -> projectId -> 'N/A'
 * 
 * @param tasks - Array of tasks to enhance
 * @param projectMap - Map of projectId to project name
 * @returns Array of tasks with projectName property
 */
export const enhanceTasksWithProjectNames = (
  tasks: Task[],
  projectMap: Map<string, string>
): TaskWithProjectName[] => {
  return tasks.map((task) => {
    // Type-safe project name resolution with fallback chain
    const projectName =
      (task as TaskWithProjectName).projectName ||
      (task as TaskWithProjectName).project?.name ||
      projectMap.get(task.projectId) ||
      task.projectId ||
      'N/A';

    return {
      ...task,
      projectName,
    };
  });
};

/**
 * Filters tasks by status
 * @param tasks - Array of tasks to filter
 * @param status - Task status to filter by
 * @returns Filtered array of tasks
 */
export const filterTasksByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  return tasks.filter((task) => task.status === status);
};


