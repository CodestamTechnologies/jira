/**
 * Gets the current environment
 * Returns 'development' or 'production'
 */
export const getCurrentEnvironment = (): string => {
  return process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'production';
};
