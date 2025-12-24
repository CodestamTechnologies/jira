import { format, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Date utility functions
 * Centralized date formatting and manipulation utilities
 * Following DRY principle - single source of truth for date operations
 */

/**
 * Gets today's date in YYYY-MM-DD format
 * Used for date fields that require YYYY-MM-DD format (e.g., attendance date)
 * 
 * @returns Today's date string in YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Gets the start and end of today in UTC timezone
 * Returns ISO strings suitable for Appwrite queries
 * 
 * @returns Object with start and end ISO strings for today
 */
export const getTodayDateRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
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

/**
 * Formats a time string to HH:mm format (24-hour)
 * @param time - ISO time string
 * @returns Formatted time string (HH:mm)
 */
export const formatTime = (time: string): string => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Formats a date string to a human-readable format
 * @param date - ISO date string
 * @returns Formatted date string (e.g., "Monday, January 1, 2024")
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Checks if a date string is today
 * @param date - Date string in YYYY-MM-DD format
 * @returns True if the date is today
 */
export const isToday = (date: string): boolean => {
  const today = getTodayDateString();
  return date === today;
};
