import { type Models } from 'node-appwrite';

/**
 * Expense category enum
 * Predefined categories with option for custom category
 */
export enum ExpenseCategory {
  TRAVEL = 'travel',
  FOOD = 'food',
  OFFICE_SUPPLIES = 'office_supplies',
  SOFTWARE = 'software',
  EQUIPMENT = 'equipment',
  UTILITIES = 'utilities',
  MARKETING = 'marketing',
  OTHER = 'other',
  CUSTOM = 'custom', // Allows free-form text category
}

/**
 * Expense status enum
 * For future approval workflow support
 */
export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Expense type definition
 * Extends Appwrite Document with expense-specific fields
 */
export type Expense = Models.Document & {
  amount: number;
  date: string; // YYYY-MM-DD format
  description: string;
  category: ExpenseCategory | string; // String allows custom categories
  customCategory?: string; // Free-form text when category is CUSTOM
  projectId?: string; // Optional - expenses can be workspace-level or project-specific
  workspaceId: string;
  billFileId?: string; // ID of uploaded bill/receipt file in storage
  notes?: string;
  status: ExpenseStatus; // For future approval workflow
  submittedBy: string; // User ID who submitted the expense
  approvedBy?: string; // User ID who approved (for future use)
  environment?: string; // 'development' or 'production' - used to differentiate dev/prod expenses
};

/**
 * Expense with enriched project data
 * Used in UI components that display project information
 */
export type ExpenseWithProject = Expense & {
  projectName?: string;
};
