/**
 * File Validation Utilities
 * Centralized file validation constants and functions
 * Follows DRY principle - single source of truth for file validation
 */

/**
 * Maximum file size for bill/receipt uploads (10MB)
 */
export const MAX_BILL_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Allowed MIME types for bill/receipt uploads
 */
export const ALLOWED_BILL_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

/**
 * Validates a file for bill/receipt upload
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export const validateBillFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_BILL_FILE_SIZE) {
    return { valid: false, error: 'File size cannot exceed 10MB.' };
  }

  if (!ALLOWED_BILL_FILE_TYPES.includes(file.type as typeof ALLOWED_BILL_FILE_TYPES[number])) {
    return { valid: false, error: 'Invalid file type. Allowed types: PDF, JPG, JPEG, PNG.' };
  }

  return { valid: true };
};

/**
 * Gets human-readable file type description
 */
export const getFileTypeDescription = (): string => {
  return 'PDF, JPG, JPEG, or PNG file (max 10MB)';
};




