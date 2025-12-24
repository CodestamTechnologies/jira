/**
 * Category Name Formatting Utility
 * Centralized utility for formatting category names for display
 * Follows DRY principle - single source of truth for category formatting
 */

/**
 * Formats a category name for display
 * Converts snake_case to Title Case
 * 
 * @param category - Category string (e.g., "office_supplies")
 * @returns Formatted category name (e.g., "Office Supplies")
 * 
 * @example
 * formatCategoryName("office_supplies") // "Office Supplies"
 * formatCategoryName("travel") // "Travel"
 */
export const formatCategoryName = (category: string): string => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
