import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'

import { TaskStatus } from '@/features/tasks/types'

export type TaskSortBy = 'urgency' | 'created-desc' | 'created-asc' | 'due-desc' | 'due-asc' | 'status' | 'project'
export type ProjectSortBy = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'tasks-desc' | 'tasks-asc'

export const useWorkspaceFilters = () => {
  return useQueryStates({
    // Task filters
    taskStatus: parseAsStringEnum(Object.values(TaskStatus)),
    taskProjectId: parseAsString,
    taskAssigneeId: parseAsString,
    taskDueDate: parseAsString,
    taskSortBy: parseAsStringEnum<TaskSortBy>(['urgency', 'created-desc', 'created-asc', 'due-desc', 'due-asc', 'status', 'project']),
    // Project filters
    projectSearch: parseAsString,
    projectSortBy: parseAsStringEnum<ProjectSortBy>(['name-asc', 'name-desc', 'created-desc', 'created-asc', 'tasks-desc', 'tasks-asc']),
  })
}
