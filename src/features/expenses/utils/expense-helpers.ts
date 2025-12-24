import { Receipt, Plane, UtensilsCrossed, ShoppingBag, Laptop, Zap, Megaphone, MoreHorizontal, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ExpenseCategory, ExpenseStatus } from '../types';

/**
 * Expense helper utilities
 * Provides icons, colors, and display text for expenses
 */

/**
 * Get category icon component
 * @param category - Expense category
 * @returns Icon component name (for use with lucide-react)
 */
export const getCategoryIcon = (category: ExpenseCategory | string) => {
  if (typeof category === 'string' && !Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
    return Receipt; // Default icon for custom categories
  }

  switch (category) {
    case ExpenseCategory.TRAVEL:
      return Plane;
    case ExpenseCategory.FOOD:
      return UtensilsCrossed;
    case ExpenseCategory.OFFICE_SUPPLIES:
      return ShoppingBag;
    case ExpenseCategory.SOFTWARE:
      return Laptop;
    case ExpenseCategory.EQUIPMENT:
      return Laptop;
    case ExpenseCategory.UTILITIES:
      return Zap;
    case ExpenseCategory.MARKETING:
      return Megaphone;
    case ExpenseCategory.OTHER:
    case ExpenseCategory.CUSTOM:
    default:
      return Receipt;
  }
};

/**
 * Formats a category enum value for display in UI
 * Converts snake_case to Title Case
 * 
 * @param category - Category enum value (e.g., "office_supplies")
 * @returns Formatted category name (e.g., "Office Supplies")
 */
export const formatCategoryForDisplay = (category: ExpenseCategory | string): string => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Get category display name
 * @param category - Expense category
 * @param customCategory - Custom category text (if category is CUSTOM)
 * @returns Human-readable category name
 */
export const getCategoryName = (category: ExpenseCategory | string, customCategory?: string): string => {
  if (category === ExpenseCategory.CUSTOM && customCategory) {
    return customCategory;
  }

  if (typeof category === 'string' && !Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
    return category; // Return custom string as-is
  }

  switch (category) {
    case ExpenseCategory.TRAVEL:
      return 'Travel';
    case ExpenseCategory.FOOD:
      return 'Food';
    case ExpenseCategory.OFFICE_SUPPLIES:
      return 'Office Supplies';
    case ExpenseCategory.SOFTWARE:
      return 'Software';
    case ExpenseCategory.EQUIPMENT:
      return 'Equipment';
    case ExpenseCategory.UTILITIES:
      return 'Utilities';
    case ExpenseCategory.MARKETING:
      return 'Marketing';
    case ExpenseCategory.OTHER:
      return 'Other';
    case ExpenseCategory.CUSTOM:
      return customCategory || 'Custom';
    default:
      return 'Unknown';
  }
};

/**
 * Get category color (Tailwind CSS class)
 * @param category - Expense category
 * @returns Tailwind color class
 */
export const getCategoryColor = (category: ExpenseCategory | string): string => {
  if (typeof category === 'string' && !Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
    return 'text-muted-foreground';
  }

  switch (category) {
    case ExpenseCategory.TRAVEL:
      return 'text-blue-500';
    case ExpenseCategory.FOOD:
      return 'text-orange-500';
    case ExpenseCategory.OFFICE_SUPPLIES:
      return 'text-purple-500';
    case ExpenseCategory.SOFTWARE:
      return 'text-green-500';
    case ExpenseCategory.EQUIPMENT:
      return 'text-indigo-500';
    case ExpenseCategory.UTILITIES:
      return 'text-yellow-500';
    case ExpenseCategory.MARKETING:
      return 'text-pink-500';
    case ExpenseCategory.OTHER:
    case ExpenseCategory.CUSTOM:
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Get status icon
 * @param status - Expense status
 * @returns Icon component
 */
export const getStatusIcon = (status: ExpenseStatus) => {
  switch (status) {
    case ExpenseStatus.APPROVED:
      return CheckCircle2;
    case ExpenseStatus.REJECTED:
      return XCircle;
    case ExpenseStatus.PENDING:
    default:
      return Clock;
  }
};

/**
 * Get status display name
 * @param status - Expense status
 * @returns Human-readable status name
 */
export const getStatusName = (status: ExpenseStatus): string => {
  switch (status) {
    case ExpenseStatus.APPROVED:
      return 'Approved';
    case ExpenseStatus.REJECTED:
      return 'Rejected';
    case ExpenseStatus.PENDING:
    default:
      return 'Pending';
  }
};

/**
 * Get status color (Tailwind CSS class)
 * @param status - Expense status
 * @returns Tailwind color class
 */
export const getStatusColor = (status: ExpenseStatus): string => {
  switch (status) {
    case ExpenseStatus.APPROVED:
      return 'text-green-500';
    case ExpenseStatus.REJECTED:
      return 'text-red-500';
    case ExpenseStatus.PENDING:
    default:
      return 'text-yellow-500';
  }
};

/**
 * Get status badge variant for shadcn Badge component
 * @param status - Expense status
 * @returns Badge variant
 */
export const getStatusBadgeVariant = (status: ExpenseStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case ExpenseStatus.APPROVED:
      return 'default';
    case ExpenseStatus.REJECTED:
      return 'destructive';
    case ExpenseStatus.PENDING:
    default:
      return 'secondary';
  }
};
