import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

/**
 * Gets yesterday's date range for activity log queries
 * Returns start and end dates in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @returns Object with startDate and endDate for yesterday
 */
export const getYesterdayDateRange = (): { startDate: string; endDate: string } => {
  const yesterday = subDays(new Date(), 1);
  const start = startOfDay(yesterday);
  const end = endOfDay(yesterday);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

/**
 * Gets yesterday's date in YYYY-MM-DD format
 * @returns Yesterday's date string
 */
export const getYesterdayDateString = (): string => {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
};
