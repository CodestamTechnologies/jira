/**
 * Date utility functions for attendance feature
 * Provides consistent date range calculations across the application
 */

import { startOfDay, endOfDay } from 'date-fns';

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
 * Gets today's date in YYYY-MM-DD format (for attendance date field)
 * 
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

