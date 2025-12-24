/**
 * FormData Builder Utility
 * Centralized utility for building FormData from form values
 * Follows DRY principle - reusable FormData construction
 */

/**
 * Options for building FormData
 */
interface BuildFormDataOptions {
  /** Whether to trim string values */
  trimStrings?: boolean;
  /** Whether to skip empty/undefined values */
  skipEmpty?: boolean;
  /** Custom field processors */
  processors?: Record<string, (value: unknown) => string | File | undefined>;
}

/**
 * Builds FormData from an object
 * Handles common data types and formatting
 * 
 * @param data - Object with form values
 * @param options - Configuration options
 * @returns FormData instance
 */
export const buildFormData = (
  data: Record<string, unknown>,
  options: BuildFormDataOptions = {},
): FormData => {
  const { trimStrings = true, skipEmpty = false, processors = {} } = options;
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined/null values if skipEmpty is true
    if (skipEmpty && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Use custom processor if available
    if (processors[key]) {
      const processed = processors[key](value);
      if (processed !== undefined) {
        formData.append(key, processed);
      }
      continue;
    }

    // Handle File objects
    if (value instanceof File) {
      formData.append(key, value);
      continue;
    }

    // Handle Date objects - format as YYYY-MM-DD
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        continue; // Skip invalid dates
      }
      formData.append(key, value.toISOString().split('T')[0]);
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(key, String(item));
      });
      continue;
    }

    // Handle objects (stringify)
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
      continue;
    }

    // Handle strings
    if (typeof value === 'string') {
      const processedValue = trimStrings ? value.trim() : value;
      if (!skipEmpty || processedValue !== '') {
        formData.append(key, processedValue);
      }
      continue;
    }

    // Handle numbers and booleans
    if (typeof value === 'number' || typeof value === 'boolean') {
      // Skip NaN
      if (typeof value === 'number' && isNaN(value)) {
        continue;
      }
      formData.append(key, String(value));
      continue;
    }
  }

  return formData;
};

/**
 * Creates a FormData builder with predefined processors for expense forms
 * Includes processors for amount, date, and other expense-specific fields
 */
export const createExpenseFormData = (data: {
  amount: number;
  date: Date;
  description: string;
  category: string;
  customCategory?: string;
  projectId?: string;
  workspaceId: string;
  notes?: string;
  status?: string;
  billFile?: File;
}): FormData => {
  const formData = new FormData();

  // Required fields - always append (never skip)
  // Amount - must be valid number (never send empty string or 0 if validation passed)
  if (typeof data.amount === 'number' && !isNaN(data.amount) && data.amount > 0) {
    formData.append('amount', String(data.amount));
  } else {
    // This should never happen if validation passed, but ensure we send a valid number
    throw new Error('Invalid amount: must be a positive number');
  }

  // Date - must be valid date (never send empty string)
  if (data.date instanceof Date && !isNaN(data.date.getTime())) {
    formData.append('date', data.date.toISOString().split('T')[0]);
  } else {
    // This should never happen if validation passed, but ensure we send a valid date
    throw new Error('Invalid date: must be a valid date');
  }

  // Description - must be non-empty string (never send empty string)
  const description = (data.description || '').trim();
  if (description) {
    formData.append('description', description);
  } else {
    throw new Error('Invalid description: must be a non-empty string');
  }

  // Category - must be valid enum value (lowercase to match enum)
  const category = (data.category || 'other').toLowerCase().trim();
  const validCategories = ['travel', 'food', 'office_supplies', 'software', 'equipment', 'utilities', 'marketing', 'other', 'custom'];
  if (category && validCategories.includes(category)) {
    formData.append('category', category);
  } else {
    throw new Error(`Invalid category: ${category} is not a valid expense category. Must be one of: ${validCategories.join(', ')}`);
  }

  // Workspace ID - must be non-empty string (never send empty string)
  const workspaceId = (data.workspaceId || '').trim();
  if (workspaceId) {
    formData.append('workspaceId', workspaceId);
  } else {
    throw new Error('Invalid workspaceId: must be a non-empty string');
  }

  // Optional fields - only append if they have values
  if (data.customCategory && data.customCategory.trim()) {
    formData.append('customCategory', data.customCategory.trim());
  }

  if (data.projectId && data.projectId.trim() && data.projectId !== 'none') {
    formData.append('projectId', data.projectId.trim());
  }

  if (data.notes && data.notes.trim()) {
    formData.append('notes', data.notes.trim());
  }

  if (data.status) {
    formData.append('status', data.status);
  }

  if (data.billFile instanceof File) {
    formData.append('billFile', data.billFile);
  }

  return formData;
};
