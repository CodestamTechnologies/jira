import type { Project } from './types'

/**
 * Checks if a project is closed.
 * If isClosed is not defined (undefined), the project is considered open.
 * @param project - The project to check
 * @returns true if the project is closed, false if it's open or undefined
 */
export const isProjectClosed = (project: Project): boolean => {
  return project.isClosed === true
}

/**
 * Checks if a project is open.
 * If isClosed is not defined (undefined), the project is considered open.
 * @param project - The project to check
 * @returns true if the project is open or undefined, false if it's closed
 */
export const isProjectOpen = (project: Project): boolean => {
  return project.isClosed !== true
}
