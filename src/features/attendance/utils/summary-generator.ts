/**
 * Summary generation utilities
 * Handles formatting and generation of daily summaries from tasks and comments
 */

import type { Task, Comment } from '@/features/tasks/types';

/**
 * Groups comments by task ID for efficient lookup
 * 
 * @param comments - Array of comments to group
 * @returns Map of task ID to comments array
 */
export const groupCommentsByTaskId = (comments: Comment[]): Map<string, Comment[]> => {
  const commentsByTaskId = new Map<string, Comment[]>();
  
  comments.forEach((comment) => {
    if (!commentsByTaskId.has(comment.taskId)) {
      commentsByTaskId.set(comment.taskId, []);
    }
    commentsByTaskId.get(comment.taskId)!.push(comment);
  });
  
  return commentsByTaskId;
};

/**
 * Formats a single comment for summary display
 * Handles multi-line comments with proper indentation
 * 
 * @param comment - Comment to format
 * @returns Formatted comment string
 */
const formatCommentForSummary = (comment: Comment): string[] => {
  const cleanContent = comment.content.trim();
  if (!cleanContent) return [];
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  if (lines.length === 1) {
    return [`  - ${lines[0]}`];
  }
  
  // Multi-line comment: indent continuation lines
  return lines.map((line, index) => {
    return `  ${index === 0 ? '-' : ' '} ${line.trim()}`;
  });
};

/**
 * Generates a formatted summary from tasks and their comments
 * 
 * @param tasks - Array of tasks to include in summary
 * @param commentsByTaskId - Map of task ID to comments
 * @returns Formatted summary string
 */
export const generateSummaryFromTasks = (
  tasks: Task[],
  commentsByTaskId: Map<string, Comment[]>
): string => {
  // Only include tasks that have comments
  const tasksWithComments = tasks.filter((task) => commentsByTaskId.has(task.$id));
  
  if (tasksWithComments.length === 0) {
    return '';
  }
  
  const summaryParts: string[] = ['Tasks worked on today:'];
  
  tasksWithComments.forEach((task) => {
    const taskComments = commentsByTaskId.get(task.$id) || [];
    summaryParts.push(`\n• ${task.name}`);
    
    taskComments.forEach((comment) => {
      const formattedLines = formatCommentForSummary(comment);
      summaryParts.push(...formattedLines);
    });
  });
  
  return summaryParts.join('\n');
};
