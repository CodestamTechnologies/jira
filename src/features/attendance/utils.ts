/**
 * Utility functions for the attendance system
 */

export const calculateTotalHours = (checkInTime: string, checkOutTime: string): number => {
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const diffInMs = checkOut.getTime() - checkIn.getTime();
  return diffInMs / (1000 * 60 * 60); // Convert to hours
};

export const determineStatus = (checkInTime: string, totalHours?: number): 'present' | 'late' | 'half-day' => {
  const checkIn = new Date(checkInTime);
  const hour = checkIn.getHours();
  const minute = checkIn.getMinutes();

  // Check if late (after 9:30 AM)
  if (hour > 9 || (hour === 9 && minute > 30)) {
    return 'late';
  }

  // Check if half-day (less than 4 hours)
  if (totalHours && totalHours < 4) {
    return 'half-day';
  }

  return 'present';
};

export const formatTime = (time: string): string => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isToday = (date: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return date === today;
};

export const getLocationDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export const validateLocation = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
};

/**
 * Normalizes text by removing problematic characters and normalizing whitespace
 * Handles special characters, emojis, and various Unicode issues
 */
export const normalizeText = (text: string): string => {
  if (!text) return ''

  return text
    // Normalize Unicode characters (NFD to NFC)
    .normalize('NFD')
    // Remove diacritical marks (accents) if needed, but keep the base characters
    // .replace(/[\u0300-\u036f]/g, '') // Uncomment if you want to remove accents
    // Replace various types of spaces with regular space
    .replace(/[\u2000-\u200B\u2028-\u2029\u00A0]/g, ' ')
    // Replace zero-width characters
    .replace(/[\u200C-\u200D\uFEFF]/g, '')
    // Replace line breaks with spaces
    .replace(/[\r\n]+/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim()
}

/**
 * Counts characters in normalized text (useful for validation)
 */
export const countNormalizedCharacters = (text: string): number => {
  return normalizeText(text).length
}

/**
 * Formats decimal hours into a human-readable "x hours and y minutes" format
 * @param totalHours - Decimal hours (e.g., 12.87)
 * @returns Formatted string (e.g., "12 hours and 52 minutes")
 */
export const formatHoursAndMinutes = (totalHours: number): string => {
  if (!totalHours || totalHours <= 0) {
    return '0 mins'
  }

  const hours = Math.floor(totalHours)
  const decimalPart = totalHours - hours
  const minutes = Math.round(decimalPart * 60)

  // Handle edge cases
  if (hours === 0 && minutes === 0) {
    return '0 mins'
  }

  if (hours === 0) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`
  }

  if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hours'}`
  }

  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} and ${minutes} ${minutes === 1 ? 'min' : 'mins'}`
}
