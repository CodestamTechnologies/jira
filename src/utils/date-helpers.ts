import { format } from 'date-fns';

/**
 * Date utility functions
 * Centralized date formatting and manipulation utilities
 */

/**
 * Gets today's date in YYYY-MM-DD format
 * Memoized to avoid recreating on every render
 */
export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Formats a date string for use in filenames
 * @param date - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export const formatDateForFilename = (date: string): string => {
  return format(new Date(date), 'yyyy-MM-dd');
};

