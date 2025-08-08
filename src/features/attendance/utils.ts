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
